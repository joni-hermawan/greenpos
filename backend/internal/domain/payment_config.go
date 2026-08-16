package domain

// StorePaymentConfig holds the per-store QRIS integration credentials —
// never exposed to the mobile kasir app, only used server-side by the
// payment gateway registry and edited via the back-office's
// admin/store_manager-only endpoints. EDC lives separately now, see
// EDCTerminal: a store's card payments can come from more than one
// physical EDC device, but QRIS stays one Midtrans account per store
// (a separate business entity/bank account per branch, not per till).
type StorePaymentConfig struct {
	StoreID string `json:"storeId"`

	QRISEnabled       bool   `json:"qrisEnabled"`
	MidtransEnv       string `json:"midtransEnv,omitempty"` // "sandbox" | "production"
	MidtransServerKey string `json:"midtransServerKey,omitempty"`
	MidtransClientKey string `json:"midtransClientKey,omitempty"`
}
