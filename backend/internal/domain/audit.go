package domain

import "time"

// AuditLog is an append-only record of who did what — lets a superadmin
// investigate a merchant/store complaint (e.g. "who changed our QRIS key",
// "who voided this order") without needing database forensics.
type AuditLog struct {
	ID         string    `json:"id"`
	Timestamp  time.Time `json:"timestamp"`
	ActorID    string    `json:"actorId"`
	ActorName  string    `json:"actorName"`
	ActorRole  Role      `json:"actorRole"`
	MerchantID string    `json:"merchantId,omitempty"`
	Action     string    `json:"action"`          // e.g. "product.update", "auth.login"
	Target     string    `json:"target,omitempty"` // human-readable subject, e.g. a product name or invoice no
	Detail     string    `json:"detail,omitempty"`
}
