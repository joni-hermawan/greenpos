// Package paymentregistry resolves per-store payment gateways. It's a
// separate package (not internal/payment itself) specifically to avoid an
// import cycle: it needs the concrete edc/qris builders (which import
// internal/payment for the interfaces they implement), so it can't live
// inside internal/payment without payment importing its own subpackages.
package paymentregistry

import (
	"log"
	"sync"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/payment"
	"greenpos-backend/internal/payment/edc"
	"greenpos-backend/internal/payment/qris"
)

// ConfigLookup is satisfied by *storage.PaymentConfigRepo — declared here
// as an interface (rather than importing internal/storage directly) so
// this package stays a pure gateway layer with no storage dependency.
type ConfigLookup interface {
	FindByStoreID(storeID string) (domain.StorePaymentConfig, bool)
}

// TerminalLookup is satisfied by *storage.EDCTerminalRepo — a store can
// have several EDC terminals (see domain.EDCTerminal), so unlike QRIS,
// EDC gateways resolve per terminal, not per store.
type TerminalLookup interface {
	FindByID(id string) (domain.EDCTerminal, bool)
}

// GlobalDefaults holds the EDC mTLS material that's realistically shared
// across a merchant's stores (one Prima Vista onboarding, one cert bundle)
// — only the fields that legitimately vary per store (MID, API key, WS
// URL, station code) live in StorePaymentConfig.
type GlobalDefaults struct {
	EDCClientCertPath string
	EDCClientKeyPath  string
	EDCRootCAPath     string
	EDCSigningKeyPath string
}

// GatewayRegistry resolves the right payment.EDCGateway (per terminal) or
// payment.QRISGateway (per store), caching built instances (an EDC
// WSClient in particular holds a live websocket connection — expensive to
// rebuild per request). Falls back to the simulator whenever a
// store/terminal has no config, hasn't enabled live/QRIS, or a live
// client fails to connect — a bad config should never take down payments
// for the rest of the merchant.
type GatewayRegistry struct {
	configs   ConfigLookup
	terminals TerminalLookup
	globals   GlobalDefaults

	mu        sync.Mutex
	edcCache  map[string]payment.EDCGateway // keyed by terminal id
	qrisCache map[string]payment.QRISGateway // keyed by store id
}

func NewGatewayRegistry(configs ConfigLookup, terminals TerminalLookup, globals GlobalDefaults) *GatewayRegistry {
	return &GatewayRegistry{
		configs:   configs,
		terminals: terminals,
		globals:   globals,
		edcCache:  make(map[string]payment.EDCGateway),
		qrisCache: make(map[string]payment.QRISGateway),
	}
}

// Invalidate drops any cached gateway keyed by id — a store id (QRIS) or
// a terminal id (EDC), doesn't matter which since the two keyspaces never
// collide. Call after the corresponding config is updated so the next
// transaction/payment picks up new credentials instead of a stale client.
func (r *GatewayRegistry) Invalidate(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.edcCache, id)
	delete(r.qrisCache, id)
}

// EDCFor resolves the gateway for one specific EDC terminal — see
// domain.EDCTerminal; a store can have several, so this is never keyed by
// store id the way QRISFor is.
func (r *GatewayRegistry) EDCFor(terminalID string) payment.EDCGateway {
	r.mu.Lock()
	defer r.mu.Unlock()
	if g, ok := r.edcCache[terminalID]; ok {
		return g
	}
	g := r.buildEDC(terminalID)
	r.edcCache[terminalID] = g
	return g
}

func (r *GatewayRegistry) buildEDC(terminalID string) payment.EDCGateway {
	if terminalID == "" {
		return edc.NewSimulator()
	}
	t, ok := r.terminals.FindByID(terminalID)
	if !ok || !t.Active || t.Mode != "live" || t.WSURL == "" || t.APIKey == "" {
		return edc.NewSimulator()
	}
	client, err := edc.NewWSClient(edc.WSClientConfig{
		URL:            t.WSURL,
		APIKey:         t.APIKey,
		PosID:          t.PosID(),
		MID:            t.MID,
		ClientCertPath: r.globals.EDCClientCertPath,
		ClientKeyPath:  r.globals.EDCClientKeyPath,
		RootCAPath:     r.globals.EDCRootCAPath,
		SigningKeyPath: r.globals.EDCSigningKeyPath,
		StationCode:    t.StationCode,
	})
	if err != nil {
		log.Printf("payment: terminal %s (%s) EDC mode=live requested but connection failed, falling back to simulator: %v", terminalID, t.Label, err)
		return edc.NewSimulator()
	}
	return client
}

func (r *GatewayRegistry) QRISFor(storeID string) payment.QRISGateway {
	r.mu.Lock()
	defer r.mu.Unlock()
	if g, ok := r.qrisCache[storeID]; ok {
		return g
	}
	g := r.buildQRIS(storeID)
	r.qrisCache[storeID] = g
	return g
}

func (r *GatewayRegistry) buildQRIS(storeID string) payment.QRISGateway {
	cfg, ok := r.configs.FindByStoreID(storeID)
	if !ok || !cfg.QRISEnabled || cfg.MidtransServerKey == "" {
		return qris.NewSimulator()
	}
	env := cfg.MidtransEnv
	if env == "" {
		env = "sandbox"
	}
	return qris.NewMidtransClient(cfg.MidtransServerKey, env)
}
