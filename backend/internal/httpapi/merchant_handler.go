package httpapi

import (
	"net/http"

	"greenpos-backend/internal/apperror"
)

type merchantFormRequest struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	LogoURL string `json:"logoUrl"`
}

// handleGetMyMerchant / handleUpdateMyMerchant are the admin/store_manager
// self-service endpoints — "my merchant", resolved from the caller's own
// MerchantID, not a path param (so nobody can edit a merchant by guessing
// its id).
func (s *Server) handleGetMyMerchant(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	if user.MerchantID == "" {
		writeError(w, apperror.BadRequest("Akun ini tidak terikat ke merchant manapun."))
		return
	}
	m, err := s.svc.Merchant.Get(user.MerchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

func (s *Server) handleUpdateMyMerchant(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	if user.MerchantID == "" {
		writeError(w, apperror.BadRequest("Akun ini tidak terikat ke merchant manapun."))
		return
	}
	var req merchantFormRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	m, err := s.svc.Merchant.Update(user.MerchantID, req.Name, req.Address, req.LogoURL)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "merchant.update", m.Name, "")
	writeJSON(w, http.StatusOK, m)
}

// The handlers below are superadmin-only platform management.

func (s *Server) handleListMerchants(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.svc.Merchant.List())
}

// handleGetMerchant lets a superadmin fetch one merchant by id — used by
// the investigation-mode merchant switcher to show its name/address.
func (s *Server) handleGetMerchant(w http.ResponseWriter, r *http.Request) {
	m, err := s.svc.Merchant.Get(r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

func (s *Server) handleCreateMerchant(w http.ResponseWriter, r *http.Request) {
	var req merchantFormRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	m, err := s.svc.Merchant.Create(req.Name, req.Address, req.LogoURL)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "merchant.create", m.Name, "")
	writeJSON(w, http.StatusCreated, m)
}

func (s *Server) handleUpdateMerchant(w http.ResponseWriter, r *http.Request) {
	var req merchantFormRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	m, err := s.svc.Merchant.Update(r.PathValue("id"), req.Name, req.Address, req.LogoURL)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "merchant.update", m.Name, "")
	writeJSON(w, http.StatusOK, m)
}

type setActiveRequest struct {
	Active bool `json:"active"`
}

func (s *Server) handleSetMerchantActive(w http.ResponseWriter, r *http.Request) {
	var req setActiveRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	if err := s.svc.Merchant.SetActive(r.PathValue("id"), req.Active); err != nil {
		writeError(w, err)
		return
	}
	action := "merchant.deactivate"
	if req.Active {
		action = "merchant.activate"
	}
	s.svc.Audit.Log(user, action, r.PathValue("id"), "")
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
