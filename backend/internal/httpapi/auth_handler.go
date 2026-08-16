package httpapi

import (
	"net/http"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token   string             `json:"token"`
	Profile domain.AuthProfile `json:"profile"`
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	profile, token, err := s.svc.Auth.Login(req.Username, req.Password)
	if err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(domain.User{
		ID: profile.ID, Username: profile.Username, Name: profile.Name,
		Role: profile.Role, MerchantID: profile.MerchantID,
	}, "auth.login", profile.Username, "")
	writeJSON(w, http.StatusOK, loginResponse{Token: token, Profile: profile})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	s.svc.Auth.Logout(extractToken(r))
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.svc.Auth.Profile(userFromCtx(r.Context())))
}

type changePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

func (s *Server) handleChangePassword(w http.ResponseWriter, r *http.Request) {
	var req changePasswordRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	if len(req.NewPassword) < 6 {
		writeError(w, apperror.BadRequest("Password baru minimal 6 karakter."))
		return
	}
	user := userFromCtx(r.Context())
	if err := s.svc.Auth.ChangePassword(user.ID, req.OldPassword, req.NewPassword); err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
