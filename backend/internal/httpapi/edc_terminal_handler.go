package httpapi

import (
	"net/http"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

// handleListEDCTerminals: GET /stores/{id}/edc-terminals — every terminal
// paired to one store (the per-store editor on the Pengaturan EDC page).
func (s *Server) handleListEDCTerminals(w http.ResponseWriter, r *http.Request) {
	merchantID, err := resolveMerchantID(r, userFromCtx(r.Context()))
	if err != nil {
		writeError(w, err)
		return
	}
	list, err := s.svc.EDCTerminal.ListByStore(r.PathValue("id"), merchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

// handleListEDCTerminalMapping: GET /edc-terminals — every terminal across
// every store in the merchant (or every merchant, for superadmin with no
// ?merchantId=) — the "mapping" dashboard view, so the whole EDC device
// layout is visible at a glance instead of clicking through store by store.
func (s *Server) handleListEDCTerminalMapping(w http.ResponseWriter, r *http.Request) {
	merchantID, _ := resolveMerchantScope(r, userFromCtx(r.Context()))
	writeJSON(w, http.StatusOK, s.svc.EDCTerminal.ListByMerchant(merchantID))
}

type edcTerminalFormRequest struct {
	Label       string `json:"label"`
	Mode        string `json:"mode"`
	WSURL       string `json:"wsUrl"`
	APIKey      string `json:"apiKey"`
	MID         string `json:"mid"`
	StationCode string `json:"stationCode"`
}

func (s *Server) handleCreateEDCTerminal(w http.ResponseWriter, r *http.Request) {
	var req edcTerminalFormRequest
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
	created, err := s.svc.EDCTerminal.Create(domain.EDCTerminal{
		StoreID: r.PathValue("id"), Label: req.Label, Mode: req.Mode,
		WSURL: req.WSURL, APIKey: req.APIKey, MID: req.MID, StationCode: req.StationCode,
		Active: true,
	}, merchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "edc-terminal.create", created.Label, created.PosID())
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleUpdateEDCTerminal(w http.ResponseWriter, r *http.Request) {
	var req edcTerminalFormRequest
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
	updated, err := s.svc.EDCTerminal.Update(domain.EDCTerminal{
		ID: r.PathValue("id"), Label: req.Label, Mode: req.Mode,
		WSURL: req.WSURL, APIKey: req.APIKey, MID: req.MID, StationCode: req.StationCode,
	}, merchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "edc-terminal.update", updated.Label, updated.PosID())
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleSetEDCTerminalActive(w http.ResponseWriter, r *http.Request) {
	var req setActiveRequest
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
	updated, err := s.svc.EDCTerminal.SetActive(r.PathValue("id"), merchantID, req.Active)
	if err != nil {
		writeError(w, err)
		return
	}
	action := "edc-terminal.deactivate"
	if req.Active {
		action = "edc-terminal.activate"
	}
	s.svc.Audit.Log(user, action, updated.Label, "")
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleDeleteEDCTerminal(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	merchantID, err := resolveMerchantID(r, user)
	if err != nil {
		writeError(w, err)
		return
	}
	if err := s.svc.EDCTerminal.Delete(r.PathValue("id"), merchantID); err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "edc-terminal.delete", r.PathValue("id"), "")
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
