package storage

import (
	"sync"

	"greenpos-backend/internal/domain"
)

// auditLogCap bounds how many entries are kept — this is a JSON file, not
// a real database, so an unbounded audit log would eventually make every
// read/write O(huge). 2000 entries is generous for a demo/small merchant
// set while staying fast.
const auditLogCap = 2000

type AuditLogRepo struct {
	mu   sync.Mutex
	file *JSONFile[[]domain.AuditLog]
	data []domain.AuditLog
}

func NewAuditLogRepo(path string) (*AuditLogRepo, error) {
	file, err := NewJSONFile(path, []domain.AuditLog{})
	if err != nil {
		return nil, err
	}
	data, err := file.Load()
	if err != nil {
		return nil, err
	}
	return &AuditLogRepo{file: file, data: data}, nil
}

// Append prepends (newest first) and saves. Errors are the caller's to
// decide how to handle — logging a failed action should never block the
// action itself.
func (r *AuditLogRepo) Append(entry domain.AuditLog) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append([]domain.AuditLog{entry}, r.data...)
	if len(r.data) > auditLogCap {
		r.data = r.data[:auditLogCap]
	}
	return r.file.Save(r.data)
}

// List returns entries newest-first, optionally scoped to one merchant
// (empty merchantID = every merchant, platform-wide view) and capped at
// limit (0 = no cap).
func (r *AuditLogRepo) List(merchantID string, limit int) []domain.AuditLog {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]domain.AuditLog, 0)
	for _, e := range r.data {
		if merchantID != "" && e.MerchantID != merchantID {
			continue
		}
		out = append(out, e)
		if limit > 0 && len(out) >= limit {
			break
		}
	}
	return out
}
