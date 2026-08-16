package service

import (
	"sort"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/storage"
)

type ProductService struct {
	products *storage.ProductRepo
}

func NewProductService(products *storage.ProductRepo) *ProductService {
	return &ProductService{products: products}
}

// ListByMerchant is how every merchant-scoped caller (mobile kasir app
// included) lists products, so different merchants' catalogs/stock are
// never visible to each other.
func (s *ProductService) ListByMerchant(merchantID string) []domain.Product {
	all := s.products.List()
	out := make([]domain.Product, 0, len(all))
	for _, p := range all {
		if p.MerchantID == merchantID {
			out = append(out, p)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

// List returns every product across every merchant — superadmin "all
// merchants" view only.
func (s *ProductService) List() []domain.Product {
	out := s.products.List()
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func (s *ProductService) Create(p domain.Product) (domain.Product, error) {
	p.ID = newID("prod")
	if err := s.products.Create(p); err != nil {
		return domain.Product{}, apperror.Internal(err.Error())
	}
	return p, nil
}

// Update requires merchantID so an admin from merchant A can never edit
// (or probe the existence of) merchant B's product by guessing an id.
func (s *ProductService) Update(p domain.Product, merchantID string) (domain.Product, error) {
	existing, ok := s.products.FindByID(p.ID)
	if !ok || existing.MerchantID != merchantID {
		return domain.Product{}, apperror.NotFound("Produk tidak ditemukan.")
	}
	p.MerchantID = merchantID
	if err := s.products.Update(p); err != nil {
		return domain.Product{}, apperror.NotFound("Produk tidak ditemukan.")
	}
	return p, nil
}

func (s *ProductService) Delete(id, merchantID string) error {
	existing, ok := s.products.FindByID(id)
	if !ok || existing.MerchantID != merchantID {
		return apperror.NotFound("Produk tidak ditemukan.")
	}
	if err := s.products.Delete(id); err != nil {
		return apperror.NotFound("Produk tidak ditemukan.")
	}
	return nil
}

func (s *ProductService) AdjustStock(id, merchantID string, delta int) (domain.Product, error) {
	existing, ok := s.products.FindByID(id)
	if !ok || existing.MerchantID != merchantID {
		return domain.Product{}, apperror.NotFound("Produk tidak ditemukan.")
	}
	if err := s.products.AdjustStock(id, delta); err != nil {
		return domain.Product{}, apperror.Internal(err.Error())
	}
	updated, _ := s.products.FindByID(id)
	return updated, nil
}
