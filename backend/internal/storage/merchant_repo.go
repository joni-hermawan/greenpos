package storage

import (
	"sync"

	"greenpos-backend/internal/domain"
)

type MerchantRepo struct {
	mu   sync.RWMutex
	file *JSONFile[[]domain.Merchant]
	data []domain.Merchant
}

func NewMerchantRepo(path string) (*MerchantRepo, error) {
	file, err := NewJSONFile(path, seedMerchants())
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &MerchantRepo{file: file, data: data}, nil
}

func (r *MerchantRepo) List() []domain.Merchant {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.Merchant, len(r.data))
	copy(out, r.data)
	return out
}

func (r *MerchantRepo) FindByID(id string) (domain.Merchant, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, m := range r.data {
		if m.ID == id {
			return m, true
		}
	}
	return domain.Merchant{}, false
}

func (r *MerchantRepo) Create(m domain.Merchant) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append(r.data, m)
	return r.file.Save(r.data)
}

func (r *MerchantRepo) Update(m domain.Merchant) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == m.ID {
			r.data[i] = m
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}

func (r *MerchantRepo) SetActive(id string, active bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == id {
			r.data[i].Active = active
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}
