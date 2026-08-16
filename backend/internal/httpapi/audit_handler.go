package httpapi

import (
	"net/http"
	"strconv"
)

func (s *Server) handleAuditLog(w http.ResponseWriter, r *http.Request) {
	limit := 200
	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 {
		limit = l
	}
	writeJSON(w, http.StatusOK, s.svc.Audit.List(r.URL.Query().Get("merchantId"), limit))
}
