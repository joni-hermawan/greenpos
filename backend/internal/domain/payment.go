package domain

type PaymentMethod string

const (
	MethodCash PaymentMethod = "cash"
	MethodQRIS PaymentMethod = "qris"
	MethodEDC  PaymentMethod = "edc"
)

// PaymentMeta mirrors src/types.ts's PaymentMeta — extra fields printed on
// the receipt depending on payment method. Real EDC/QRIS terminals return
// these from the switching host / Midtrans; the simulator gateways generate
// plausible-looking equivalents with the same shape.
type PaymentMeta struct {
	CardType      string `json:"cardType,omitempty"`
	BankName      string `json:"bankName,omitempty"`
	CardLast4     string `json:"cardLast4,omitempty"`
	ApprovalCode  string `json:"approvalCode,omitempty"`
	TerminalID    string `json:"terminalId,omitempty"`
	ReferenceNo   string `json:"referenceNo,omitempty"`
	QRISAcquirer  string `json:"qrisAcquirer,omitempty"`
	QRISMerchantID string `json:"qrisMerchantId,omitempty"`
}
