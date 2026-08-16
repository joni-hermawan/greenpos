package storage

import (
	"sync"

	"greenpos-backend/internal/domain"
)

type PaymentConfigRepo struct {
	mu   sync.RWMutex
	file *JSONFile[[]domain.StorePaymentConfig]
	data []domain.StorePaymentConfig
}

// NewPaymentConfigRepo seeds the file with `seed` only if it doesn't exist
// yet — callers pass e.g. the existing global .env Midtrans/EDC values
// pre-applied to store-1, so a fresh install keeps whatever was already
// working instead of silently reverting every store to the simulator.
func NewPaymentConfigRepo(path string, seed []domain.StorePaymentConfig) (*PaymentConfigRepo, error) {
	file, err := NewJSONFile(path, seed)
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &PaymentConfigRepo{file: file, data: data}, nil
}

func (r *PaymentConfigRepo) FindByStoreID(storeID string) (domain.StorePaymentConfig, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, c := range r.data {
		if c.StoreID == storeID {
			return c, true
		}
	}
	return domain.StorePaymentConfig{}, false
}

// Upsert replaces the config for cfg.StoreID, or appends a new row if none
// exists yet — every store implicitly has a config (defaulting to the
// simulator gateways) even before anyone has ever saved one.
func (r *PaymentConfigRepo) Upsert(cfg domain.StorePaymentConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, c := range r.data {
		if c.StoreID == cfg.StoreID {
			r.data[i] = cfg
			return r.file.Save(r.data)
		}
	}
	r.data = append(r.data, cfg)
	return r.file.Save(r.data)
}
