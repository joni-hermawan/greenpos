package httpapi

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

type ctxKey string

const userCtxKey ctxKey = "authUser"

func userFromCtx(ctx context.Context) domain.User {
	u, _ := ctx.Value(userCtxKey).(domain.User)
	return u
}

// withCORS is permissive by design — no web back-office exists yet to scope
// it down to, and this backend only ever runs on a dev machine / LAN.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func withRecover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("httpapi: panic recovered: %v", rec)
				writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Terjadi kesalahan pada server."})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func extractToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if after, ok := strings.CutPrefix(h, "Bearer "); ok {
		return strings.TrimSpace(after)
	}
	return ""
}

// requireAuth resolves the bearer token to a domain.User and stashes it in
// the request context for downstream handlers (and requireRole).
func (s *Server) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := extractToken(r)
		if token == "" {
			writeError(w, apperror.Unauthorized("Token tidak ditemukan."))
			return
		}
		user, err := s.svc.Auth.Authenticate(token)
		if err != nil {
			writeError(w, err)
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), userCtxKey, user)))
	}
}

// requireRole builds a decorator gating a route to a set of roles — used
// only for genuinely platform-level actions (superadmin) that no per-user
// menu permission can ever grant a regular merchant-scoped account.
func (s *Server) requireRole(roles ...domain.Role) func(http.HandlerFunc) http.HandlerFunc {
	allowed := make(map[domain.Role]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.HandlerFunc) http.HandlerFunc {
		return s.requireAuth(func(w http.ResponseWriter, r *http.Request) {
			if !allowed[userFromCtx(r.Context()).Role] {
				writeError(w, apperror.Forbidden("Anda tidak memiliki akses untuk aksi ini."))
				return
			}
			next(w, r)
		})
	}
}

// requirePermission builds a decorator gating a route to whoever has the
// given back-office menu page granted (see domain.User.AllowedPages) —
// this is what admin/store_manager/finance/ppic used to get implicitly
// from a fixed role tier, now decided per-user in the Pengguna page
// instead. Superadmin always passes, same as everywhere else in this
// system: they can act on any merchant they've selected via ?merchantId=.
func (s *Server) requirePermission(page string) func(http.HandlerFunc) http.HandlerFunc {
	return s.requireAnyPermission(page)
}

// requireAnyPermission passes if the user has at least one of the given
// pages granted — used where one API resource backs more than one menu
// (payment-config backs both "pengaturan-edc" and "pengaturan-qris").
func (s *Server) requireAnyPermission(pages ...string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return s.requireAuth(func(w http.ResponseWriter, r *http.Request) {
			user := userFromCtx(r.Context())
			if user.Role == domain.RoleSuperadmin {
				next(w, r)
				return
			}
			for _, want := range pages {
				for _, got := range user.AllowedPages {
					if want == got {
						next(w, r)
						return
					}
				}
			}
			writeError(w, apperror.Forbidden("Anda tidak memiliki akses ke menu ini."))
		})
	}
}
