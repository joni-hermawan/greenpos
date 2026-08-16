package storage

import (
	"errors"
	"sync"

	"greenpos-backend/internal/domain"
)

var ErrNotFound = errors.New("not found")

type ProductRepo struct {
	mu   sync.RWMutex
	file *JSONFile[[]domain.Product]
	data []domain.Product
}

func NewProductRepo(path string) (*ProductRepo, error) {
	file, err := NewJSONFile(path, seedProducts())
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &ProductRepo{file: file, data: data}, nil
}

func (r *ProductRepo) List() []domain.Product {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.Product, len(r.data))
	copy(out, r.data)
	return out
}

func (r *ProductRepo) FindByID(id string) (domain.Product, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.data {
		if p.ID == id {
			return p, true
		}
	}
	return domain.Product{}, false
}

func (r *ProductRepo) Create(p domain.Product) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append(r.data, p)
	return r.file.Save(r.data)
}

func (r *ProductRepo) Update(p domain.Product) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == p.ID {
			r.data[i] = p
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}

func (r *ProductRepo) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == id {
			r.data = append(r.data[:i], r.data[i+1:]...)
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}

// AdjustStock applies delta (positive to restock, negative to reserve) and
// clamps at zero, mirroring the mock's Math.max(0, ...) behavior.
func (r *ProductRepo) AdjustStock(id string, delta int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == id {
			newStock := x.Stock + delta
			if newStock < 0 {
				newStock = 0
			}
			r.data[i].Stock = newStock
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}
