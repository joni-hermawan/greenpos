package domain

// Product catalog is scoped per merchant (not per store) — every store
// within a merchant shares one catalog and one stock pool, matching how
// the mobile app already behaved before multi-tenancy existed. Different
// merchants never see each other's products.
type Product struct {
	ID         string `json:"id"`
	MerchantID string `json:"merchantId"`
	SKU        string `json:"sku"`
	Name       string `json:"name"`
	Category   string `json:"category"`
	Price      int64  `json:"price"`
	Stock      int    `json:"stock"`
	MinStock   int    `json:"minStock"`
	Emoji      string `json:"emoji"`
	ImageURL   string `json:"imageUrl,omitempty"`
}
