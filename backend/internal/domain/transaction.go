package domain

import "time"

type TransactionStatus string

const (
	StatusPending TransactionStatus = "pending"
	StatusPaid    TransactionStatus = "paid"
	StatusVoided  TransactionStatus = "voided"
)

type TransactionItem struct {
	ProductID string `json:"productId"`
	Name      string `json:"name"`
	Qty       int    `json:"qty"`
	UnitPrice int64  `json:"unitPrice"`
	Category  string `json:"category"`
}

// Transaction is the full server-side record — persisted as-is in
// transactions.json. Handlers project it into the narrower response shapes
// the mobile app expects (CreatedOrder / PendingTransaction /
// TransactionHistoryRow / TransactionDetail from src/types.ts).
type Transaction struct {
	ID              string            `json:"id"`
	InvoiceNo       string            `json:"invoiceNo"`
	Status          TransactionStatus `json:"status"`
	Method          PaymentMethod     `json:"method,omitempty"`
	AmountReceived  *int64            `json:"amountReceived,omitempty"`
	Meta            *PaymentMeta      `json:"meta,omitempty"`
	Subtotal        int64             `json:"subtotal"`
	Discount        int64             `json:"discount"`
	PromoName       string            `json:"promoName,omitempty"`
	Total           int64             `json:"total"`
	ItemCount       int               `json:"itemCount"`
	CashierName     string            `json:"cashierName"`
	StoreID         string            `json:"storeId"`
	StoreName       string            `json:"storeName"`
	StoreAddress    string            `json:"storeAddress"`
	// EDCTerminalID is resolved once at Create time (same reasoning as
	// StoreID) so a later POST .../pay/edc always uses the terminal that
	// was live when the order was opened, even if the store's terminal
	// list changes in between. Empty means no live terminal was
	// available — payment falls back to the EDC simulator.
	EDCTerminalID   string            `json:"edcTerminalId,omitempty"`
	CreatedAt       time.Time         `json:"createdAt"`
	Items           []TransactionItem `json:"items"`

	// QRIS charge bookkeeping — not exposed to the client directly.
	QRISOrderID string     `json:"qrisOrderId,omitempty"`
	QRISChargedAt *time.Time `json:"qrisChargedAt,omitempty"`
}
