package domain

// Role now only distinguishes superadmin (platform-wide, no merchant) from
// everyone else — it no longer drives which back-office menus a user can
// see or which API actions they can perform. That's AllowedPages below,
// picked per-user by whoever creates the account, not a fixed role tier.
type Role string

const (
	RoleKasir        Role = "kasir"
	RolePPIC         Role = "ppic"
	RoleFinance      Role = "finance"
	RoleAdmin        Role = "admin"
	RoleSuperadmin   Role = "superadmin"
	RoleStoreManager Role = "store_manager"
)

type User struct {
	ID           string `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"passwordHash"`
	Name         string `json:"name"`
	Role         Role   `json:"role"`
	Active       bool   `json:"active"`
	// MerchantID is empty for superadmin (platform-scoped, no merchant).
	MerchantID string `json:"merchantId"`
	// StoreIDs is this user's data filter within their merchant — which
	// stores' transactions/reports they can see, and (for whoever actually
	// runs the mobile POS) which store a new sale is attributed to (the
	// first entry). Empty means "every store in the merchant".
	StoreIDs []string `json:"storeIds"`
	// AllowedPages is which back-office menu pages (PageId strings, see
	// backoffice/src/lib/constants.ts) this user can see and act on.
	// Ignored for superadmin, who always has every page. Enforced both by
	// the sidebar (hides what's not granted) and by requirePermission on
	// the API side (rejects it even if called directly).
	AllowedPages []string `json:"allowedPages"`
	// EDCTerminalID pins this account (typically a mobile kasir) to one
	// specific EDC device when their store has more than one — e.g. "Kasir
	// 1" always uses the till at counter 1, not whichever terminal happens
	// to be first. Empty means "auto-pick the first active terminal at my
	// store" (fine for a store with only one terminal).
	EDCTerminalID string `json:"edcTerminalId,omitempty"`
}

// AssignablePages is every page id a merchant-scoped user can be granted —
// the platform-only pages (superadmin dashboard/merchants/audit trail)
// are deliberately excluded: those stay purely a superadmin capability,
// never grantable to a regular merchant user no matter what's checked.
// Order mirrors the frontend's ASSIGNABLE_PAGES (backoffice/src/lib/constants.ts)
// — the sidebar's nav order — purely for readability here since this slice
// is only ever used for membership checks (IsAssignablePage), not display.
var AssignablePages = []string{
	"dashboard",
	"pengaturan-merchant", "stores",
	"users",
	"produk", "promo", "riwayat",
	"reporting",
	"pengaturan-edc", "pengaturan-qris",
}

func IsAssignablePage(page string) bool {
	for _, p := range AssignablePages {
		if p == page {
			return true
		}
	}
	return false
}

// AuthProfile is what the client receives after login — never includes the
// password hash. Field names match src/types.ts's AuthProfile exactly.
type AuthProfile struct {
	ID              string   `json:"id"`
	Username        string   `json:"username"`
	Name            string   `json:"name"`
	Role            Role     `json:"role"`
	MerchantID      string   `json:"merchantId"`
	MerchantName    string   `json:"merchantName"`
	MerchantAddress string   `json:"merchantAddress"`
	MerchantLogoURL string   `json:"merchantLogoUrl,omitempty"`
	MerchantSlug    string   `json:"merchantSlug,omitempty"`
	StoreID         string   `json:"storeId"`
	StoreName       string   `json:"storeName"`
	StoreAddress    string   `json:"storeAddress"`
	AllowedPages    []string `json:"allowedPages"`
}
