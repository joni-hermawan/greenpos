package qris

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"sync"
	"time"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/payment"
)

// settleDelay is how long the simulator waits after a charge before
// reporting "settlement" — long enough for the mobile app's poll loop to
// visibly show a "waiting for payment" state, short enough to keep the
// demo snappy (today's mock used a flat 1.5s single-shot wait).
const settleDelay = 3 * time.Second

// Simulator is the default QRISGateway — used whenever MIDTRANS_SERVER_KEY
// is not configured. No network calls; fabricates a plausible qr_string and
// auto-settles after settleDelay, giving the same "just works" demo
// experience the mock frontend had.
type Simulator struct {
	mu      sync.Mutex
	charges map[string]time.Time // orderID -> chargedAt
}

func NewSimulator() *Simulator {
	return &Simulator{charges: make(map[string]time.Time)}
}

func randomDigits(n int) string {
	out := make([]byte, n)
	for i := range out {
		d, _ := rand.Int(rand.Reader, big.NewInt(10))
		out[i] = byte('0') + byte(d.Int64())
	}
	return string(out)
}

func (s *Simulator) Charge(ctx context.Context, orderID string, amount int64) (payment.ChargeResult, error) {
	s.mu.Lock()
	s.charges[orderID] = time.Now()
	s.mu.Unlock()

	return payment.ChargeResult{
		OrderID:   orderID,
		QRString:  fmt.Sprintf("00020101021226650014ID.CO.GREENPOS.WWW01189360091%s0210%s5204581253033605802ID6304SIM%s", randomDigits(12), orderID, randomDigits(4)),
		ExpiresAt: time.Now().Add(15 * time.Minute),
	}, nil
}

func (s *Simulator) CheckStatus(ctx context.Context, orderID string) (payment.StatusResult, error) {
	s.mu.Lock()
	chargedAt, ok := s.charges[orderID]
	s.mu.Unlock()

	if !ok || time.Since(chargedAt) < settleDelay {
		return payment.StatusResult{Status: payment.QRISPending}, nil
	}

	return payment.StatusResult{
		Status: payment.QRISSettlement,
		Meta: domain.PaymentMeta{
			QRISAcquirer:   "GREEN POS QRIS",
			QRISMerchantID: fmt.Sprintf("ID%s", randomDigits(14)),
			ReferenceNo:    randomDigits(12),
		},
	}, nil
}
