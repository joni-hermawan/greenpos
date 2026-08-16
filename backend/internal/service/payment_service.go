package service

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/payment"
	"greenpos-backend/internal/payment/edc"
	"greenpos-backend/internal/paymentregistry"
	"greenpos-backend/internal/storage"
)

type PaymentService struct {
	transactions *storage.TransactionRepo
	edcTerminals *storage.EDCTerminalRepo
	gateways     *paymentregistry.GatewayRegistry
}

func NewPaymentService(transactions *storage.TransactionRepo, edcTerminals *storage.EDCTerminalRepo, gateways *paymentregistry.GatewayRegistry) *PaymentService {
	return &PaymentService{transactions: transactions, edcTerminals: edcTerminals, gateways: gateways}
}

func (s *PaymentService) requirePending(id string) (domain.Transaction, error) {
	t, ok := s.transactions.FindByID(id)
	if !ok {
		return domain.Transaction{}, apperror.NotFound("Transaksi tidak ditemukan.")
	}
	if t.Status != domain.StatusPending {
		return domain.Transaction{}, apperror.BadRequest("Transaksi sudah diproses sebelumnya.")
	}
	return t, nil
}

func (s *PaymentService) PayCash(id string, amountReceived int64) (domain.Transaction, error) {
	t, err := s.requirePending(id)
	if err != nil {
		return domain.Transaction{}, err
	}
	if amountReceived < t.Total {
		return domain.Transaction{}, apperror.BadRequest("Uang diterima kurang dari total tagihan.")
	}

	return s.transactions.Mutate(id, func(tr *domain.Transaction) error {
		tr.Status = domain.StatusPaid
		tr.Method = domain.MethodCash
		ar := amountReceived
		tr.AmountReceived = &ar
		return nil
	})
}

// PayEDC drives a single saleRegular transaction through the store's
// EDCGateway (simulator by default; the spec-accurate websocket client
// once that store's payment config has live credentials — see
// paymentregistry.GatewayRegistry) and marks the order paid on approval.
func (s *PaymentService) PayEDC(ctx context.Context, id string) (domain.Transaction, error) {
	t, err := s.requirePending(id)
	if err != nil {
		return domain.Transaction{}, err
	}

	gateway := s.gateways.EDCFor(t.EDCTerminalID)
	// The generated transaction id's "xx" suffix is this terminal's own
	// station code (see domain.EDCTerminal) — was previously hardcoded to
	// "01", which only ever happened to be correct while every store had
	// at most one terminal. "01" is still a reasonable fallback when no
	// terminal was resolved (order created before any terminal existed —
	// payment already falls back to the simulator gateway in that case).
	stationCode := "01"
	if t.EDCTerminalID != "" {
		if term, ok := s.edcTerminals.FindByID(t.EDCTerminalID); ok && term.StationCode != "" {
			stationCode = term.StationCode
		}
	}
	txnID := edc.GenerateTransactionID(stationCode)
	result, err := gateway.Sale(ctx, payment.SaleRequest{TransactionID: txnID, Amount: t.Total})
	if err != nil {
		return domain.Transaction{}, apperror.Internal("Gagal menghubungi mesin EDC: " + err.Error())
	}
	if !result.Approved {
		return domain.Transaction{}, apperror.New(http.StatusPaymentRequired,
			fmt.Sprintf("Transaksi EDC ditolak (%s): %s", result.ResponseCode, result.ResponseMessage))
	}

	return s.transactions.Mutate(id, func(tr *domain.Transaction) error {
		tr.Status = domain.StatusPaid
		tr.Method = domain.MethodEDC
		meta := result.Meta
		tr.Meta = &meta
		return nil
	})
}

// QRISCharge creates the charge via that store's QRISGateway (its own
// Midtrans account if configured, simulator otherwise) and records
// bookkeeping on the transaction so QRISStatus knows what order id to poll.
func (s *PaymentService) QRISCharge(ctx context.Context, id string) (payment.ChargeResult, error) {
	t, err := s.requirePending(id)
	if err != nil {
		return payment.ChargeResult{}, err
	}

	result, err := s.gateways.QRISFor(t.StoreID).Charge(ctx, t.ID, t.Total)
	if err != nil {
		return payment.ChargeResult{}, apperror.Internal("Gagal membuat charge QRIS: " + err.Error())
	}

	chargedAt := time.Now()
	if _, err := s.transactions.Mutate(id, func(tr *domain.Transaction) error {
		tr.QRISOrderID = result.OrderID
		tr.QRISChargedAt = &chargedAt
		return nil
	}); err != nil {
		return payment.ChargeResult{}, apperror.Internal(err.Error())
	}
	return result, nil
}

// QRISStatus polls that store's QRISGateway and, on settlement, marks the
// transaction paid exactly once — safe to call repeatedly (the mobile app
// polls this every ~2s while showing the QR code).
func (s *PaymentService) QRISStatus(ctx context.Context, id string) (payment.StatusResult, error) {
	t, ok := s.transactions.FindByID(id)
	if !ok {
		return payment.StatusResult{}, apperror.NotFound("Transaksi tidak ditemukan.")
	}
	if t.Status == domain.StatusPaid {
		res := payment.StatusResult{Status: payment.QRISSettlement}
		if t.Meta != nil {
			res.Meta = *t.Meta
		}
		return res, nil
	}
	if t.QRISOrderID == "" {
		return payment.StatusResult{}, apperror.BadRequest("Belum ada QRIS charge untuk transaksi ini.")
	}

	result, err := s.gateways.QRISFor(t.StoreID).CheckStatus(ctx, t.QRISOrderID)
	if err != nil {
		return payment.StatusResult{}, apperror.Internal("Gagal memeriksa status QRIS: " + err.Error())
	}

	if result.Status == payment.QRISSettlement {
		if _, err := s.transactions.Mutate(id, func(tr *domain.Transaction) error {
			if tr.Status != domain.StatusPending {
				return nil // already settled by a concurrent poll — idempotent no-op
			}
			tr.Status = domain.StatusPaid
			tr.Method = domain.MethodQRIS
			meta := result.Meta
			tr.Meta = &meta
			return nil
		}); err != nil {
			return payment.StatusResult{}, apperror.Internal(err.Error())
		}
	}
	return result, nil
}
