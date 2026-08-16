package service

import (
	"time"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"
)

// PlatformService powers the superadmin's cross-merchant dashboard —
// nothing here is scoped to a single merchant, unlike every other service.
type PlatformService struct {
	merchants    *storage.MerchantRepo
	stores       *storage.StoreRepo
	transactions *storage.TransactionRepo
}

func NewPlatformService(merchants *storage.MerchantRepo, stores *storage.StoreRepo, transactions *storage.TransactionRepo) *PlatformService {
	return &PlatformService{merchants: merchants, stores: stores, transactions: transactions}
}

// stuckPendingThreshold — a pending order open longer than this is
// surfaced to the superadmin as possibly abandoned/stuck (e.g. a cashier
// walked away mid-payment).
const stuckPendingThreshold = 30 * time.Minute

func (s *PlatformService) Dashboard() domain.PlatformDashboard {
	merchants := s.merchants.List()
	stores := s.stores.List()

	storeToMerchant := make(map[string]string, len(stores))
	merchantNames := make(map[string]string, len(merchants))
	for _, st := range stores {
		storeToMerchant[st.ID] = st.MerchantID
	}
	for _, m := range merchants {
		merchantNames[m.ID] = m.Name
	}

	health := make(map[string]*domain.MerchantHealth, len(merchants))
	for _, m := range merchants {
		health[m.ID] = &domain.MerchantHealth{MerchantID: m.ID, MerchantName: m.Name}
	}

	now := time.Now()
	today := now.Format("2006-01-02")
	// Initialized non-nil (not `var stuck []T`) so an empty result marshals
	// to JSON `[]`, not `null` — the frontend does `.length` on this
	// unconditionally.
	stuck := []domain.StuckPendingRow{}
	var todayCount int
	var todayRevenue int64

	for _, t := range s.transactions.All() {
		merchantID := storeToMerchant[t.StoreID]
		h, ok := health[merchantID]
		if !ok {
			continue // store/transaction referencing a merchant that no longer exists
		}

		switch t.Status {
		case domain.StatusPaid:
			if t.CreatedAt.Format("2006-01-02") == today {
				h.PaidCountToday++
				h.PaidTotalToday += t.Total
				todayCount++
				todayRevenue += t.Total
			}
			if h.LastActivityAt == "" || t.CreatedAt.Format(time.RFC3339) > h.LastActivityAt {
				h.LastActivityAt = t.CreatedAt.Format(time.RFC3339)
			}
		case domain.StatusPending:
			h.PendingCount++
			if age := now.Sub(t.CreatedAt); age > stuckPendingThreshold {
				stuck = append(stuck, domain.StuckPendingRow{
					TransactionID: t.ID,
					InvoiceNo:     t.InvoiceNo,
					MerchantName:  merchantNames[merchantID],
					StoreName:     t.StoreName,
					Amount:        t.Total,
					CreatedAt:     t.CreatedAt.Format(time.RFC3339),
					MinutesStuck:  int(age.Minutes()),
				})
			}
		}
	}

	merchantHealth := make([]domain.MerchantHealth, 0, len(health))
	activeMerchants := 0
	for _, m := range merchants {
		if m.Active {
			activeMerchants++
		}
		merchantHealth = append(merchantHealth, *health[m.ID])
	}

	activeStores := 0
	for _, st := range stores {
		if st.Active {
			activeStores++
		}
	}

	return domain.PlatformDashboard{
		MerchantCount:         len(merchants),
		ActiveMerchantCount:   activeMerchants,
		StoreCount:            len(stores),
		ActiveStoreCount:      activeStores,
		TodayTransactionCount: todayCount,
		TodayRevenue:          todayRevenue,
		MerchantHealth:        merchantHealth,
		StuckPending:          stuck,
	}
}
