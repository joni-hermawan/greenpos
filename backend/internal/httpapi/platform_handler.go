package httpapi

import "net/http"

func (s *Server) handlePlatformDashboard(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.svc.Platform.Dashboard())
}
