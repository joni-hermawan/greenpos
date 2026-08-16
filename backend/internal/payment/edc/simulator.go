package edc

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/payment"
)

// Simulator is the default EDCGateway — no hardware, no certs, no
// middleware connection required. It's a Go port of the mock
// generatePaymentMeta() that used to live client-side in
// PaymentMethodSelector.tsx, so behavior is unchanged from the user's
// perspective, just now generated server-side.
type Simulator struct{}

func NewSimulator() *Simulator { return &Simulator{} }

var edcBanks = []string{"BCA", "Mandiri", "BNI", "BRI"}

func randomDigits(n int) string {
	out := make([]byte, n)
	for i := range out {
		d, _ := rand.Int(rand.Reader, big.NewInt(10))
		out[i] = byte('0') + byte(d.Int64())
	}
	return string(out)
}

func randomChoice(options []string) string {
	i, _ := rand.Int(rand.Reader, big.NewInt(int64(len(options))))
	return options[i.Int64()]
}

func (s *Simulator) Sale(ctx context.Context, req payment.SaleRequest) (payment.EDCResult, error) {
	cardType := "Debit"
	if coin, _ := rand.Int(rand.Reader, big.NewInt(2)); coin.Int64() == 1 {
		cardType = "Kredit"
	}
	meta := domain.PaymentMeta{
		CardType:     cardType,
		BankName:     randomChoice(edcBanks),
		CardLast4:    randomDigits(4),
		ApprovalCode: randomDigits(6),
		TerminalID:   fmt.Sprintf("TID%s", randomDigits(8)),
		ReferenceNo:  randomDigits(9),
	}
	return payment.EDCResult{
		Approved:        true,
		ResponseCode:    "00",
		ResponseMessage: ResponseCodes["00"],
		Meta:            meta,
	}, nil
}

func (s *Simulator) Void(ctx context.Context, req payment.VoidRequest) (payment.EDCResult, error) {
	return payment.EDCResult{
		Approved:        true,
		ResponseCode:    "00",
		ResponseMessage: ResponseCodes["00"],
	}, nil
}

// GenerateTransactionID builds the 14-digit YYMMDDHHMMSSxx transaction id
// the spec (§3.3) says ECR should generate, where xx is a 2-digit POS
// station code.
func GenerateTransactionID(posStationCode string) string {
	if len(posStationCode) != 2 {
		posStationCode = "01"
	}
	return time.Now().Format("060102150405") + posStationCode
}
