// Package payment defines the gateway interfaces the payment service
// depends on. Each has two implementations — a simulator (default, no
// external dependency) and a real client (spec-accurate, activated purely
// by config) — so swapping in real payment rails later needs zero code
// changes in the service layer.
package payment

import (
	"context"
	"time"

	"greenpos-backend/internal/domain"
)

type SaleRequest struct {
	TransactionID string // ECR-generated 14-digit YYMMDDHHMMSSxx id, per TSD spec §3.2
	Amount        int64
	CardPAN       string // optional
}

type VoidRequest struct {
	TraceNumber   string
	TransactionID string
}

type EDCResult struct {
	Approved        bool
	ResponseCode    string
	ResponseMessage string
	Meta            domain.PaymentMeta
}

// EDCGateway abstracts the card-payment terminal integration described in
// the TSD spec (§2-3): POS -> ECR Middleware -> EDC Manager -> EDC terminal.
type EDCGateway interface {
	Sale(ctx context.Context, req SaleRequest) (EDCResult, error)
	Void(ctx context.Context, req VoidRequest) (EDCResult, error)
}

type ChargeResult struct {
	OrderID   string
	QRString  string
	ExpiresAt time.Time
}

type QRISStatus string

const (
	QRISPending    QRISStatus = "pending"
	QRISSettlement QRISStatus = "settlement"
	QRISExpired    QRISStatus = "expire"
)

type StatusResult struct {
	Status QRISStatus
	Meta   domain.PaymentMeta
}

// QRISGateway abstracts QRIS payment creation/status via Midtrans's Core
// API (sandbox), per the user's instruction to use Midtrans instead of the
// TSD spec's per-bank QR transaction types.
type QRISGateway interface {
	Charge(ctx context.Context, orderID string, amount int64) (ChargeResult, error)
	CheckStatus(ctx context.Context, orderID string) (StatusResult, error)
}
