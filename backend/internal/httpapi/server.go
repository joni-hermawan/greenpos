// Package httpapi wires the REST API (/api/v1) on top of the service
// layer — one handler file per resource, all using Go's stdlib
// http.ServeMux (1.22+ method+pattern routing), no router dependency.
package httpapi

import (
	"net/http"

	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/service"
)

// Services bundles every service the HTTP layer depends on — passed as one
// struct (rather than a long positional argument list) now that there are
// more than a handful of them.
type Services struct {
	Auth          *service.AuthService
	Merchant      *service.MerchantService
	Store         *service.StoreService
	Product       *service.ProductService
	Promo         *service.PromoService
	User          *service.UserService
	Transaction   *service.TransactionService
	Payment       *service.PaymentService
	PaymentConfig *service.PaymentConfigService
	EDCTerminal   *service.EDCTerminalService
	Report        *service.ReportService
	Platform      *service.PlatformService
	Audit         *service.AuditService
}

type Server struct {
	mux        *http.ServeMux
	svc        Services
	uploadsDir string
}

// uploadsDir is where handleUpload writes image files and where they're
// served back from at /uploads/ — the caller (cmd/server/main.go) is
// responsible for the directory existing (os.MkdirAll) before this runs.
func NewServer(svc Services, uploadsDir string) *Server {
	s := &Server{mux: http.NewServeMux(), svc: svc, uploadsDir: uploadsDir}
	s.routes()
	return s
}

func (s *Server) Handler() http.Handler {
	return withCORS(withLogging(withRecover(s.mux)))
}

