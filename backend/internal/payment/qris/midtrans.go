package qris

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/payment"
)

const (
	sandboxBaseURL    = "https://api.sandbox.midtrans.com"
	productionBaseURL = "https://api.midtrans.com"
)

// MidtransClient is the real QRISGateway — Midtrans Core API v2, HTTP Basic
// auth with the Server Key as username and an empty password, exactly as
// documented at https://docs.midtrans.com. Requires no extra dependency:
// it's two plain JSON-over-HTTPS calls.
type MidtransClient struct {
	serverKey string
	baseURL   string
	http      *http.Client
}

func NewMidtransClient(serverKey, env string) *MidtransClient {
	base := sandboxBaseURL
	if env == "production" {
		base = productionBaseURL
	}
	return &MidtransClient{
		serverKey: serverKey,
		baseURL:   base,
		http:      &http.Client{Timeout: 15 * time.Second},
	}
}

func (m *MidtransClient) authHeader() string {
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(m.serverKey+":"))
}

func (m *MidtransClient) do(ctx context.Context, method, path string, body any, out any) error {
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reqBody = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, m.baseURL+path, reqBody)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", m.authHeader())

	resp, err := m.http.Do(req)
	if err != nil {
		return fmt.Errorf("midtrans: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 300 {
		return fmt.Errorf("midtrans: %s %s -> %d: %s", method, path, resp.StatusCode, string(respBody))
	}
	return json.Unmarshal(respBody, out)
}

func (m *MidtransClient) Charge(ctx context.Context, orderID string, amount int64) (payment.ChargeResult, error) {
	req := chargeRequest{
		PaymentType: "qris",
		TransactionDetails: transactionDetails{
			OrderID:     orderID,
			GrossAmount: amount,
		},
		QRIS: qrisParams{Acquirer: "gopay"},
	}
	var resp chargeResponse
	if err := m.do(ctx, http.MethodPost, "/v2/charge", req, &resp); err != nil {
		return payment.ChargeResult{}, err
	}

	expires := time.Now().Add(15 * time.Minute)
	if resp.ExpiryTime != "" {
		if t, err := time.ParseInLocation("2006-01-02 15:04:05", resp.ExpiryTime, time.Local); err == nil {
			expires = t
		}
	}
	return payment.ChargeResult{
		OrderID:   resp.OrderID,
		QRString:  resp.QRString,
		ExpiresAt: expires,
	}, nil
}

func (m *MidtransClient) CheckStatus(ctx context.Context, orderID string) (payment.StatusResult, error) {
	var resp statusResponse
	if err := m.do(ctx, http.MethodGet, "/v2/"+orderID+"/status", nil, &resp); err != nil {
		return payment.StatusResult{}, err
	}

	status := payment.QRISPending
	switch resp.TransactionStatus {
	case "settlement", "capture":
		status = payment.QRISSettlement
	case "expire", "cancel", "deny", "failure":
		status = payment.QRISExpired
	}

	return payment.StatusResult{
		Status: status,
		Meta: domain.PaymentMeta{
			QRISAcquirer:   resp.Acquirer,
			QRISMerchantID: resp.OrderID,
			ReferenceNo:    resp.TransactionID,
		},
	}, nil
}
