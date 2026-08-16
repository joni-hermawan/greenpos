package storage

import (
	"sync"

	"greenpos-backend/internal/domain"
)

type TransactionRepo struct {
	mu   sync.RWMutex
	file *JSONFile[[]domain.Transaction]
	data []domain.Transaction
}

func NewTransactionRepo(path string) (*TransactionRepo, error) {
	file, err := NewJSONFile(path, []domain.Transaction{})
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &TransactionRepo{file: file, data: data}, nil
}

// Create prepends the transaction (newest first, matching the mock's
// `transactions = [trx, ...transactions]`).
func (r *TransactionRepo) Create(t domain.Transaction) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append([]domain.Transaction{t}, r.data...)
	return r.file.Save(r.data)
}

func (r *TransactionRepo) FindByID(id string) (domain.Transaction, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, t := range r.data {
		if t.ID == id {
			return t, true
		}
	}
	return domain.Transaction{}, false
}

// Mutate loads the transaction, applies fn, and persists it back — the one
// primitive every state-changing use case (pay, void, QRIS charge bookkeeping)
// goes through, so the read-modify-write is always done under the same lock.
func (r *TransactionRepo) Mutate(id string, fn func(*domain.Transaction) error) (domain.Transaction, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := range r.data {
		if r.data[i].ID == id {
			if err := fn(&r.data[i]); err != nil {
				return domain.Transaction{}, err
			}
			if err := r.file.Save(r.data); err != nil {
				return domain.Transaction{}, err
			}
			return r.data[i], nil
		}
	}
	return domain.Transaction{}, ErrNotFound
}

// All returns every transaction regardless of status — used by report/
// platform aggregation, which needs to scan across statuses itself.
func (r *TransactionRepo) All() []domain.Transaction {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.Transaction, len(r.data))
	copy(out, r.data)
	return out
}

func (r *TransactionRepo) ListPending(storeID string) []domain.Transaction {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.Transaction, 0)
	for _, t := range r.data {
		if t.Status != domain.StatusPending {
			continue
		}
		if storeID != "" && t.StoreID != storeID {
			continue
		}
		out = append(out, t)
	}
	return out
}

func (r *TransactionRepo) ListHistory(storeID string, sinceUnix int64) []domain.Transaction {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.Transaction, 0)
	for _, t := range r.data {
		if t.Status == domain.StatusPending {
			continue
		}
		if t.CreatedAt.Unix() < sinceUnix {
			continue
		}
		if storeID != "" && t.StoreID != storeID {
			continue
		}
		out = append(out, t)
	}
	return out
}

// NextInvoiceSeq returns a monotonically increasing counter derived from
// how many transactions exist so far, used to build invoice numbers.
func (r *TransactionRepo) NextInvoiceSeq() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.data) + 1001
}
