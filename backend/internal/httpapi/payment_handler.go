package httpapi

import (
	"net/http"
	"time"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

type payResultDTO struct {
	PaymentID string              `json:"paymentId"`
	Status    string              `json:"status"`
	Meta      *domain.PaymentMeta `json:"meta,omitempty"`
}

type payCashRequest struct {
	AmountReceived int64 `json:"amountReceived"`
}

func (s *Server) handlePayCash(w http.ResponseWriter, r *http.Request) {
	var req payCashRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	trx, err := s.svc.Payment.PayCash(r.PathValue("id"), req.AmountReceived)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, payResultDTO{PaymentID: newPaymentID(trx.ID), Status: "paid"})
}

func (s *Server) handlePayEDC(w http.ResponseWriter, r *http.Request) {
	trx, err := s.svc.Payment.PayEDC(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, payResultDTO{PaymentID: newPaymentID(trx.ID), Status: "paid", Meta: trx.Meta})
}

type qrisChargeResponse struct {
	OrderID   string `json:"orderId"`
	QRString  string `json:"qrString"`
	ExpiresAt string `json:"expiresAt"`
}

func (s *Server) handleQRISCharge(w http.ResponseWriter, r *http.Request) {
	result, err := s.svc.Payment.QRISCharge(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, qrisChargeResponse{
		OrderID: result.OrderID, QRString: result.QRString, ExpiresAt: result.ExpiresAt.Format(time.RFC3339),
	})
}

type qrisStatusResponse struct {
	Status string              `json:"status"`
	Meta   *domain.PaymentMeta `json:"meta,omitempty"`
}

func (s *Server) handleQRISStatus(w http.ResponseWriter, r *http.Request) {
	result, err := s.svc.Payment.QRISStatus(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	resp := qrisStatusResponse{Status: string(result.Status)}
	if result.Status == "settlement" {
		resp.Meta = &result.Meta
	}
	writeJSON(w, http.StatusOK, resp)
}

func newPaymentID(transactionID string) string {
	return "pay-" + transactionID
}
