package storage

import (
	"sync"
	"time"

	"greenpos-backend/internal/domain"
)

// SessionRepo is intentionally in-memory only — a server restart just
// requires re-login, which is fine for this demo backend and keeps bearer
// tokens out of the JSON "database".
type SessionRepo struct {
	mu       sync.RWMutex
	sessions map[string]domain.Session
}

func NewSessionRepo() *SessionRepo {
	return &SessionRepo{sessions: make(map[string]domain.Session)}
}

func (r *SessionRepo) Create(s domain.Session) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessions[s.Token] = s
}

func (r *SessionRepo) Find(token string) (domain.Session, bool) {
	r.mu.RLock()
	s, ok := r.sessions[token]
	r.mu.RUnlock()
	if !ok {
		return domain.Session{}, false
	}
	if time.Now().After(s.ExpiresAt) {
		r.Delete(token)
		return domain.Session{}, false
	}
	return s, true
}

func (r *SessionRepo) Delete(token string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.sessions, token)
}
