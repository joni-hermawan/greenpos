package service

import (
	"sort"
	"time"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"
)

type ReportService struct {
	transactions *storage.TransactionRepo
	products     *storage.ProductRepo
	stores       *storage.StoreRepo
}

func NewReportService(transactions *storage.TransactionRepo, products *storage.ProductRepo, stores *storage.StoreRepo) *ReportService {
	return &ReportService{transactions: transactions, products: products, stores: stores}
}

// matches reports a transaction as in-scope only when it belongs to the
// caller's merchant, and (if storeID is given) to that specific store —
// every report is merchant-scoped first, since these endpoints are shared
// by admin/store_manager/finance and must never leak another merchant's
// numbers.
// An empty merchantID means "every merchant" — the superadmin "all
// merchants" view (see resolveMerchantScope), never reachable for a
// merchant-scoped role since their own MerchantID is never empty.
// storeIDs is the caller's data-filter scope (see resolveStoreScope) —
// nil/empty means "every store", non-empty restricts to exactly those.
func (s *ReportService) matches(t domain.Transaction, merchantID string, storeIDs []string) bool {
	if len(storeIDs) > 0 && !containsStr(storeIDs, t.StoreID) {
		return false
	}
	if merchantID == "" {
		return true
	}
	store, ok := s.stores.FindByID(t.StoreID)
	return ok && store.MerchantID == merchantID
}

// Dashboard aggregates the last `days` days of activity within the
// caller's merchant, restricted to storeIDs if given (empty = every store)
// — sales trend, payment-method breakdown, top/least selling products,
// today's totals, and a low-stock count from the merchant's catalog.
func (s *ReportService) Dashboard(merchantID string, storeIDs []string, days int) domain.DashboardData {
	if days <= 0 {
		days = 7
	}
	now := time.Now()
	cutoff := now.AddDate(0, 0, -days)
	today := now.Format("2006-01-02")

	trendByDate := make(map[string]*domain.DailySales)
	var trendOrder []string
	paymentTotals := make(map[string]*domain.PaymentMethodShare)
	productAgg := make(map[string]*domain.ProductPerformance)

	var todayCount int
	var todayRevenue int64

	for _, t := range s.transactions.All() {
		if !s.matches(t, merchantID, storeIDs) || t.Status != domain.StatusPaid {
			continue
		}
		if t.CreatedAt.Before(cutoff) {
			continue
		}
		date := t.CreatedAt.Format("2006-01-02")
		if _, ok := trendByDate[date]; !ok {
			trendByDate[date] = &domain.DailySales{Date: date}
			trendOrder = append(trendOrder, date)
		}
		trendByDate[date].TransactionCount++
		trendByDate[date].Revenue += t.Total

		method := string(t.Method)
		if _, ok := paymentTotals[method]; !ok {
			paymentTotals[method] = &domain.PaymentMethodShare{Method: method}
		}
		paymentTotals[method].PaymentCount++
		paymentTotals[method].TotalAmount += t.Total

		for _, item := range t.Items {
			if _, ok := productAgg[item.ProductID]; !ok {
				productAgg[item.ProductID] = &domain.ProductPerformance{ProductID: item.ProductID, Name: item.Name}
			}
			productAgg[item.ProductID].QtySold += item.Qty
			productAgg[item.ProductID].Revenue += item.UnitPrice * int64(item.Qty)
		}

		if date == today {
			todayCount++
			todayRevenue += t.Total
		}
	}

	sort.Strings(trendOrder)
	salesTrend := make([]domain.DailySales, 0, len(trendOrder))
	for _, d := range trendOrder {
		salesTrend = append(salesTrend, *trendByDate[d])
	}

	paymentBreakdown := make([]domain.PaymentMethodShare, 0, len(paymentTotals))
	for _, v := range paymentTotals {
		paymentBreakdown = append(paymentBreakdown, *v)
	}
	sort.Slice(paymentBreakdown, func(i, j int) bool { return paymentBreakdown[i].TotalAmount > paymentBreakdown[j].TotalAmount })

	allProducts := make([]domain.ProductPerformance, 0, len(productAgg))
	for _, v := range productAgg {
		allProducts = append(allProducts, *v)
	}
	sort.Slice(allProducts, func(i, j int) bool { return allProducts[i].QtySold > allProducts[j].QtySold })
	topProducts := firstN(allProducts, 5)
	leastProducts := lastN2(allProducts, 5)

	lowStockCount := 0
	for _, p := range s.products.List() {
		if (merchantID == "" || p.MerchantID == merchantID) && p.Stock <= p.MinStock {
			lowStockCount++
		}
	}

	return domain.DashboardData{
		SalesTrend:            salesTrend,
		PaymentBreakdown:      paymentBreakdown,
		TopProducts:           topProducts,
		LeastProducts:         leastProducts,
		TodayTransactionCount: todayCount,
		TodayRevenue:          todayRevenue,
		LowStockCount:         lowStockCount,
	}
}

// Reconciliation groups paid transactions by date+method — a simple
// systemTotal/paymentCount view an admin/finance can cross-check against
// the real Midtrans/EDC settlement reports.
func (s *ReportService) Reconciliation(merchantID string, storeIDs []string, days int) []domain.ReconciliationRow {
	if days <= 0 {
		days = 30
	}
	cutoff := time.Now().AddDate(0, 0, -days)

	type key struct{ date, method string }
	rows := make(map[key]*domain.ReconciliationRow)
	var order []key

	for _, t := range s.transactions.All() {
		if !s.matches(t, merchantID, storeIDs) || t.Status != domain.StatusPaid {
			continue
		}
		if t.CreatedAt.Before(cutoff) {
			continue
		}
		k := key{date: t.CreatedAt.Format("2006-01-02"), method: string(t.Method)}
		if _, ok := rows[k]; !ok {
			rows[k] = &domain.ReconciliationRow{Date: k.date, Method: k.method}
			order = append(order, k)
		}
		rows[k].SystemTotal += t.Total
		rows[k].PaymentCount++
	}

	sort.Slice(order, func(i, j int) bool {
		if order[i].date != order[j].date {
			return order[i].date > order[j].date
		}
		return order[i].method < order[j].method
	})
	out := make([]domain.ReconciliationRow, 0, len(order))
	for _, k := range order {
		out = append(out, *rows[k])
	}
	return out
}

func firstN(list []domain.ProductPerformance, n int) []domain.ProductPerformance {
	if len(list) <= n {
		return list
	}
	return list[:n]
}

func lastN2(list []domain.ProductPerformance, n int) []domain.ProductPerformance {
	// Least-selling = the tail of the qty-sold-descending slice, reversed
	// so the worst performer is first.
	if len(list) <= n {
		out := make([]domain.ProductPerformance, len(list))
		copy(out, list)
		reverse(out)
		return out
	}
	tail := list[len(list)-n:]
	out := make([]domain.ProductPerformance, len(tail))
	copy(out, tail)
	reverse(out)
	return out
}

func reverse(list []domain.ProductPerformance) {
	for i, j := 0, len(list)-1; i < j; i, j = i+1, j-1 {
		list[i], list[j] = list[j], list[i]
	}
}
