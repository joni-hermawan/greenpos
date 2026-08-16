package service

import (
	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	users *storage.UserRepo
}

func NewUserService(users *storage.UserRepo) *UserService {
	return &UserService{users: users}
}

// stripHash also normalizes StoreIDs/AllowedPages to non-nil slices — a
// nil Go slice marshals to JSON `null`, not `[]`, and the frontend does
// `.length`/`.includes` on both unconditionally.
func stripHash(u domain.User) domain.User {
	u.PasswordHash = ""
	if u.StoreIDs == nil {
		u.StoreIDs = []string{}
	}
	if u.AllowedPages == nil {
		u.AllowedPages = []string{}
	}
	return u
}

// List returns every user (superadmin use — cross-merchant).
func (s *UserService) List() []domain.User {
	list := s.users.List()
	for i := range list {
		list[i] = stripHash(list[i])
	}
	return list
}

// ListByMerchant scopes the list to one merchant (admin/store_manager use).
func (s *UserService) ListByMerchant(merchantID string) []domain.User {
	out := make([]domain.User, 0)
	for _, u := range s.users.List() {
		if u.MerchantID == merchantID {
			out = append(out, stripHash(u))
		}
	}
	return out
}

func validatePages(pages []string) error {
	for _, p := range pages {
		if !domain.IsAssignablePage(p) {
			return apperror.BadRequest("Menu tidak dikenal: " + p)
		}
	}
	return nil
}

func (s *UserService) Create(u domain.User, password string) (domain.User, error) {
	if _, exists := s.users.FindByUsername(u.Username); exists {
		return domain.User{}, apperror.BadRequest("Username sudah digunakan.")
	}
	if err := validatePages(u.AllowedPages); err != nil {
		return domain.User{}, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return domain.User{}, apperror.Internal(err.Error())
	}
	u.ID = newID("user")
	u.PasswordHash = string(hash)
	u.Active = true
	if err := s.users.Create(u); err != nil {
		return domain.User{}, apperror.Internal(err.Error())
	}
	return stripHash(u), nil
}

// Update changes only name/menu-permissions — username, merchant, and store
// filter go through the dedicated reassign/filter endpoints so a generic
// edit form can never accidentally move someone to a different
// merchant/store scope.
func (s *UserService) Update(id, name string, allowedPages []string) (domain.User, error) {
	if err := validatePages(allowedPages); err != nil {
		return domain.User{}, err
	}
	existing, ok := s.users.FindByID(id)
	if !ok {
		return domain.User{}, apperror.NotFound("Pengguna tidak ditemukan.")
	}
	existing.Name = name
	existing.AllowedPages = allowedPages
	if err := s.users.Update(existing); err != nil {
		return domain.User{}, apperror.Internal(err.Error())
	}
	return stripHash(existing), nil
}

func (s *UserService) SetActive(id string, active bool) (domain.User, error) {
	u, ok := s.users.FindByID(id)
	if !ok {
		return domain.User{}, apperror.NotFound("Pengguna tidak ditemukan.")
	}
	u.Active = active
	if err := s.users.Update(u); err != nil {
		return domain.User{}, apperror.Internal(err.Error())
	}
	return stripHash(u), nil
}

func (s *UserService) ResetPassword(id, newPassword string) error {
	u, ok := s.users.FindByID(id)
	if !ok {
		return apperror.NotFound("Pengguna tidak ditemukan.")
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

// SetStoreFilter replaces a user's data filter — which stores' data they
// can see/act on (empty means every store in their merchant). Also what a
// mobile POS account's sale gets attributed to (the first entry).
func (s *UserService) SetStoreFilter(id string, storeIDs []string) (domain.User, error) {
	u, ok := s.users.FindByID(id)
	if !ok {
		return domain.User{}, apperror.NotFound("Pengguna tidak ditemukan.")
	}
	u.StoreIDs = storeIDs
	if err := s.users.Update(u); err != nil {
		return domain.User{}, apperror.Internal(err.Error())
	}
	return stripHash(u), nil
}

// SetEDCTerminal pins this account to one specific EDC terminal for POS
// sales, or clears the pin (terminalID == "") so a sale auto-picks the
// first active terminal at the account's store. Not validated against the
// user's store here — a stale pin just falls back to auto-pick at sale
// time (see resolveActiveTerminal in transaction_service.go), which is
// harmless and self-heals if the store scope changes later.
func (s *UserService) SetEDCTerminal(id, terminalID string) (domain.User, error) {
	u, ok := s.users.FindByID(id)
	if !ok {
		return domain.User{}, apperror.NotFound("Pengguna tidak ditemukan.")
	}
	u.EDCTerminalID = terminalID
	if err := s.users.Update(u); err != nil {
		return domain.User{}, apperror.Internal(err.Error())
	}
	return stripHash(u), nil
}

func (s *UserService) ReassignMerchant(id, merchantID string) (domain.User, error) {
	u, ok := s.users.FindByID(id)
	if !ok {
		return domain.User{}, apperror.NotFound("Pengguna tidak ditemukan.")
	}
	u.MerchantID = merchantID
	if err := s.users.Update(u); err != nil {
		return domain.User{}, apperror.Internal(err.Error())
	}
	return stripHash(u), nil
}
