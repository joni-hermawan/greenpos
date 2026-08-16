package domain

type PromoType string

const (
	PromoPercentage PromoType = "percentage"
	PromoFixed      PromoType = "fixed"
)

// Promo mirrors src/types.ts's Promo, scoped per merchant like Product.
// Rules are authored via the back-office; the kasir app only ever reads
// active promos.
type Promo struct {
	ID          string    `json:"id"`
	MerchantID  string    `json:"merchantId"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        PromoType `json:"type"`
	Value       float64   `json:"value"` // percent (0-100) if percentage, rupiah if fixed
	MinPurchase int64     `json:"minPurchase"`
	Categories  []string  `json:"categories,omitempty"` // empty/nil = every category
	// StoreIDs scopes the promo within the merchant — empty/nil means every
	// store, non-empty restricts it to only those stores (e.g. a
	// grand-opening promo for one new branch, not the whole merchant).
	StoreIDs []string `json:"storeIds,omitempty"`
	Active   bool     `json:"active"`
}
