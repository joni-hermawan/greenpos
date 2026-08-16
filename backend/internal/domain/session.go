package domain

import "time"

// Session is kept in memory only (see storage.SessionRepo) — a server
// restart simply requires re-login, which is acceptable for this demo
// backend and avoids persisting bearer tokens to disk.
type Session struct {
	Token     string
	UserID    string
	ExpiresAt time.Time
}
