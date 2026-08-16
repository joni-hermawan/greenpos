package domain

// Platform-level (superadmin) view across every merchant. Simplified from
// the reference project's PlatformDashboard: our transaction model only
// tracks pending/paid/voided (no distinct "failed" status), so there's no
// meaningful "recentFailed" list to report — StuckPending (pending orders
// open unusually long) is kept since it maps directly onto data we have.

type MerchantHealth struct {
	MerchantID       string `json:"merchantId"`
	MerchantName     string `json:"merchantName"`
	PaidCountToday   int    `json:"paidCountToday"`
	PaidTotalToday   int64  `json:"paidTotalToday"`
	PendingCount     int    `json:"pendingCount"`
	LastActivityAt   string `json:"lastActivityAt,omitempty"`
}

type StuckPendingRow struct {
	TransactionID string `json:"transactionId"`
	InvoiceNo     string `json:"invoiceNo"`
	MerchantName  string `json:"merchantName"`
	StoreName     string `json:"storeName"`
	Amount        int64  `json:"amount"`
	CreatedAt     string `json:"createdAt"`
	MinutesStuck  int    `json:"minutesStuck"`
}

type PlatformDashboard struct {
	MerchantCount         int               `json:"merchantCount"`
	ActiveMerchantCount   int               `json:"activeMerchantCount"`
	StoreCount            int               `json:"storeCount"`
	ActiveStoreCount      int               `json:"activeStoreCount"`
	TodayTransactionCount int               `json:"todayTransactionCount"`
	TodayRevenue          int64             `json:"todayRevenue"`
	MerchantHealth        []MerchantHealth  `json:"merchantHealth"`
	StuckPending          []StuckPendingRow `json:"stuckPending"`
}
