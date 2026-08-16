package httpapi

import (
	"net/http"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

func (s *Server) handleListProducts(w http.ResponseWriter, r *http.Request) {
	merchantID, all := resolveMerchantScope(r, userFromCtx(r.Context()))
	if all {
		writeJSON(w, http.StatusOK, s.svc.Product.List())
		return
	}
	writeJSON(w, http.StatusOK, s.svc.Product.ListByMerchant(merchantID))
}

func (s *Server) handleCreateProduct(w http.ResponseWriter, r *http.Request) {
	var p domain.Product
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
	created, err := s.svc.Product.Create(p)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "product.create", created.Name, "")
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleUpdateProduct(w http.ResponseWriter, r *http.Request) {
	var p domain.Product
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
	updated, err := s.svc.Product.Update(p, merchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "product.update", updated.Name, "")
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleDeleteProduct(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	if err := s.svc.Product.Delete(r.PathValue("id"), merchantID); err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "product.delete", r.PathValue("id"), "")
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type adjustStockRequest struct {
	Delta  int    `json:"delta"`
	Reason string `json:"reason"`
}

func (s *Server) handleAdjustStock(w http.ResponseWriter, r *http.Request) {
	var req adjustStockRequest
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
	updated, err := s.svc.Product.AdjustStock(r.PathValue("id"), merchantID, req.Delta)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "product.adjust-stock", updated.Name, req.Reason)
	writeJSON(w, http.StatusOK, updated)
}
