package storage

import (
	"greenpos-backend/internal/domain"

	"golang.org/x/crypto/bcrypt"
)

// Seed data below ports the exact same demo accounts/stores/products/promos
// hardcoded in GreenPos/src/api.ts, so existing manual test flows (demo
// account cards, product catalog, promo banners) keep working unchanged.
// Extended 2026-08-04 with a real Merchant entity, MerchantID wiring, and
// two extra demo accounts (manager01, superadmin01) so every role in the
// web back-office can actually be exercised.

const DefaultMerchantID = "merchant-1"

func seedMerchants() []domain.Merchant {
	return []domain.Merchant{
		{
			ID:      DefaultMerchantID,
			Name:    "Kopi & Roti Nusantara",
			Address: "Jl. Sudirman No. 88, Jakarta Selatan",
			Active:  true,
			Slug:    "kopi-roti-nusantara",
		},
	}
}

func seedStores() []domain.Store {
	return []domain.Store{
		{ID: "store-1", MerchantID: DefaultMerchantID, Name: "Toko Pusat - Sudirman", Address: "Jl. Sudirman No. 88, Jakarta Selatan", Active: true},
		{ID: "store-2", MerchantID: DefaultMerchantID, Name: "Cabang Bandung", Address: "Jl. Braga No. 21, Bandung", Active: true},
	}
}

// Demo accounts' AllowedPages below mirror what the old fixed role tiers
// used to grant (see the former effectivePages() table this replaced in
// backoffice/src/lib/constants.ts) — same starting access, now expressed
// as an explicit per-user menu grant instead of an implicit role lookup.
func seedUsers() []domain.User {
	hash := func(pw string) string {
		h, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		if err != nil {
			panic(err) // only happens on a broken bcrypt cost constant
		}
		return string(h)
	}
	demoPass := hash("demo123")
	stores := seedStores()
	adminPages := append([]string{}, domain.AssignablePages...)
	managerPages := []string{"dashboard", "produk", "promo", "reporting", "riwayat", "users", "pengaturan-edc", "pengaturan-qris"}
	financePages := []string{"reporting", "riwayat"}
	ppicPages := []string{"produk"}
	return []domain.User{
		{ID: "user-admin", Username: "admin01", PasswordHash: demoPass, Name: "Rangga Saputra", Role: domain.RoleAdmin, Active: true, MerchantID: DefaultMerchantID, AllowedPages: adminPages},
		{ID: "user-manager", Username: "manager01", PasswordHash: demoPass, Name: "Sari Wulandari", Role: domain.RoleStoreManager, Active: true, MerchantID: DefaultMerchantID, StoreIDs: []string{stores[0].ID}, AllowedPages: managerPages},
		{ID: "user-kasir", Username: "kasir01", PasswordHash: demoPass, Name: "Dewi Anjani", Role: domain.RoleKasir, Active: true, MerchantID: DefaultMerchantID, StoreIDs: []string{stores[0].ID}, AllowedPages: []string{}},
		{ID: "user-ppic", Username: "ppic01", PasswordHash: demoPass, Name: "Fajar Nugroho", Role: domain.RolePPIC, Active: true, MerchantID: DefaultMerchantID, StoreIDs: []string{stores[0].ID}, AllowedPages: ppicPages},
		{ID: "user-finance", Username: "finance01", PasswordHash: demoPass, Name: "Melati Putri", Role: domain.RoleFinance, Active: true, MerchantID: DefaultMerchantID, AllowedPages: financePages},
		{ID: "user-superadmin", Username: "superadmin01", PasswordHash: demoPass, Name: "Bimo Prakoso", Role: domain.RoleSuperadmin, Active: true},
	}
}

func seedProducts() []domain.Product {
	m := DefaultMerchantID
	return []domain.Product{
		{ID: "prod-1", MerchantID: m, SKU: "KOP-001", Name: "Kopi Susu Gula Aren", Category: "Minuman", Price: 22000, Stock: 48, MinStock: 10, Emoji: "☕"},
		{ID: "prod-2", MerchantID: m, SKU: "KOP-002", Name: "Americano", Category: "Minuman", Price: 18000, Stock: 35, MinStock: 10, Emoji: "☕"},
		{ID: "prod-3", MerchantID: m, SKU: "KOP-003", Name: "Matcha Latte", Category: "Minuman", Price: 25000, Stock: 0, MinStock: 10, Emoji: "🍵"},
		{ID: "prod-4", MerchantID: m, SKU: "ROT-001", Name: "Croissant Butter", Category: "Roti", Price: 19000, Stock: 22, MinStock: 8, Emoji: "🥐"},
		{ID: "prod-5", MerchantID: m, SKU: "ROT-002", Name: "Roti Sourdough", Category: "Roti", Price: 32000, Stock: 14, MinStock: 5, Emoji: "🍞"},
		{ID: "prod-6", MerchantID: m, SKU: "ROT-003", Name: "Donat Cokelat", Category: "Roti", Price: 12000, Stock: 40, MinStock: 10, Emoji: "🍩"},
		{ID: "prod-7", MerchantID: m, SKU: "SNK-001", Name: "Kentang Goreng", Category: "Snack", Price: 21000, Stock: 0, MinStock: 10, Emoji: "🍟"},
		{ID: "prod-8", MerchantID: m, SKU: "SNK-002", Name: "Nugget Ayam", Category: "Snack", Price: 24000, Stock: 18, MinStock: 8, Emoji: "🍗"},
		{ID: "prod-9", MerchantID: m, SKU: "MKN-001", Name: "Nasi Goreng Spesial", Category: "Makanan", Price: 35000, Stock: 25, MinStock: 8, Emoji: "🍛"},
		{ID: "prod-10", MerchantID: m, SKU: "MKN-002", Name: "Mie Ayam Bakso", Category: "Makanan", Price: 28000, Stock: 0, MinStock: 8, Emoji: "🍜"},
		{ID: "prod-11", MerchantID: m, SKU: "KOP-004", Name: "Es Teh Manis", Category: "Minuman", Price: 10000, Stock: 60, MinStock: 15, Emoji: "🧋"},
		{ID: "prod-12", MerchantID: m, SKU: "ROT-004", Name: "Cheese Cake Slice", Category: "Roti", Price: 27000, Stock: 0, MinStock: 5, Emoji: "🍰"},
	}
}

func seedPromos() []domain.Promo {
	m := DefaultMerchantID
	return []domain.Promo{
		{
			ID: "promo-1", MerchantID: m, Name: "Diskon Minuman 10%",
			Description: "Diskon 10% untuk semua produk kategori Minuman",
			Type:        domain.PromoPercentage, Value: 10, MinPurchase: 0,
			Categories: []string{"Minuman"}, Active: true,
		},
		{
			ID: "promo-2", MerchantID: m, Name: "Hemat Rp20.000",
			Description: "Potongan Rp20.000 untuk belanja minimal Rp100.000",
			Type:        domain.PromoFixed, Value: 20000, MinPurchase: 100000, Active: true,
		},
		{
			ID: "promo-3", MerchantID: m, Name: "Promo Akhir Pekan 15%",
			Description: "Diskon 15% untuk semua item, minimal belanja Rp50.000",
			Type:        domain.PromoPercentage, Value: 15, MinPurchase: 50000, Active: true,
		},
	}
}
