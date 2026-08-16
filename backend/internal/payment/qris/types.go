// Package qris integrates QRIS payments via Midtrans's Core API (sandbox),
// per the user's instruction to use Midtrans rather than the TSD EDC
// spec's per-bank QR transaction types.
package qris

// Midtrans Core API request/response shapes — only the fields this backend
// actually reads/writes are modeled (Midtrans returns many more).
// https://docs.midtrans.com/reference/qris-charge (Core API v2)

type chargeRequest struct {
	PaymentType        string             `json:"payment_type"`
	TransactionDetails transactionDetails `json:"transaction_details"`
	QRIS               qrisParams         `json:"qris"`
}

type transactionDetails struct {
	OrderID     string `json:"order_id"`
	GrossAmount int64  `json:"gross_amount"`
}

type qrisParams struct {
	Acquirer string `json:"acquirer"`
}

type chargeResponse struct {
	StatusCode        string   `json:"status_code"`
	StatusMessage     string   `json:"status_message"`
	TransactionID     string   `json:"transaction_id"`
	OrderID           string   `json:"order_id"`
	TransactionStatus string   `json:"transaction_status"`
	QRString          string   `json:"qr_string"`
	Acquirer          string   `json:"acquirer"`
	ExpiryTime        string   `json:"expiry_time"`
	Actions           []action `json:"actions"`
}

type action struct {
	Name   string `json:"name"`
	Method string `json:"method"`
	URL    string `json:"url"`
}

type statusResponse struct {
	StatusCode        string `json:"status_code"`
	TransactionStatus string `json:"transaction_status"`
	OrderID           string `json:"order_id"`
	Acquirer          string `json:"acquirer"`
	TransactionID     string `json:"transaction_id"`
	SettlementTime    string `json:"settlement_time"`
}
