package httpapi

import (
	"net/http"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

// handleListStores is scoped to the caller's own merchant. superadmin sees
// every store across every merchant by default, or one merchant's stores
// if ?merchantId= is given (investigation mode) — this is also the
// endpoint the mobile app's storeApi.list() calls, transparently
// merchant-scoped instead of returning a single hardcoded merchant's data.
func (s *Server) handleListStores(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	if user.Role == domain.RoleSuperadmin {
		if mid := r.URL.Query().Get("merchantId"); mid != "" {
			writeJSON(w, http.StatusOK, s.svc.Store.ListByMerchant(mid))
			return
		}
		writeJSON(w, http.StatusOK, s.svc.Store.List())
		return
	}
	writeJSON(w, http.StatusOK, s.svc.Store.ListByMerchant(user.MerchantID))
}

type storeFormRequest struct {
	Name    string `json:"name"`
	Address string `json:"address"`
}

func (s *Server) handleCreateStore(w http.ResponseWriter, r *http.Request) {
	var req storeFormRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	created, err := s.svc.Store.Create(domain.Store{MerchantID: merchantID, Name: req.Name, Address: req.Address})
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "store.create", created.Name, "")
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleUpdateStore(w http.ResponseWriter, r *http.Request) {
	var req storeFormRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	updated, err := s.svc.Store.Update(r.PathValue("id"), merchantID, req.Name, req.Address)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "store.update", updated.Name, "")
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleSetStoreActive(w http.ResponseWriter, r *http.Request) {
	var req setActiveRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	updated, err := s.svc.Store.SetActive(r.PathValue("id"), req.Active)
	if err != nil {
		writeError(w, err)
		return
	}
	action := "store.deactivate"
	if req.Active {
		action = "store.activate"
	}
	s.svc.Audit.Log(user, action, updated.Name, "")
	writeJSON(w, http.StatusOK, updated)
}
