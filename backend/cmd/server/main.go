// Command server is the GREEN POS backend entrypoint: wires config, JSON
// file repositories, payment gateways, services, and the HTTP API, then
// serves it.
package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"greenpos-backend/internal/config"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/httpapi"
	"greenpos-backend/internal/paymentregistry"
	"greenpos-backend/internal/service"
	"greenpos-backend/internal/storage"
)

func main() {
	cfg := config.Load()

	uploadsDir := filepath.Join(cfg.DataDir, "uploads")
	must(os.MkdirAll(uploadsDir, 0o755))

	userRepo, err := storage.NewUserRepo(filepath.Join(cfg.DataDir, "users.json"))
	must(err)
	merchantRepo, err := storage.NewMerchantRepo(filepath.Join(cfg.DataDir, "merchants.json"))
	must(err)
	storeRepo, err := storage.NewStoreRepo(filepath.Join(cfg.DataDir, "stores.json"))
	must(err)
	productRepo, err := storage.NewProductRepo(filepath.Join(cfg.DataDir, "products.json"))
	must(err)
	promoRepo, err := storage.NewPromoRepo(filepath.Join(cfg.DataDir, "promos.json"))
	must(err)
	transactionRepo, err := storage.NewTransactionRepo(filepath.Join(cfg.DataDir, "transactions.json"))
	must(err)
	paymentConfigRepo, err := storage.NewPaymentConfigRepo(filepath.Join(cfg.DataDir, "store_payment_configs.json"), seedPaymentConfigsFromEnv(cfg))
	must(err)
	edcTerminalRepo, err := storage.NewEDCTerminalRepo(filepath.Join(cfg.DataDir, "edc_terminals.json"))
	must(err)
	must(seedEDCTerminalFromEnv(cfg, edcTerminalRepo))
	auditLogRepo, err := storage.NewAuditLogRepo(filepath.Join(cfg.DataDir, "audit_log.json"))
	must(err)
	sessionRepo := storage.NewSessionRepo()

	gateways := paymentregistry.NewGatewayRegistry(paymentConfigRepo, edcTerminalRepo, paymentregistry.GlobalDefaults{
		EDCClientCertPath: cfg.EDCClientCertPath,
		EDCClientKeyPath:  cfg.EDCClientKeyPath,
		EDCRootCAPath:     cfg.EDCRootCAPath,
		EDCSigningKeyPath: cfg.EDCSigningKeyPath,
	})

	authSvc := service.NewAuthService(userRepo, sessionRepo, storeRepo, merchantRepo, cfg.JWTSecret, cfg.TokenTTLHrs)
	merchantSvc := service.NewMerchantService(merchantRepo)
	storeSvc := service.NewStoreService(storeRepo)
	productSvc := service.NewProductService(productRepo)
	promoSvc := service.NewPromoService(promoRepo, storeRepo)
	userSvc := service.NewUserService(userRepo)
	transactionSvc := service.NewTransactionService(productRepo, promoRepo, storeRepo, transactionRepo, edcTerminalRepo)
	paymentSvc := service.NewPaymentService(transactionRepo, edcTerminalRepo, gateways)
	paymentConfigSvc := service.NewPaymentConfigService(paymentConfigRepo, storeRepo, gateways)
	edcTerminalSvc := service.NewEDCTerminalService(edcTerminalRepo, storeRepo, gateways)
	reportSvc := service.NewReportService(transactionRepo, productRepo, storeRepo)
	platformSvc := service.NewPlatformService(merchantRepo, storeRepo, transactionRepo)
	auditSvc := service.NewAuditService(auditLogRepo)

	server := httpapi.NewServer(httpapi.Services{
		Auth:          authSvc,
		Merchant:      merchantSvc,
		Store:         storeSvc,
		Product:       productSvc,
		Promo:         promoSvc,
		User:          userSvc,
		Transaction:   transactionSvc,
		Payment:       paymentSvc,
		PaymentConfig: paymentConfigSvc,
		EDCTerminal:   edcTerminalSvc,
		Report:        reportSvc,
		Platform:      platformSvc,
		Audit:         auditSvc,
	}, uploadsDir)

	log.Printf("GREEN POS backend listening on :%s (data dir: %s)", cfg.Port, cfg.DataDir)
	log.Printf("Default EDC mode: %s | Default QRIS mode: %s (per-store overrides via back-office)", cfg.EDCMode, qrisMode(cfg))
	log.Printf("Demo accounts (password demo123): admin01, manager01, kasir01, ppic01, finance01, superadmin01")

	if err := http.ListenAndServe(":"+cfg.Port, server.Handler()); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}

// seedPaymentConfigsFromEnv carries today's global .env Midtrans settings
// over to store-1 as its initial QRIS config, so upgrading this server
// doesn't silently revert an already-working QRIS integration back to the
// simulator. Only applied on first run (see storage.NewPaymentConfigRepo)
// — once the file exists, the back-office owns it.
func seedPaymentConfigsFromEnv(cfg config.Config) []domain.StorePaymentConfig {
	return []domain.StorePaymentConfig{
		{
			StoreID:           "store-1",
			QRISEnabled:       cfg.MidtransConfigured(),
			MidtransEnv:       cfg.MidtransEnv,
			MidtransServerKey: cfg.MidtransKey,
			MidtransClientKey: cfg.MidtransClientKey,
		},
	}
}

// seedEDCTerminalFromEnv gives store-1 one initial EDC terminal carrying
// today's global .env EDC_MODE/WS_URL/API_KEY, same upgrade-continuity
// reasoning as seedPaymentConfigsFromEnv above. MID and the per-terminal
// station code were never in .env (they're inherently per-terminal, not
// global) — set them via the back-office's Pengaturan EDC page. Only
// applied once: if edc_terminals.json is non-empty (already has data,
// including from a previous server version's migration), this is a no-op.
func seedEDCTerminalFromEnv(cfg config.Config, repo *storage.EDCTerminalRepo) error {
	if len(repo.List()) > 0 {
		return nil
	}
	return repo.Create(domain.EDCTerminal{
		ID:      "edc-seed-store-1",
		StoreID: "store-1",
		Label:   "Terminal 1",
		Mode:    cfg.EDCMode,
		WSURL:   cfg.EDCWSURL,
		APIKey:  cfg.EDCAPIKey,
		Active:  true,
	})
}

func qrisMode(cfg config.Config) string {
	if cfg.MidtransConfigured() {
		return "midtrans (" + cfg.MidtransEnv + ")"
	}
	return "simulator"
}

func must(err error) {
	if err != nil {
		log.Fatalf("startup failed: %v", err)
	}
}
