package service

import (
	"strings"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"
)

type MerchantService struct {
	merchants *storage.MerchantRepo
}

func NewMerchantService(merchants *storage.MerchantRepo) *MerchantService {
	return &MerchantService{merchants: merchants}
}

func (s *MerchantService) List() []domain.Merchant {
	return s.merchants.List()
}

func (s *MerchantService) Get(id string) (domain.Merchant, error) {
	m, ok := s.merchants.FindByID(id)
	if !ok {
		return domain.Merchant{}, apperror.NotFound("Merchant tidak ditemukan.")
	}
	return m, nil
}

func (s *MerchantService) Create(name, address, logoURL string) (domain.Merchant, error) {
	m := domain.Merchant{
		ID:      newID("merchant"),
		Name:    name,
		Address: address,
		LogoURL: logoURL,
		Active:  true,
		Slug:    slugify(name),
	}
	if err := s.merchants.Create(m); err != nil {
		return domain.Merchant{}, apperror.Internal(err.Error())
	}
	return m, nil
}

func (s *MerchantService) Update(id, name, address, logoURL string) (domain.Merchant, error) {
	existing, ok := s.merchants.FindByID(id)
	if !ok {
		return domain.Merchant{}, apperror.NotFound("Merchant tidak ditemukan.")
	}
	existing.Name = name
	existing.Address = address
	existing.LogoURL = logoURL
	if err := s.merchants.Update(existing); err != nil {
		return domain.Merchant{}, apperror.Internal(err.Error())
	}
	return existing, nil
}

func (s *MerchantService) SetActive(id string, active bool) error {
	if err := s.merchants.SetActive(id, active); err != nil {
		return apperror.NotFound("Merchant tidak ditemukan.")
	}
	return nil
}

func slugify(name string) string {
	lower := strings.ToLower(strings.TrimSpace(name))
	var b strings.Builder
	lastDash := false
	for _, r := range lower {
		switch {
		case r >= 'a' && r <= 'z' || r >= '0' && r <= '9':
			b.WriteRune(r)
			lastDash = false
		default:
			if !lastDash && b.Len() > 0 {
				b.WriteRune('-')
				lastDash = true
			}
		}
	}
	out := strings.TrimRight(b.String(), "-")
	if out == "" {
		return newID("merchant")
	}
	return out
}
