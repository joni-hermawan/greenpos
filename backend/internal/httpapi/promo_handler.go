package httpapi

import (
	"net/http"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

func (s *Server) handleListActivePromos(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, s.svc.Promo.ListActiveByMerchant(merchantID, user))
}

func (s *Server) handleListPromos(w http.ResponseWriter, r *http.Request) {
	merchantID, all := resolveMerchantScope(r, userFromCtx(r.Context()))
	if all {
		writeJSON(w, http.StatusOK, s.svc.Promo.List())
		return
	}
	writeJSON(w, http.StatusOK, s.svc.Promo.ListByMerchant(merchantID))
}

func (s *Server) handleCreatePromo(w http.ResponseWriter, r *http.Request) {
	var p domain.Promo
	if err := decodeJSON(r, &p); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	p.MerchantID = merchantID
	created, err := s.svc.Promo.Create(p)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "promo.create", created.Name, "")
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleUpdatePromo(w http.ResponseWriter, r *http.Request) {
	var p domain.Promo
	if err := decodeJSON(r, &p); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	p.ID = r.PathValue("id")
	updated, err := s.svc.Promo.Update(p, merchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "promo.update", updated.Name, "")
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleDeletePromo(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	if err := s.svc.Promo.Delete(r.PathValue("id"), merchantID); err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "promo.delete", r.PathValue("id"), "")
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
