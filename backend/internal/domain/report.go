package domain

// Report shapes mirror the reference project's src/app/types.ts
// (DailySales, PaymentMethodShare, ProductPerformance, DashboardData,
// ReconciliationRow) so the web back-office's report pages can be ported
// with minimal adaptation.

type DailySales struct {
	Date             string `json:"date"`
	TransactionCount int    `json:"transactionCount"`
	Revenue          int64  `json:"revenue"`
}

type PaymentMethodShare struct {
	Method       string `json:"method"`
	PaymentCount int    `json:"paymentCount"`
	TotalAmount  int64  `json:"totalAmount"`
}

type ProductPerformance struct {
	ProductID string `json:"productId"`
	Name      string `json:"name"`
	QtySold   int    `json:"qtySold"`
	Revenue   int64  `json:"revenue"`
}

type DashboardData struct {
	SalesTrend             []DailySales         `json:"salesTrend"`
	PaymentBreakdown       []PaymentMethodShare `json:"paymentBreakdown"`
	TopProducts            []ProductPerformance `json:"topProducts"`
	LeastProducts          []ProductPerformance `json:"leastProducts"`
	TodayTransactionCount  int                  `json:"todayTransactionCount"`
	TodayRevenue           int64                `json:"todayRevenue"`
	LowStockCount          int                  `json:"lowStockCount"`
}

type ReconciliationRow struct {
	Date         string `json:"date"`
	Method       string `json:"method"`
	SystemTotal  int64  `json:"systemTotal"`
	PaymentCount int    `json:"paymentCount"`
}
