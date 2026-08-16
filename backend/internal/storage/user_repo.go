package storage

import (
	"sync"

	"greenpos-backend/internal/domain"
)

type UserRepo struct {
	mu   sync.RWMutex
	file *JSONFile[[]domain.User]
	data []domain.User
}

func NewUserRepo(path string) (*UserRepo, error) {
	file, err := NewJSONFile(path, seedUsers())
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &UserRepo{file: file, data: data}, nil
}

func (r *UserRepo) List() []domain.User {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.User, len(r.data))
	copy(out, r.data)
	return out
}

func (r *UserRepo) FindByID(id string) (domain.User, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.data {
		if u.ID == id {
			return u, true
		}
	}
	return domain.User{}, false
}

func (r *UserRepo) FindByUsername(username string) (domain.User, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.data {
		if u.Username == username {
			return u, true
		}
	}
	return domain.User{}, false
}

func (r *UserRepo) Create(u domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append(r.data, u)
	return r.file.Save(r.data)
}

func (r *UserRepo) Update(u domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == u.ID {
			r.data[i] = u
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}
