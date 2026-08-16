package edc

import (
	"context"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"sync"
	"time"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/payment"

	"github.com/gorilla/websocket"
)

// WSClientConfig holds everything the spec's onboarding process (§2.4)
// issues to a merchant: a paired EDC id, an API key, mTLS client
// cert/key + Prima Vista's root CA, and an ECDSA P-256 signing key.
type WSClientConfig struct {
	URL            string // wss://ecr_ip:port/ws_api_pos/v1/api/
	APIKey         string
	PosID          string // <<mid>><<serial_number>>, spec §3.1.1
	MID            string
	EDCID          string // which paired EDC to send transactions to
	ClientCertPath string
	ClientKeyPath  string
	RootCAPath     string
	SigningKeyPath string
	StationCode    string // 2-digit code embedded in generated transaction ids
}

// WSClient is the spec-accurate live EDCGateway (§2-3): opens an mTLS
// websocket to the ECR Middleware, registers the POS, then correlates
// SEND_TO_EDC/SEND_TO_POS request/response pairs by `uid`. It is wired up
// and ready but exercised only when EDC_MODE=live and real Prima Vista
// credentials/certs are configured — see internal/config.
type WSClient struct {
	cfg     WSClientConfig
	signKey *ecdsa.PrivateKey
	conn    *websocket.Conn

	writeMu sync.Mutex
	pendMu  sync.Mutex
	pending map[string]chan Envelope
}

func NewWSClient(cfg WSClientConfig) (*WSClient, error) {
	signKeyPEM, err := os.ReadFile(cfg.SigningKeyPath)
	if err != nil {
		return nil, fmt.Errorf("edc: read signing key: %w", err)
	}
	signKey, err := LoadECDSAPrivateKeyPEM(signKeyPEM)
	if err != nil {
		return nil, fmt.Errorf("edc: load signing key: %w", err)
	}

	cert, err := tls.LoadX509KeyPair(cfg.ClientCertPath, cfg.ClientKeyPath)
	if err != nil {
		return nil, fmt.Errorf("edc: load client certificate: %w", err)
	}
	caPEM, err := os.ReadFile(cfg.RootCAPath)
	if err != nil {
		return nil, fmt.Errorf("edc: read root CA: %w", err)
	}
	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(caPEM) {
		return nil, fmt.Errorf("edc: root CA file has no usable certificates")
	}

	dialer := websocket.Dialer{
		TLSClientConfig: &tls.Config{
			Certificates: []tls.Certificate{cert},
			RootCAs:      pool,
			MinVersion:   tls.VersionTLS12,
		},
		HandshakeTimeout: 10 * time.Second,
	}
	conn, _, err := dialer.Dial(cfg.URL, nil)
	if err != nil {
		return nil, fmt.Errorf("edc: dial websocket: %w", err)
	}

	c := &WSClient{
		cfg:     cfg,
		signKey: signKey,
		conn:    conn,
		pending: make(map[string]chan Envelope),
	}
	go c.readLoop()

	if err := c.registerPOS(); err != nil {
		conn.Close()
		return nil, err
	}
	return c, nil
}

func newUID() string {
	buf := make([]byte, 32)
	_, _ = rand.Read(buf)
	return base64.RawURLEncoding.EncodeToString(buf)
}

func (c *WSClient) sign(payload any) (string, error) {
	b, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return SignES256(c.signKey, b)
}

// send writes an envelope and, if it expects a correlated reply (anything
// but a fire-and-forget), blocks until one arrives on `pending[uid]` or ctx
// is done.
func (c *WSClient) send(ctx context.Context, msgType MessageType, data any, awaitReply bool) (Envelope, error) {
	uid := newUID()
	sig, err := c.sign(data)
	if err != nil {
		return Envelope{}, err
	}
	env := Envelope{UID: uid, Type: msgType, APIKey: c.cfg.APIKey, Data: data, Signature: sig}

	var replyCh chan Envelope
	if awaitReply {
		replyCh = make(chan Envelope, 1)
		c.pendMu.Lock()
		c.pending[uid] = replyCh
		c.pendMu.Unlock()
		defer func() {
			c.pendMu.Lock()
			delete(c.pending, uid)
			c.pendMu.Unlock()
		}()
	}

	c.writeMu.Lock()
	err = c.conn.WriteJSON(env)
	c.writeMu.Unlock()
	if err != nil {
		return Envelope{}, fmt.Errorf("edc: write message: %w", err)
	}
	if !awaitReply {
		return Envelope{}, nil
	}

	select {
	case reply := <-replyCh:
		return reply, nil
	case <-ctx.Done():
		return Envelope{}, ctx.Err()
	}
}

