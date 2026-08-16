package httpapi

import (
	"net/http"
	"strconv"

	"greenpos-backend/internal/apperror"
)

func (s *Server) handleReportDashboard(w http.ResponseWriter, r *http.Request) {
	days := 7
	if d, err := strconv.Atoi(r.URL.Query().Get("days")); err == nil && d > 0 {
		days = d
	}
	user := userFromCtx(r.Context())
	merchantID, _ := resolveMerchantScope(r, user)
	storeIDs, ok := resolveStoreScope(r, user)
	if !ok {
		writeError(w, apperror.Forbidden("Anda tidak memiliki akses ke store ini."))
		return
	}
	writeJSON(w, http.StatusOK, s.svc.Report.Dashboard(merchantID, storeIDs, days))
}

func (s *Server) handleReportReconciliation(w http.ResponseWriter, r *http.Request) {
	days := 30
	if d, err := strconv.Atoi(r.URL.Query().Get("days")); err == nil && d > 0 {
		days = d
	}
	user := userFromCtx(r.Context())
	merchantID, _ := resolveMerchantScope(r, user)
	storeIDs, ok := resolveStoreScope(r, user)
	if !ok {
		writeError(w, apperror.Forbidden("Anda tidak memiliki akses ke store ini."))
		return
	}
	writeJSON(w, http.StatusOK, s.svc.Report.Reconciliation(merchantID, storeIDs, days))
}
