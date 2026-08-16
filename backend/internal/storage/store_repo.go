package storage

import (
	"sync"

	"greenpos-backend/internal/domain"
)

type StoreRepo struct {
	mu   sync.RWMutex
	file *JSONFile[[]domain.Store]
	data []domain.Store
}

func NewStoreRepo(path string) (*StoreRepo, error) {
	file, err := NewJSONFile(path, seedStores())
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &StoreRepo{file: file, data: data}, nil
}

func (r *StoreRepo) List() []domain.Store {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.Store, len(r.data))
	copy(out, r.data)
	return out
}

func (r *StoreRepo) FindByID(id string) (domain.Store, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, s := range r.data {
		if s.ID == id {
			return s, true
		}
	}
	return domain.Store{}, false
}

func (r *StoreRepo) Create(s domain.Store) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append(r.data, s)
	return r.file.Save(r.data)
}

func (r *StoreRepo) Update(s domain.Store) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == s.ID {
			r.data[i] = s
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}

// Delete is a soft delete (active=false) — stores are referenced by
// historical transactions, so hard-deleting would orphan them.
func (r *StoreRepo) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == id {
			r.data[i].Active = false
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}
