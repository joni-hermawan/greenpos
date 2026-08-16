package domain

// Merchant is a real entity now (previously a hardcoded name/address pair
// in storage/seed.go) so a superadmin can manage multiple tenants and an
// admin can edit their own merchant's profile.
type Merchant struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Address string `json:"address"`
	LogoURL string `json:"logoUrl,omitempty"`
	Active  bool   `json:"active"`
	Slug    string `json:"slug"`
}
