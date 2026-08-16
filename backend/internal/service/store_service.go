package service

import (
	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"
)

type StoreService struct {
	stores *storage.StoreRepo
}

func NewStoreService(stores *storage.StoreRepo) *StoreService {
	return &StoreService{stores: stores}
}

// List returns every active store across every merchant — superadmin use.
func (s *StoreService) List() []domain.Store {
	return s.filterActive(s.stores.List())
}

// ListByMerchant scopes to one merchant — used for every merchant-scoped
// role (admin/store_manager/kasir/ppic/finance), including the mobile
// app's existing GET /stores call, which is now auto-scoped to the
// authenticated user's merchant rather than returning everything.
func (s *StoreService) ListByMerchant(merchantID string) []domain.Store {
	all := s.stores.List()
	out := make([]domain.Store, 0, len(all))
	for _, st := range all {
		if st.MerchantID == merchantID {
			out = append(out, st)
		}
	}
	return s.filterActive(out)
}

func (s *StoreService) filterActive(all []domain.Store) []domain.Store {
	out := make([]domain.Store, 0, len(all))
	for _, st := range all {
		if st.Active {
			out = append(out, st)
		}
	}
	return out
}

func (s *StoreService) Create(st domain.Store) (domain.Store, error) {
	st.ID = newID("store")
	st.Active = true
	if err := s.stores.Create(st); err != nil {
		return domain.Store{}, apperror.Internal(err.Error())
	}
	return st, nil
}

// Update changes only name/address (and requires the store to already
// belong to the caller's merchant) — active status goes through SetActive
// so it's never accidentally flipped by a plain edit form.
func (s *StoreService) Update(id, merchantID, name, address string) (domain.Store, error) {
	existing, ok := s.stores.FindByID(id)
	if !ok || existing.MerchantID != merchantID {
		return domain.Store{}, apperror.NotFound("Store tidak ditemukan.")
	}
	existing.Name = name
	existing.Address = address
	if err := s.stores.Update(existing); err != nil {
		return domain.Store{}, apperror.Internal(err.Error())
	}
	return existing, nil
}

func (s *StoreService) SetActive(id string, active bool) (domain.Store, error) {
	st, ok := s.stores.FindByID(id)
	if !ok {
		return domain.Store{}, apperror.NotFound("Store tidak ditemukan.")
	}
	st.Active = active
	if err := s.stores.Update(st); err != nil {
		return domain.Store{}, apperror.Internal(err.Error())
	}
	return st, nil
}
