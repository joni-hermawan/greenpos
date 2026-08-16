package service

import (
	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"
)

type PromoService struct {
	promos *storage.PromoRepo
	stores *storage.StoreRepo
}

func NewPromoService(promos *storage.PromoRepo, stores *storage.StoreRepo) *PromoService {
	return &PromoService{promos: promos, stores: stores}
}

func (s *PromoService) ListByMerchant(merchantID string) []domain.Promo {
	out := make([]domain.Promo, 0)
	for _, p := range s.promos.List() {
		if p.MerchantID == merchantID {
			out = append(out, p)
		}
	}
	return out
}

// List returns every promo across every merchant — superadmin "all
// merchants" view only.
func (s *PromoService) List() []domain.Promo {
	return s.promos.List()
}

// ListActiveByMerchant is what the mobile kasir app previews discounts
// from (GET /promos/active) — resolves the caller's own store the same
// way TransactionService.Create does, so a promo scoped to a different
// store never shows up here only to be rejected at checkout.
func (s *PromoService) ListActiveByMerchant(merchantID string, caller domain.User) []domain.Promo {
	callerStoreID := resolveCallerStoreID(caller, s.stores)
	out := make([]domain.Promo, 0)
	for _, p := range s.promos.ListActive() {
		if p.MerchantID == merchantID && (len(p.StoreIDs) == 0 || containsStr(p.StoreIDs, callerStoreID)) {
			out = append(out, p)
		}
	}
	return out
}

func (s *PromoService) Create(p domain.Promo) (domain.Promo, error) {
	p.ID = newID("promo")
	if err := s.promos.Create(p); err != nil {
		return domain.Promo{}, apperror.Internal(err.Error())
	}
	return p, nil
}

func (s *PromoService) Update(p domain.Promo, merchantID string) (domain.Promo, error) {
	existing, ok := s.promos.FindByID(p.ID)
	if !ok || existing.MerchantID != merchantID {
		return domain.Promo{}, apperror.NotFound("Promo tidak ditemukan.")
	}
	p.MerchantID = merchantID
	if err := s.promos.Update(p); err != nil {
		return domain.Promo{}, apperror.NotFound("Promo tidak ditemukan.")
	}
	return p, nil
}

func (s *PromoService) Delete(id, merchantID string) error {
	existing, ok := s.promos.FindByID(id)
	if !ok || existing.MerchantID != merchantID {
		return apperror.NotFound("Promo tidak ditemukan.")
	}
	if err := s.promos.Delete(id); err != nil {
		return apperror.NotFound("Promo tidak ditemukan.")
	}
	return nil
}
