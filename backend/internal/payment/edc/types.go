// Package edc models the message contract from
// "TSD On Network Merchant POS - EDC Integration_1.4 -EN.docx" (§2-3):
// a WebSocket connection between POS, an ECR Middleware, and EDC terminals,
// authenticated with mTLS + an API key, with each message additionally
// signed with ES256 (ECDSA P-256 + SHA-256, base64url-encoded).
//
// Only the message types actually needed for this app are implemented:
// REGISTER_POS, SEND_TO_EDC/SEND_TO_POS carrying saleRegular, voidRegular
// and settlement transactions. The spec's per-bank QRIS transaction types
// are intentionally not implemented — QRIS goes through Midtrans instead
// (see internal/payment/qris).
package edc

// MessageType is the top-level `type` field (spec §3.1.2).
type MessageType string

const (
	TypeRegisterPOS     MessageType = "REGISTER_POS"
	TypeRegisterPOSDone MessageType = "REGISTER_POS_DONE"
	TypePairPOS         MessageType = "PAIR_POS"
	TypePairPOSDone     MessageType = "PAIR_POS_DONE"
	TypeUnpairEDC       MessageType = "UNPAIR_EDC"
	TypeUnpairEDCDone   MessageType = "UNPAIR_EDC_DONE"
	TypeGetListEDC      MessageType = "GET_LIST_EDC"
	TypeListEDC         MessageType = "LIST_EDC"
	TypeSendToEDC       MessageType = "SEND_TO_EDC"
	TypeSendToPOS       MessageType = "SEND_TO_POS"
	TypePendingMessage  MessageType = "PENDING_MESSAGE"
)

// TransactionType is data_transaction.transactionType (spec §3.1.3.2). Only
// the subset this app drives is named as constants; the field itself is a
// plain string so unknown values from the middleware still round-trip.
const (
	TxnSaleRegular          = "saleRegular"
	TxnVoidRegular           = "voidRegular"
	TxnSettlement            = "settlement"
	TxnGetLastEcrTransaction = "getLastEcrTransaction"
	TxnGetAnyEcrTransaction  = "getAnyEcrTransaction"
)

// Envelope is the outer message shape shared by every request/response
// (spec §3.1.1 Payload).
type Envelope struct {
	UID       string      `json:"uid"`
	Type      MessageType `json:"type"`
	APIKey    string      `json:"api_key,omitempty"`
	Status    int         `json:"status,omitempty"`
	Data      any         `json:"data"`
	Signature string      `json:"signature,omitempty"`
}

// RegisterPOSData is data for REGISTER_POS (spec §3.2.1).
type RegisterPOSData struct {
	PosID string `json:"pos_id"`
	MID   string `json:"mid,omitempty"`
}

// SendToEDCData is data for SEND_TO_EDC / SEND_TO_POS (spec §3.3).
type SendToEDCData struct {
	EDCID           string          `json:"edc_id"`
	DataTransaction DataTransaction `json:"data_transaction"`
}

// DataTransaction is the data_transaction object (spec §3.1.3).
type DataTransaction struct {
	TransactionType string     `json:"transactionType"`
	ResponseCode    string     `json:"responseCode,omitempty"`
	ResponseMessage string     `json:"responseMessage,omitempty"`
	DataField       *DataField `json:"dataField,omitempty"`
}

// DataField carries every field listed in spec §3.1.3 "Data Field". All
// values are strings on the wire (per spec samples), even numeric ones.
type DataField struct {
	TransactionID   string `json:"transactionId,omitempty"`
	Amount          string `json:"amount,omitempty"`
	TipAmount       string `json:"tipAmount,omitempty"`
	BankMember      string `json:"bankMember,omitempty"`
	TerminalID      string `json:"terminalId,omitempty"`
	MerchantID      string `json:"merchantId,omitempty"`
	CardScheme      string `json:"cardScheme,omitempty"`
	CardPan         string `json:"cardPan,omitempty"`
	EntryMode       string `json:"entryMode,omitempty"`
	TransactionType string `json:"transactionType,omitempty"`
	BatchNumber     string `json:"batchNumber,omitempty"`
	TraceNumber     string `json:"traceNumber,omitempty"`
	Date            string `json:"date,omitempty"`
	Time            string `json:"time,omitempty"`
	ReferenceCode   string `json:"referenceCode,omitempty"`
	ApprovalCode    string `json:"approvalCode,omitempty"`
	TotalAmount     string `json:"totalAmount,omitempty"`
}

// ResponseCodes is the EDC Response Code List from spec §3.5 — codes
// returned by the EDC terminal itself (not the issuing host).
var ResponseCodes = map[string]string{
	"00": "SUCCESS",
	"RV": "Reversal",
	"WJ": "FEATURE NOT ALLOWED",
	"WK": "PLEASE RETRY TRANSACTION",
	"WL": "TERMINAL INVALID PARAM",
	"WM": "WRONG POS MSG, INCOMPLETE POS MSG",
	"WB": "TERMINAL UNKWN TRX ID PARAM",
	"WO": "TERMINAL UNKWN MID PARAM",
	"WP": "TERMINAL UNKWN TID PARAM",
	"WQ": "TERMINAL UNKWN PAN PARAM",
	"WR": "TERMINAL UNKWN EXP PARAM",
	"WS": "TERMINAL UNKWN AMT PARAM",
	"WT": "TERMINAL UNKWN TRACE NO PARAM",
	"WU": "WRONG POS MSG, PLEASE CHECK POS DATA",
	"WV": "TERMINAL UNKWN TRX ID",
	"WW": "TERMINAL INVALID MID",
	"WX": "TERMINAL INVALID TID",
	"WZ": "TERMINAL INVALID AMT",
	"X0": "TERMINAL INVALID TRACE NO",
	"X1": "TERMINAL RECORD NO FOUND",
	"X2": "TERMINAL BATCH EMPTY",
	"X3": "TERMINAL SETTLE FAIL",
	"X4": "TERMINAL COMM ERROR",
	"X5": "TERMINAL CARD NO SUPPORT",
	"X6": "TERMINAL BAD ACCOUNT",
	"X7": "TERMINAL ALREADY VOID",
	"X8": "TERMINAL TXN CANCELED",
	"X9": "TERMINAL MUST SETTLE",
	"XA": "TERMINAL SETTLE HOST1 SUCCESS",
	"XV": "TERMINAL SETTLE HOST2 SUCCESS",
	"XC": "TERMINAL SETTLE ALL SUCCESS",
	"XD": "TRANSACTION FAILED",
	"XE": "TERMINAL TRX NO SUPPORT",
	"XF": "TERMINAL WRONG CRC",
	"XG": "CHECKING CONNECTION FAILED",
	"XH": "CHECKING CONNECTION SUCCESS",
	"XJ": "TERMINAL WRONG PORT",
	"XK": "TERMINAL WRONG PASSWORD",
	"XL": "TERMINAL BATTERY LOW",
	"XN": "NO PENDING ECR DATA",
	"IC": "TERMINAL WRONG PAN",
	"ER": "Other Error",
}

// IsSuccess reports whether an EDC response code indicates an approved
// transaction. Only "00" (SUCCESS) counts — everything else is a decline,
// retry, or error condition per spec §3.5.
func IsSuccess(code string) bool {
	return code == "00"
}