func (s *Server) routes() {
	s.mux.HandleFunc("GET /health", s.handleHealth)

	// Auth
	s.mux.HandleFunc("POST /api/v1/auth/login", s.handleLogin)
	s.mux.HandleFunc("POST /api/v1/auth/logout", s.requireAuth(s.handleLogout))
	s.mux.HandleFunc("GET /api/v1/auth/me", s.requireAuth(s.handleMe))
	s.mux.HandleFunc("POST /api/v1/auth/change-password", s.requireAuth(s.handleChangePassword))

	// Platform-only actions no per-user menu permission can ever grant a
	// regular merchant-scoped account — still purely role-based.
	superadminOnly := s.requireRole(domain.RoleSuperadmin)

	// Everything else is gated by whoever has the matching back-office menu
	// page granted on their own account (see domain.User.AllowedPages and
	// the Pengguna page) — replaces the old fixed role-tier groups.
	pengaturanMerchant := s.requirePermission("pengaturan-merchant")
	storesPerm := s.requirePermission("stores")
	qrisConfigPerm := s.requirePermission("pengaturan-qris")
	edcPerm := s.requirePermission("pengaturan-edc")
	produkPerm := s.requirePermission("produk")
	promoPerm := s.requirePermission("promo")
	usersPerm := s.requirePermission("users")
	dashboardPerm := s.requirePermission("dashboard")
	reportingPerm := s.requirePermission("reporting")

	// Merchant — self-service (whoever has "pengaturan-merchant") and
	// platform-wide (superadmin, manages every merchant).
	s.mux.HandleFunc("GET /api/v1/merchants/me", s.requireAuth(s.handleGetMyMerchant))
	s.mux.HandleFunc("PUT /api/v1/merchants/me", pengaturanMerchant(s.handleUpdateMyMerchant))
	s.mux.HandleFunc("GET /api/v1/merchants", superadminOnly(s.handleListMerchants))
	s.mux.HandleFunc("POST /api/v1/merchants", superadminOnly(s.handleCreateMerchant))
	s.mux.HandleFunc("GET /api/v1/merchants/{id}", superadminOnly(s.handleGetMerchant))
	s.mux.HandleFunc("PUT /api/v1/merchants/{id}", superadminOnly(s.handleUpdateMerchant))
	s.mux.HandleFunc("POST /api/v1/merchants/{id}/active", superadminOnly(s.handleSetMerchantActive))

	// Stores
	s.mux.HandleFunc("GET /api/v1/stores", s.requireAuth(s.handleListStores))
	s.mux.HandleFunc("POST /api/v1/stores", storesPerm(s.handleCreateStore))
	s.mux.HandleFunc("PUT /api/v1/stores/{id}", storesPerm(s.handleUpdateStore))
	s.mux.HandleFunc("POST /api/v1/stores/{id}/active", storesPerm(s.handleSetStoreActive))
	s.mux.HandleFunc("GET /api/v1/stores/{id}/payment-config", qrisConfigPerm(s.handleGetPaymentConfig))
	s.mux.HandleFunc("PUT /api/v1/stores/{id}/payment-config", qrisConfigPerm(s.handleUpdatePaymentConfig))

	// EDC terminals — a store can have more than one (many-to-many POS<->EDC
	// per the TSD spec), so this is its own resource rather than folded into
	// payment-config. /edc-terminals (no store id) is the cross-store mapping
	// dashboard: every terminal for the caller's merchant (or ?merchantId= /
	// all merchants for superadmin), so the Pos ID layout is visible at a
	// glance instead of clicking into each store one at a time.
	s.mux.HandleFunc("GET /api/v1/edc-terminals", edcPerm(s.handleListEDCTerminalMapping))
	s.mux.HandleFunc("GET /api/v1/stores/{id}/edc-terminals", edcPerm(s.handleListEDCTerminals))
	s.mux.HandleFunc("POST /api/v1/stores/{id}/edc-terminals", edcPerm(s.handleCreateEDCTerminal))
	s.mux.HandleFunc("PUT /api/v1/edc-terminals/{id}", edcPerm(s.handleUpdateEDCTerminal))
	s.mux.HandleFunc("POST /api/v1/edc-terminals/{id}/active", edcPerm(s.handleSetEDCTerminalActive))
	s.mux.HandleFunc("DELETE /api/v1/edc-terminals/{id}", edcPerm(s.handleDeleteEDCTerminal))

	// Products
	s.mux.HandleFunc("GET /api/v1/products", s.requireAuth(s.handleListProducts))
	s.mux.HandleFunc("POST /api/v1/products", produkPerm(s.handleCreateProduct))
	s.mux.HandleFunc("PUT /api/v1/products/{id}", produkPerm(s.handleUpdateProduct))
	s.mux.HandleFunc("DELETE /api/v1/products/{id}", produkPerm(s.handleDeleteProduct))
	s.mux.HandleFunc("POST /api/v1/products/{id}/adjust-stock", produkPerm(s.handleAdjustStock))

	// Promos
	s.mux.HandleFunc("GET /api/v1/promos/active", s.requireAuth(s.handleListActivePromos))
	s.mux.HandleFunc("GET /api/v1/promos", promoPerm(s.handleListPromos))
	s.mux.HandleFunc("POST /api/v1/promos", promoPerm(s.handleCreatePromo))
	s.mux.HandleFunc("PUT /api/v1/promos/{id}", promoPerm(s.handleUpdatePromo))
	s.mux.HandleFunc("DELETE /api/v1/promos/{id}", promoPerm(s.handleDeletePromo))

	// Users (back-office account management)
	s.mux.HandleFunc("GET /api/v1/users", usersPerm(s.handleListUsers))
	s.mux.HandleFunc("POST /api/v1/users", usersPerm(s.handleCreateUser))
	s.mux.HandleFunc("PUT /api/v1/users/{id}", usersPerm(s.handleUpdateUser))
	s.mux.HandleFunc("POST /api/v1/users/{id}/active", usersPerm(s.handleSetUserActive))
	s.mux.HandleFunc("POST /api/v1/users/{id}/reset-password", usersPerm(s.handleResetPassword))
	s.mux.HandleFunc("POST /api/v1/users/{id}/store-filter", usersPerm(s.handleSetStoreFilter))
	s.mux.HandleFunc("POST /api/v1/users/{id}/edc-terminal", usersPerm(s.handleSetUserEDCTerminal))
	s.mux.HandleFunc("POST /api/v1/users/{id}/reassign-merchant", superadminOnly(s.handleReassignMerchant))

	// Transactions
	s.mux.HandleFunc("POST /api/v1/transactions", s.requireAuth(s.handleCreateTransaction))
	s.mux.HandleFunc("GET /api/v1/transactions/pending", s.requireAuth(s.handleListPending))
	s.mux.HandleFunc("GET /api/v1/transactions/history", s.requireAuth(s.handleListHistory))
	s.mux.HandleFunc("GET /api/v1/transactions/{id}", s.requireAuth(s.handleTransactionDetail))
	s.mux.HandleFunc("POST /api/v1/transactions/{id}/void", s.requireAuth(s.handleVoidTransaction))

	// Payments
	s.mux.HandleFunc("POST /api/v1/transactions/{id}/pay/cash", s.requireAuth(s.handlePayCash))
	s.mux.HandleFunc("POST /api/v1/transactions/{id}/pay/edc", s.requireAuth(s.handlePayEDC))
	s.mux.HandleFunc("POST /api/v1/transactions/{id}/pay/qris/charge", s.requireAuth(s.handleQRISCharge))
	s.mux.HandleFunc("GET /api/v1/transactions/{id}/pay/qris/status", s.requireAuth(s.handleQRISStatus))

	// Reports
	s.mux.HandleFunc("GET /api/v1/reports/dashboard", dashboardPerm(s.handleReportDashboard))
	s.mux.HandleFunc("GET /api/v1/reports/reconciliation", reportingPerm(s.handleReportReconciliation))

	// Platform (superadmin)
	s.mux.HandleFunc("GET /api/v1/platform/dashboard", superadminOnly(s.handlePlatformDashboard))

	// Audit trail (superadmin) — investigate a merchant/store complaint by
	// seeing who changed/did what. ?merchantId= narrows to one merchant.
	s.mux.HandleFunc("GET /api/v1/audit-log", superadminOnly(s.handleAuditLog))

	// Uploads — product images and merchant logos. See handleUpload for why
	// this is requireAuth-only rather than permission-gated.
	s.mux.HandleFunc("POST /api/v1/uploads", s.requireAuth(s.handleUpload))
	s.mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(s.uploadsDir))))
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
