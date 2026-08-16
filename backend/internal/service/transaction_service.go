package service

import (
	"fmt"
	"sort"
	"time"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/promoengine"
	"greenpos-backend/internal/storage"
)

type CreateOrderItem struct {
	ProductID string
	Qty       int
}

type TransactionService struct {
	products     *storage.ProductRepo
	promos       *storage.PromoRepo
	stores       *storage.StoreRepo
	transactions *storage.TransactionRepo
	edcTerminals *storage.EDCTerminalRepo
}

func NewTransactionService(products *storage.ProductRepo, promos *storage.PromoRepo, stores *storage.StoreRepo, transactions *storage.TransactionRepo, edcTerminals *storage.EDCTerminalRepo) *TransactionService {
	return &TransactionService{products: products, promos: promos, stores: stores, transactions: transactions, edcTerminals: edcTerminals}
}

// Create builds an order server-side: price, best-promo match, and stock
// decrement are all computed here from the current catalog — the client
// only ever supplies productId+qty, never prices, mirroring how the mock
// transactionApi.create worked.
func (s *TransactionService) Create(user domain.User, items []CreateOrderItem) (domain.Transaction, error) {
	if len(items) == 0 {
		return domain.Transaction{}, apperror.BadRequest("Keranjang kosong.")
	}

	lines := make([]domain.TransactionItem, 0, len(items))
	promoLines := make([]promoengine.Line, 0, len(items))
	for _, it := range items {
		if it.Qty <= 0 {
			return domain.Transaction{}, apperror.BadRequest("Jumlah item tidak valid.")
		}
		p, ok := s.products.FindByID(it.ProductID)
		if !ok || p.MerchantID != user.MerchantID {
			return domain.Transaction{}, apperror.BadRequest("Produk tidak ditemukan: " + it.ProductID)
		}
		if p.Stock < it.Qty {
			return domain.Transaction{}, apperror.BadRequest(fmt.Sprintf("Stok %s tidak cukup.", p.Name))
		}
		lines = append(lines, domain.TransactionItem{
			ProductID: p.ID, Name: p.Name, Qty: it.Qty, UnitPrice: p.Price, Category: p.Category,
		})
		promoLines = append(promoLines, promoengine.Line{Qty: it.Qty, UnitPrice: p.Price, Category: p.Category})
	}

	for _, it := range items {
		if err := s.products.AdjustStock(it.ProductID, -it.Qty); err != nil {
			return domain.Transaction{}, apperror.Internal(err.Error())
		}
	}

	var subtotal int64
	itemCount := 0
	for _, l := range lines {
		subtotal += l.UnitPrice * int64(l.Qty)
		itemCount += l.Qty
	}

	// Resolved before promo matching below — a promo can be scoped to
	// specific stores within the merchant (domain.Promo.StoreIDs), so which
	// store this sale belongs to has to be known first.
	storeID := resolveCallerStoreID(user, s.stores)
	store, _ := s.stores.FindByID(storeID)
	if store.MerchantID != user.MerchantID {
		return domain.Transaction{}, apperror.BadRequest("Store tidak valid untuk merchant ini.")
	}

	merchantPromos := make([]domain.Promo, 0)
	for _, p := range s.promos.ListActive() {
		if p.MerchantID == user.MerchantID && (len(p.StoreIDs) == 0 || containsStr(p.StoreIDs, storeID)) {
			merchantPromos = append(merchantPromos, p)
		}
	}
	discount := int64(0)
	promoName := ""
	if applied := promoengine.ComputeBestPromo(promoLines, merchantPromos); applied != nil {
		discount = applied.DiscountAmount
		promoName = applied.Promo.Name
	}
	total := subtotal - discount

	// Same reasoning as storeID above: pin the terminal at order-creation
	// time so a later /pay/edc call is unaffected by the store's terminal
	// list changing in between. The cashier's own EDCTerminalID wins if
	// it's still valid/active for this store; otherwise the first active
	// terminal at the store; otherwise none (payment falls back to the
	// EDC simulator).
	edcTerminalID := resolveActiveTerminal(s.edcTerminals, storeID, user.EDCTerminalID)

	trx := domain.Transaction{
		ID:            newID("trx"),
		InvoiceNo:     fmt.Sprintf("INV-%s-%d", time.Now().Format("20060102"), s.transactions.NextInvoiceSeq()),
		Status:        domain.StatusPending,
		Subtotal:      subtotal,
		Discount:      discount,
		PromoName:     promoName,
		Total:         total,
		ItemCount:     itemCount,
		CashierName:   user.Name,
		StoreID:       store.ID,
		StoreName:     store.Name,
		StoreAddress:  store.Address,
		EDCTerminalID: edcTerminalID,
		CreatedAt:     time.Now(),
		Items:         lines,
	}
	if err := s.transactions.Create(trx); err != nil {
		return domain.Transaction{}, apperror.Internal(err.Error())
	}
	return trx, nil
}

