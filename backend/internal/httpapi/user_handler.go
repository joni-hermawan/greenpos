package httpapi

import (
	"net/http"
	"strings"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

type upsertUserRequest struct {
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	Name          string   `json:"name"`
	MerchantID    string   `json:"merchantId"`   // superadmin only, ignored otherwise
	StoreIDs      []string `json:"storeIds"`     // data filter: empty = every store in the merchant
	AllowedPages  []string `json:"allowedPages"` // which back-office menus this account can use
	EDCTerminalID string   `json:"edcTerminalId"`
}

// handleListUsers: superadmin sees every user across every merchant, or
// one merchant's users if ?merchantId= is given; everyone else
// (whoever has the "users" menu granted) is scoped to their own merchant.
func (s *Server) handleListUsers(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	if user.Role == domain.RoleSuperadmin {
		if mid := r.URL.Query().Get("merchantId"); mid != "" {
			writeJSON(w, http.StatusOK, s.svc.User.ListByMerchant(mid))
			return
		}
		writeJSON(w, http.StatusOK, s.svc.User.List())
		return
	}
	writeJSON(w, http.StatusOK, s.svc.User.ListByMerchant(user.MerchantID))
}

func (s *Server) handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req upsertUserRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	if req.Username == "" || req.Password == "" {
		writeError(w, apperror.BadRequest("Username dan password wajib diisi."))
		return
	}
	caller := userFromCtx(r.Context())
	merchantID := caller.MerchantID
	if caller.Role == domain.RoleSuperadmin {
		merchantID = req.MerchantID
	}
	allowedPages := req.AllowedPages
	if allowedPages == nil {
		allowedPages = []string{}
	}
	created, err := s.svc.User.Create(domain.User{
		Username: req.Username, Name: req.Name,
		MerchantID: merchantID, StoreIDs: req.StoreIDs, AllowedPages: allowedPages,
		EDCTerminalID: req.EDCTerminalID,
	}, req.Password)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(caller, "user.create", created.Username, strings.Join(created.AllowedPages, ", "))
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleUpdateUser(w http.ResponseWriter, r *http.Request) {
	var req upsertUserRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	caller := userFromCtx(r.Context())
	updated, err := s.svc.User.Update(r.PathValue("id"), req.Name, req.AllowedPages)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(caller, "user.update-privilege", updated.Username, strings.Join(updated.AllowedPages, ", "))
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleSetUserActive(w http.ResponseWriter, r *http.Request) {
	var req setActiveRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	caller := userFromCtx(r.Context())
	updated, err := s.svc.User.SetActive(r.PathValue("id"), req.Active)
	if err != nil {
		writeError(w, err)
		return
	}
	action := "user.deactivate"
	if req.Active {
		action = "user.activate"
	}
	s.svc.Audit.Log(caller, action, updated.Username, "")
	writeJSON(w, http.StatusOK, updated)
}

type resetPasswordRequest struct {
	NewPassword string `json:"newPassword"`
}

func (s *Server) handleResetPassword(w http.ResponseWriter, r *http.Request) {
	var req resetPasswordRequest
	if err := decodeJSON(r, &req); err != nil || len(req.NewPassword) < 6 {
		writeError(w, apperror.BadRequest("Password baru minimal 6 karakter."))
		return
	}
	caller := userFromCtx(r.Context())
	if err := s.svc.User.ResetPassword(r.PathValue("id"), req.NewPassword); err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(caller, "user.reset-password", r.PathValue("id"), "")
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type setStoreFilterRequest struct {
	StoreIDs []string `json:"storeIds"`
}

// handleSetStoreFilter replaces a user's data filter — which stores'
// data they can see/act on (empty = every store in their merchant).
func (s *Server) handleSetStoreFilter(w http.ResponseWriter, r *http.Request) {
	var req setStoreFilterRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	caller := userFromCtx(r.Context())
	updated, err := s.svc.User.SetStoreFilter(r.PathValue("id"), req.StoreIDs)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(caller, "user.set-store-filter", updated.Username, strings.Join(req.StoreIDs, ", "))
	writeJSON(w, http.StatusOK, updated)
}

type setEDCTerminalRequest struct {
	EDCTerminalID string `json:"edcTerminalId"`
}

// handleSetUserEDCTerminal pins/unpins which EDC terminal this account's
// mobile POS sales resolve to — only meaningful when the account's store
// scope is exactly one store that has more than one terminal.
func (s *Server) handleSetUserEDCTerminal(w http.ResponseWriter, r *http.Request) {
	var req setEDCTerminalRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	caller := userFromCtx(r.Context())
	updated, err := s.svc.User.SetEDCTerminal(r.PathValue("id"), req.EDCTerminalID)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(caller, "user.set-edc-terminal", updated.Username, req.EDCTerminalID)
	writeJSON(w, http.StatusOK, updated)
}

type reassignMerchantRequest struct {
	MerchantID string `json:"merchantId"`
}

func (s *Server) handleReassignMerchant(w http.ResponseWriter, r *http.Request) {
	var req reassignMerchantRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	caller := userFromCtx(r.Context())
	updated, err := s.svc.User.ReassignMerchant(r.PathValue("id"), req.MerchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(caller, "user.reassign-merchant", updated.Username, req.MerchantID)
	writeJSON(w, http.StatusOK, updated)
}
