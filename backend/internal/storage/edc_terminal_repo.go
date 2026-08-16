package storage

import (
	"sync"

	"greenpos-backend/internal/domain"
)

type EDCTerminalRepo struct {
	mu   sync.RWMutex
	file *JSONFile[[]domain.EDCTerminal]
	data []domain.EDCTerminal
}

func NewEDCTerminalRepo(path string) (*EDCTerminalRepo, error) {
	file, err := NewJSONFile(path, []domain.EDCTerminal{})
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &EDCTerminalRepo{file: file, data: data}, nil
}

func (r *EDCTerminalRepo) List() []domain.EDCTerminal {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.EDCTerminal, len(r.data))
	copy(out, r.data)
	return out
}

func (r *EDCTerminalRepo) FindByID(id string) (domain.EDCTerminal, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, t := range r.data {
		if t.ID == id {
			return t, true
		}
	}
	return domain.EDCTerminal{}, false
}

func (r *EDCTerminalRepo) Create(t domain.EDCTerminal) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append(r.data, t)
	return r.file.Save(r.data)
}

func (r *EDCTerminalRepo) Update(t domain.EDCTerminal) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, x := range r.data {
		if x.ID == t.ID {
			r.data[i] = t
			return r.file.Save(r.data)
		}
	}
	return ErrNotFound
}

func (r *EDCTerminalRepo) Delete(id string) error {
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
