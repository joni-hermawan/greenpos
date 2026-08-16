package service

import (
	"time"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	users    *storage.UserRepo
	stores   *storage.StoreRepo
	merchants *storage.MerchantRepo
	// revoked is a jti denylist for logout — JWTs are stateless by design,
	// so "logging out" a still-unexpired token means recording its jti here
	// until it would have expired anyway (storage.SessionRepo's existing
	// expiry-aware Find/Create is reused verbatim for this, just holding
	// jti->expiry instead of token->userID).
	revoked   *storage.SessionRepo
	jwtSecret []byte
	tokenTTL  time.Duration
}

// jwtClaims is the token payload — role and merchant are embedded so
// requireRole/handlers never need an extra user lookup just to check
// authorization, only Authenticate's one FindByID for the up-to-date user
// record (active status, name, etc.).
type jwtClaims struct {
	jwt.RegisteredClaims
	Role       domain.Role `json:"role"`
	MerchantID string      `json:"merchantId"`
}

func NewAuthService(users *storage.UserRepo, revoked *storage.SessionRepo, stores *storage.StoreRepo, merchants *storage.MerchantRepo, jwtSecret string, tokenTTLHours int) *AuthService {
	return &AuthService{
		users:     users,
		stores:    stores,
		merchants: merchants,
		revoked:   revoked,
		jwtSecret: []byte(jwtSecret),
		tokenTTL:  time.Duration(tokenTTLHours) * time.Hour,
	}
}

func (s *AuthService) Login(username, password string) (domain.AuthProfile, string, error) {
	u, ok := s.users.FindByUsername(username)
	if !ok || !u.Active {
		return domain.AuthProfile{}, "", apperror.Unauthorized("Username atau password salah.")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return domain.AuthProfile{}, "", apperror.Unauthorized("Username atau password salah.")
	}

	token, err := s.issueToken(u)
	if err != nil {
		return domain.AuthProfile{}, "", apperror.Internal("Gagal membuat token: " + err.Error())
	}
	return s.toProfile(u), token, nil
}

func (s *AuthService) issueToken(u domain.User) (string, error) {
	now := time.Now()
	claims := jwtClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID,
			ID:        newToken(), // jti — unique per issued token, used for logout revocation
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.tokenTTL)),
		},
		Role:       u.Role,
		MerchantID: u.MerchantID,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) Logout(tokenStr string) {
	claims := &jwtClaims{}
	_, _ = jwt.ParseWithClaims(tokenStr, claims, s.keyFunc)
	if claims.ID == "" {
		return
	}
	exp := time.Now().Add(s.tokenTTL)
	if claims.ExpiresAt != nil {
		exp = claims.ExpiresAt.Time
	}
	s.revoked.Create(domain.Session{Token: claims.ID, UserID: claims.Subject, ExpiresAt: exp})
}

func (s *AuthService) keyFunc(t *jwt.Token) (any, error) {
	return s.jwtSecret, nil
}

// Authenticate verifies a JWT's signature and expiry, rejects it if its
// jti was revoked via Logout, and resolves it to the current user record
// (so a deactivated account is locked out immediately even with an
// otherwise still-valid token) — used by the HTTP auth middleware on every
// protected route.
func (s *AuthService) Authenticate(tokenStr string) (domain.User, error) {
	claims := &jwtClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, s.keyFunc, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil || !token.Valid {
		return domain.User{}, apperror.Unauthorized("Sesi tidak valid atau sudah kedaluwarsa.")
	}
	if _, revoked := s.revoked.Find(claims.ID); revoked {
		return domain.User{}, apperror.Unauthorized("Sesi sudah berakhir, silakan masuk kembali.")
	}
	u, ok := s.users.FindByID(claims.Subject)
	if !ok || !u.Active {
		return domain.User{}, apperror.Unauthorized("Pengguna tidak ditemukan.")
	}
	return u, nil
}

func (s *AuthService) Profile(u domain.User) domain.AuthProfile {
	return s.toProfile(u)
}

func (s *AuthService) ChangePassword(userID, oldPassword, newPassword string) error {
	u, ok := s.users.FindByID(userID)
	if !ok {
		return apperror.NotFound("Pengguna tidak ditemukan.")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(oldPassword)); err != nil {
		return apperror.BadRequest("Password lama salah.")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return apperror.Internal(err.Error())
	}
	u.PasswordHash = string(hash)
	if err := s.users.Update(u); err != nil {
		return apperror.Internal(err.Error())
	}
	return nil
}

func (s *AuthService) toProfile(u domain.User) domain.AuthProfile {
	// The profile's single storeId/storeName/storeAddress (used by the
	// mobile POS to attribute a sale, and for display) is the first entry
	// of the user's data-filter store list — the common case is exactly
	// one store anyway; a broader multi-store filter still resolves to
	// something sensible here, and the full list matters server-side via
	// AllowedPages/StoreIDs on the User itself, not this display profile.
	storeID, storeName, storeAddress := "", "", ""
	if len(u.StoreIDs) > 0 {
		if st, ok := s.stores.FindByID(u.StoreIDs[0]); ok {
			storeID, storeName, storeAddress = st.ID, st.Name, st.Address
		}
	}
	allowedPages := u.AllowedPages
	if allowedPages == nil {
		allowedPages = []string{}
	}
	profile := domain.AuthProfile{
		ID:           u.ID,
		Username:     u.Username,
		Name:         u.Name,
		Role:         u.Role,
		MerchantID:   u.MerchantID,
		StoreID:      storeID,
		StoreName:    storeName,
		StoreAddress: storeAddress,
		AllowedPages: allowedPages,
	}
	if u.MerchantID != "" {
		if m, ok := s.merchants.FindByID(u.MerchantID); ok {
			profile.MerchantName = m.Name
			profile.MerchantAddress = m.Address
			profile.MerchantLogoURL = m.LogoURL
			profile.MerchantSlug = m.Slug
		}
	}
	return profile
}