func (c *WSClient) readLoop() {
	for {
		var env Envelope
		if err := c.conn.ReadJSON(&env); err != nil {
			return // connection closed; caller should redial/reconnect
		}
		c.pendMu.Lock()
		ch, ok := c.pending[env.UID]
		c.pendMu.Unlock()
		if ok {
			ch <- env
		}
		// Messages with no matching pending[uid] (e.g. a middleware-pushed
		// PENDING_MESSAGE per spec §3.4.1) are intentionally dropped here;
		// a fuller implementation would dispatch those to a subscriber.
	}
}

func (c *WSClient) registerPOS() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := c.send(ctx, TypeRegisterPOS, RegisterPOSData{PosID: c.cfg.PosID, MID: c.cfg.MID}, true)
	return err
}

func (c *WSClient) sendTransaction(ctx context.Context, dt DataTransaction) (DataTransaction, error) {
	data := SendToEDCData{EDCID: c.cfg.EDCID, DataTransaction: dt}
	reply, err := c.send(ctx, TypeSendToEDC, data, true)
	if err != nil {
		return DataTransaction{}, err
	}
	replyData, ok := reply.Data.(map[string]any)
	if !ok {
		return DataTransaction{}, fmt.Errorf("edc: unexpected reply data shape")
	}
	b, err := json.Marshal(replyData["data_transaction"])
	if err != nil {
		return DataTransaction{}, err
	}
	var out DataTransaction
	if err := json.Unmarshal(b, &out); err != nil {
		return DataTransaction{}, err
	}
	return out, nil
}

func (c *WSClient) Sale(ctx context.Context, req payment.SaleRequest) (payment.EDCResult, error) {
	txnID := req.TransactionID
	if txnID == "" {
		txnID = GenerateTransactionID(c.cfg.StationCode)
	}
	dt := DataTransaction{
		TransactionType: TxnSaleRegular,
		DataField: &DataField{
			Amount:        strconv.FormatInt(req.Amount, 10),
			TransactionID: txnID,
			CardPan:       req.CardPAN,
		},
	}
	reply, err := c.sendTransaction(ctx, dt)
	if err != nil {
		return payment.EDCResult{}, err
	}
	return toEDCResult(reply), nil
}

func (c *WSClient) Void(ctx context.Context, req payment.VoidRequest) (payment.EDCResult, error) {
	dt := DataTransaction{
		TransactionType: TxnVoidRegular,
		DataField: &DataField{
			TraceNumber:   req.TraceNumber,
			TransactionID: req.TransactionID,
		},
	}
	reply, err := c.sendTransaction(ctx, dt)
	if err != nil {
		return payment.EDCResult{}, err
	}
	return toEDCResult(reply), nil
}

func toEDCResult(dt DataTransaction) payment.EDCResult {
	res := payment.EDCResult{
		Approved:        IsSuccess(dt.ResponseCode),
		ResponseCode:    dt.ResponseCode,
		ResponseMessage: dt.ResponseMessage,
	}
	if dt.DataField != nil {
		f := dt.DataField
		res.Meta = domain.PaymentMeta{
			BankName:     f.BankMember,
			CardLast4:    lastN(f.CardPan, 4),
			ApprovalCode: f.ApprovalCode,
			TerminalID:   f.TerminalID,
			ReferenceNo:  f.ReferenceCode,
		}
	}
	return res
}

func lastN(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[len(s)-n:]
}
