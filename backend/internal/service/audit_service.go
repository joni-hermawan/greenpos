package service

import (
	"log"
	"time"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"
)

type AuditService struct {
	repo *storage.AuditLogRepo
}

func NewAuditService(repo *storage.AuditLogRepo) *AuditService {
	return &AuditService{repo: repo}
}

// Log records one action. Fire-and-forget by design — a failed audit
// write is logged to stderr but never blocks or fails the request that
// triggered it (the actual action already succeeded by the time handlers
// call this).
func (s *AuditService) Log(actor domain.User, action, target, detail string) {
	entry := domain.AuditLog{
		ID:         newID("audit"),
		Timestamp:  time.Now(),
		ActorID:    actor.ID,
		ActorName:  actor.Name,
		ActorRole:  actor.Role,
		MerchantID: actor.MerchantID,
		Action:     action,
		Target:     target,
		Detail:     detail,
	}
	if err := s.repo.Append(entry); err != nil {
		log.Printf("audit: failed to record %s by %s: %v", action, actor.Username, err)
	}
}

func (s *AuditService) List(merchantID string, limit int) []domain.AuditLog {
	return s.repo.List(merchantID, limit)
}
