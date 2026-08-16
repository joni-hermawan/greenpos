package storage

import (
	"sync"

	"greenpos-backend/internal/domain"
)

type PromoRepo struct {
	mu   sync.RWMutex
	file *JSONFile[[]domain.Promo]
	data []domain.Promo
}

func NewPromoRepo(path string) (*PromoRepo, error) {
	file, err := NewJSONFile(path, seedPromos())
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &PromoRepo{file: file, data: data}, nil
}

func (r *PromoRepo) List() []domain.Promo {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.Promo, len(r.data))
	copy(out, r.data)
	return out
}

func (r *PromoRepo) ListActive() []domain.Promo {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.Promo, 0, len(r.data))
	for _, p := range r.data {
		if p.Active {
			out = append(out, p)
		}
	}
	return out
}

func (r *PromoRepo) FindByID(id string) (domain.Promo, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.data {
		if p.ID == id {
			return p, true
		}
	}
	return domain.Promo{}, false
}

func (r *PromoRepo) Create(p domain.Promo) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append(r.data, p)
	return r.file.Save(r.data)
}

func (r *PromoRepo) Update(p domain.Promo) error {
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

func (r *PromoRepo) Delete(id string) error {
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
