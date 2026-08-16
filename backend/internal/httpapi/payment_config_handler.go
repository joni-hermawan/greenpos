package httpapi

import (
	"net/http"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

// GET/PUT /stores/{id}/payment-config — per-store QRIS integration
// credentials (EDC lives separately now, see edc_terminal_handler.go,
// since a store can have more than one terminal). Gated by the
// "pengaturan-edc"/"pengaturan-qris" menu permission (plus superadmin in
// investigation mode via ?merchantId=); the response includes secret
// values (API keys) since the caller is by definition allowed to manage
// them.
func (s *Server) handleGetPaymentConfig(w http.ResponseWriter, r *http.Request) {
	merchantID, err := resolveMerchantID(r, userFromCtx(r.Context()))
	if err != nil {
		writeError(w, err)
		return
	}
	cfg, err := s.svc.PaymentConfig.Get(r.PathValue("id"), merchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, cfg)
}

func (s *Server) handleUpdatePaymentConfig(w http.ResponseWriter, r *http.Request) {
	var cfg domain.StorePaymentConfig
	if err := decodeJSON(r, &cfg); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	cfg.StoreID = r.PathValue("id")
	updated, err := s.svc.PaymentConfig.Update(cfg, merchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "payment-config.update", cfg.StoreID, "")
	writeJSON(w, http.StatusOK, updated)
}
