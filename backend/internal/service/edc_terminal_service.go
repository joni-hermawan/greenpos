package service

import (
	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/paymentregistry"
	"greenpos-backend/internal/storage"
)

// EDCTerminalService manages the EDC devices paired to each store — a
// store can have several (see domain.EDCTerminal). Only ever exposed via
// the back-office's "pengaturan-edc" permission; the mobile kasir app
// never sees these values directly, only the effect of them (via
// TransactionService resolving which terminal a sale belongs to).
type EDCTerminalService struct {
	terminals *storage.EDCTerminalRepo
	stores    *storage.StoreRepo
	gateways  *paymentregistry.GatewayRegistry
}

func NewEDCTerminalService(terminals *storage.EDCTerminalRepo, stores *storage.StoreRepo, gateways *paymentregistry.GatewayRegistry) *EDCTerminalService {
	return &EDCTerminalService{terminals: terminals, stores: stores, gateways: gateways}
}

func (s *EDCTerminalService) checkStoreOwnership(storeID, merchantID string) error {
	st, ok := s.stores.FindByID(storeID)
	if !ok || st.MerchantID != merchantID {
		return apperror.NotFound("Store tidak ditemukan.")
	}
	return nil
}

func (s *EDCTerminalService) ListByStore(storeID, merchantID string) ([]domain.EDCTerminal, error) {
	if err := s.checkStoreOwnership(storeID, merchantID); err != nil {
		return nil, err
	}
	out := make([]domain.EDCTerminal, 0)
	for _, t := range s.terminals.List() {
		if t.StoreID == storeID {
			out = append(out, t)
		}
	}
	return out, nil
}

// ListByMerchant powers the cross-store "mapping" view — every terminal
// at every store belonging to merchantID, so an admin can see the whole
// EDC device layout at a glance instead of clicking through store by
// store. Empty merchantID means every terminal across every merchant
// (superadmin "Semua Merchant" investigation view).
func (s *EDCTerminalService) ListByMerchant(merchantID string) []domain.EDCTerminal {
	storeMerchant := make(map[string]string)
	for _, st := range s.stores.List() {
		storeMerchant[st.ID] = st.MerchantID
	}
	out := make([]domain.EDCTerminal, 0)
	for _, t := range s.terminals.List() {
		if merchantID == "" || storeMerchant[t.StoreID] == merchantID {
			out = append(out, t)
		}
	}
	return out
}

func (s *EDCTerminalService) Create(t domain.EDCTerminal, merchantID string) (domain.EDCTerminal, error) {
	if err := s.checkStoreOwnership(t.StoreID, merchantID); err != nil {
		return domain.EDCTerminal{}, err
	}
	if t.Label == "" {
		return domain.EDCTerminal{}, apperror.BadRequest("Nama/label terminal wajib diisi.")
	}
	if t.Mode == "" {
		t.Mode = "simulator"
	}
	t.ID = newID("edc")
	if err := s.terminals.Create(t); err != nil {
		return domain.EDCTerminal{}, apperror.Internal(err.Error())
	}
	return t, nil
}

func (s *EDCTerminalService) Update(t domain.EDCTerminal, merchantID string) (domain.EDCTerminal, error) {
	existing, ok := s.terminals.FindByID(t.ID)
	if !ok {
		return domain.EDCTerminal{}, apperror.NotFound("Terminal tidak ditemukan.")
	}
	if err := s.checkStoreOwnership(existing.StoreID, merchantID); err != nil {
		return domain.EDCTerminal{}, err
	}
	if t.Label == "" {
		return domain.EDCTerminal{}, apperror.BadRequest("Nama/label terminal wajib diisi.")
	}
	if t.Mode == "" {
		t.Mode = "simulator"
	}
	t.ID = existing.ID
	t.StoreID = existing.StoreID // a terminal never moves store after creation
	t.Active = existing.Active   // toggled only via SetActive
	if err := s.terminals.Update(t); err != nil {
		return domain.EDCTerminal{}, apperror.Internal(err.Error())
	}
	s.gateways.Invalidate(t.ID)
	return t, nil
}

func (s *EDCTerminalService) SetActive(id, merchantID string, active bool) (domain.EDCTerminal, error) {
	existing, ok := s.terminals.FindByID(id)
	if !ok {
		return domain.EDCTerminal{}, apperror.NotFound("Terminal tidak ditemukan.")
	}
	if err := s.checkStoreOwnership(existing.StoreID, merchantID); err != nil {
		return domain.EDCTerminal{}, err
	}
	existing.Active = active
	if err := s.terminals.Update(existing); err != nil {
		return domain.EDCTerminal{}, apperror.Internal(err.Error())
	}
	s.gateways.Invalidate(existing.ID)
	return existing, nil
}

func (s *EDCTerminalService) Delete(id, merchantID string) error {
	existing, ok := s.terminals.FindByID(id)
	if !ok {
		return apperror.NotFound("Terminal tidak ditemukan.")
	}
	if err := s.checkStoreOwnership(existing.StoreID, merchantID); err != nil {
		return err
	}
	if err := s.terminals.Delete(id); err != nil {
		return apperror.NotFound("Terminal tidak ditemukan.")
	}
	s.gateways.Invalidate(id)
	return nil
}
