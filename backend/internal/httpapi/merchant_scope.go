package httpapi

import (
	"net/http"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
)

// resolveMerchantID is how superadmin gets "investigation mode" access to
// every merchant-scoped page (dashboard, produk, promo, reporting,
// riwayat, stores, users, pengaturan) without a merchant of their own:
// every merchant-scoped role uses their own MerchantID, but a superadmin
// must explicitly pick which merchant to look at via ?merchantId= — there
// is no implicit "all merchants mixed together" view for these endpoints
// (that's what /platform/dashboard and /audit-log are for).
func resolveMerchantID(r *http.Request, user domain.User) (string, error) {
	if user.Role == domain.RoleSuperadmin {
		mid := r.URL.Query().Get("merchantId")
		if mid == "" {
			return "", apperror.BadRequest("Pilih merchant terlebih dahulu (?merchantId=).")
		}
		return mid, nil
	}
	return user.MerchantID, nil
}

// resolveMerchantScope is the read-only counterpart of resolveMerchantID: a
// superadmin browsing without ?merchantId= means "show every merchant"
// (all=true, merchantID="") rather than an error — used by list/report
// endpoints only, never by create/update/delete (those always need one
// concrete merchant to act on, so they keep using resolveMerchantID).
func resolveMerchantScope(r *http.Request, user domain.User) (merchantID string, all bool) {
	if user.Role == domain.RoleSuperadmin {
		mid := r.URL.Query().Get("merchantId")
		if mid == "" {
			return "", true
		}
		return mid, false
	}
	return user.MerchantID, false
}

// resolveStoreScope resolves the effective store-id filter for a
// data-viewing request (dashboard/reporting/riwayat): the caller's own
// StoreIDs data filter (empty = every store in their merchant) intersected
// with an optional ?storeId= query override. ok=false means the caller
// explicitly asked for a store outside their own filter — the handler
// should reject the request rather than silently narrow or widen it.
func resolveStoreScope(r *http.Request, user domain.User) (storeIDs []string, ok bool) {
	requested := r.URL.Query().Get("storeId")
	if len(user.StoreIDs) == 0 {
		if requested != "" {
			return []string{requested}, true
		}
		return nil, true
	}
	if requested == "" {
		return user.StoreIDs, true
	}
	for _, id := range user.StoreIDs {
		if id == requested {
			return []string{requested}, true
		}
	}
	return nil, false
}
