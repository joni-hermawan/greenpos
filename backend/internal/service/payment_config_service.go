package service

import (
	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/paymentregistry"
	"greenpos-backend/internal/storage"
)

// PaymentConfigService manages per-store EDC/QRIS integration credentials.
// Only ever exposed via admin/store_manager-only endpoints — the mobile
// kasir app never sees these values.
type PaymentConfigService struct {
	configs  *storage.PaymentConfigRepo
	stores   *storage.StoreRepo
	gateways *paymentregistry.GatewayRegistry
}

func NewPaymentConfigService(configs *storage.PaymentConfigRepo, stores *storage.StoreRepo, gateways *paymentregistry.GatewayRegistry) *PaymentConfigService {
	return &PaymentConfigService{configs: configs, stores: stores, gateways: gateways}
}

// checkStoreOwnership ensures the store exists and belongs to merchantID —
// without this, any admin/store_manager could view or edit another
// merchant's EDC/QRIS credentials just by guessing a storeId.
func (s *PaymentConfigService) checkStoreOwnership(storeID, merchantID string) error {
	st, ok := s.stores.FindByID(storeID)
	if !ok || st.MerchantID != merchantID {
		return apperror.NotFound("Store tidak ditemukan.")
	}
	return nil
}

// Get returns the store's config, or a sane simulator-mode default if it
// has never been configured — every store implicitly has a config, it's
// just not persisted until someone saves one.
func (s *PaymentConfigService) Get(storeID, merchantID string) (domain.StorePaymentConfig, error) {
	if err := s.checkStoreOwnership(storeID, merchantID); err != nil {
		return domain.StorePaymentConfig{}, err
	}
	if cfg, ok := s.configs.FindByStoreID(storeID); ok {
		return cfg, nil
	}
	return domain.StorePaymentConfig{StoreID: storeID, MidtransEnv: "sandbox"}, nil
}

func (s *PaymentConfigService) Update(cfg domain.StorePaymentConfig, merchantID string) (domain.StorePaymentConfig, error) {
	if err := s.checkStoreOwnership(cfg.StoreID, merchantID); err != nil {
		return domain.StorePaymentConfig{}, err
	}
	if cfg.MidtransEnv == "" {
		cfg.MidtransEnv = "sandbox"
	}
	if err := s.configs.Upsert(cfg); err != nil {
		return domain.StorePaymentConfig{}, apperror.Internal(err.Error())
	}
	s.gateways.Invalidate(cfg.StoreID)
	return cfg, nil
}