// storeIDs is the caller's data-filter scope (see resolveStoreScope) —
// nil/empty means "every store in the merchant", non-empty restricts to
// exactly those stores.
func (s *TransactionService) ListPending(merchantID string, storeIDs []string) []domain.Transaction {
	return s.filterByScope(s.transactions.ListPending(""), merchantID, storeIDs)
}

func (s *TransactionService) ListHistory(merchantID string, storeIDs []string, days int) []domain.Transaction {
	if days <= 0 {
		days = 30
	}
	cutoff := time.Now().AddDate(0, 0, -days).Unix()
	list := s.filterByScope(s.transactions.ListHistory("", cutoff), merchantID, storeIDs)
	sort.Slice(list, func(i, j int) bool { return list[i].CreatedAt.After(list[j].CreatedAt) })
	return list
}

func (s *TransactionService) filterByScope(list []domain.Transaction, merchantID string, storeIDs []string) []domain.Transaction {
	out := make([]domain.Transaction, 0, len(list))
	for _, t := range list {
		if !s.belongsToMerchant(t, merchantID) {
			continue
		}
		if len(storeIDs) > 0 && !containsStr(storeIDs, t.StoreID) {
			continue
		}
		out = append(out, t)
	}
	return out
}

func containsStr(list []string, v string) bool {
	for _, x := range list {
		if x == v {
			return true
		}
	}
	return false
}

// resolveCallerStoreID is which single store a merchant-scoped user
// operates from — their own StoreIDs[0] (data filter) if set, else the
// merchant's first store. Shared by order creation and the active-promos
// list (PromoService) so a promo shown in the mobile cart preview is
// exactly the same one the server will actually apply at checkout.
func resolveCallerStoreID(user domain.User, stores *storage.StoreRepo) string {
	if len(user.StoreIDs) > 0 {
		return user.StoreIDs[0]
	}
	for _, st := range stores.List() {
		if st.MerchantID == user.MerchantID {
			return st.ID
		}
	}
	return ""
}

// resolveActiveTerminal picks which EDC terminal a sale at storeID should
// use — preferredID (the cashier's own User.EDCTerminalID) if it's still
// an active terminal at that store, else the first active terminal
// configured for the store, else "" (no live terminal — EDC payments for
// this sale fall back to the simulator gateway).
func resolveActiveTerminal(terminals *storage.EDCTerminalRepo, storeID, preferredID string) string {
	all := terminals.List()
	if preferredID != "" {
		for _, t := range all {
			if t.ID == preferredID && t.StoreID == storeID && t.Active {
				return preferredID
			}
		}
	}
	for _, t := range all {
		if t.StoreID == storeID && t.Active {
			return t.ID
		}
	}
	return ""
}

func (s *TransactionService) Detail(id, merchantID string) (domain.Transaction, error) {
	t, ok := s.transactions.FindByID(id)
	if !ok || !s.belongsToMerchant(t, merchantID) {
		return domain.Transaction{}, apperror.NotFound("Transaksi tidak ditemukan.")
	}
	return t, nil
}

// belongsToMerchant treats an empty merchantID as "any merchant" — the
// superadmin "all merchants" view (see resolveMerchantScope), never
// reachable for a merchant-scoped role since their own MerchantID is
// never empty.
func (s *TransactionService) belongsToMerchant(t domain.Transaction, merchantID string) bool {
	if merchantID == "" {
		return true
	}
	store, ok := s.stores.FindByID(t.StoreID)
	return ok && store.MerchantID == merchantID
}

// Void cancels a pending order and restocks whatever was reserved for it —
// only pending orders can be cancelled this way (a paid transaction needs a
// refund flow, not a void), matching the swipe-to-cancel UX in Pembayaran.
func (s *TransactionService) Void(id, merchantID string) error {
	t, ok := s.transactions.FindByID(id)
	if !ok || !s.belongsToMerchant(t, merchantID) {
		return apperror.NotFound("Transaksi tidak ditemukan.")
	}
	if t.Status != domain.StatusPending {
		return apperror.BadRequest("Hanya pesanan pending yang bisa dibatalkan.")
	}

	for _, it := range t.Items {
		if err := s.products.AdjustStock(it.ProductID, it.Qty); err != nil {
			return apperror.Internal(err.Error())
		}
	}
	if _, err := s.transactions.Mutate(id, func(tr *domain.Transaction) error {
		tr.Status = domain.StatusVoided
		return nil
	}); err != nil {
		return apperror.Internal(err.Error())
	}
	return nil
}
