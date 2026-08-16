// Types mirror the Go backend's JSON response shapes 1:1 (see
// ../../../backend/internal/domain and internal/httpapi DTOs) — keep in
// lockstep if either side changes a field.

export type Role = 'kasir' | 'ppic' | 'finance' | 'admin' | 'superadmin' | 'store_manager';

export interface AuthProfile {
  id: string;
  username: string;
  name: string;
  role: Role;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  merchantLogoUrl?: string;
  merchantSlug?: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  // Which back-office menu pages this account can see/use — ignored for
  // superadmin (role === 'superadmin'), who always has every page.
  allowedPages: string[];
}

export interface Merchant {
  id: string;
  name: string;
  address: string;
  logoUrl?: string;
  active: boolean;
  slug: string;
}

export interface Store {
  id: string;
  merchantId: string;
  name: string;
  address: string;
  active: boolean;
}

export interface UserSummary {
  id: string;
  username: string;
  name: string;
  role: Role; // legacy display only — access is no longer role-driven, see allowedPages
  active: boolean;
  merchantId: string;
  // Data filter: which stores' data this account can see/act on. Empty
  // means every store in the merchant. Also what a mobile POS account's
  // sale gets attributed to (the first entry).
  storeIds: string[];
  allowedPages: string[];
  // Pins this account to one specific EDC terminal when its store has more
  // than one (e.g. a kasir assigned to till 2). Empty means auto-pick the
  // first active terminal at sale time. Only meaningful when storeIds has
  // exactly one entry — mobile POS attribution is single-store already.
  edcTerminalId?: string;
}

export interface Product {
  id: string;
  merchantId: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  emoji: string;
  imageUrl?: string;
}

export type PromoType = 'percentage' | 'fixed';

export interface Promo {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  type: PromoType;
  value: number;
  minPurchase: number;
  categories?: string[];
  // Data filter: which stores this promo applies at. Empty means every
  // store in the merchant.
  storeIds?: string[];
  active: boolean;
}

export interface StorePaymentConfig {
  storeId: string;
  qrisEnabled: boolean;
  midtransEnv?: 'sandbox' | 'production';
  midtransServerKey?: string;
  midtransClientKey?: string;
}

// A store can have more than one EDC device paired to it (many-to-many
// POS<->EDC per the TSD integration spec) — each terminal is its own row
// rather than folded into StorePaymentConfig. `posId` (MID + station code)
// is what the physical EDC unit is provisioned with — shown throughout the
// UI so the mapping between a dashboard row and a physical device is
// unambiguous.
export interface EdcTerminal {
  id: string;
  storeId: string;
  label: string;
  mode: 'simulator' | 'live';
  wsUrl?: string;
  apiKey?: string;
  mid?: string;
  stationCode?: string;
  active: boolean;
}

// posId (MID + station code) is what the physical EDC unit is provisioned
// with — the backend only stores mid/stationCode separately, so this is
// derived client-side wherever it needs to be displayed.
export function edcPosId(t: Pick<EdcTerminal, 'mid' | 'stationCode'>): string {
  return `${t.mid ?? ''}${t.stationCode ?? ''}`;
}

export type PaymentMethod = 'cash' | 'qris' | 'edc';

export interface PaymentMeta {
  cardType?: string;
  bankName?: string;
  cardLast4?: string;
  approvalCode?: string;
  terminalId?: string;
  referenceNo?: string;
  qrisAcquirer?: string;
  qrisMerchantId?: string;
}

export interface TransactionHistoryRow {
  id: string;
  invoiceNo: string;
  total: number;
  status: 'paid' | 'voided';
  method: string;
  cashierName: string;
  createdAt: string;
  itemCount: number;
  merchantId?: string;
}

export interface TransactionDetailItem {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface TransactionDetail {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  promoName?: string;
  total: number;
  status: string;
  createdAt: string;
  cashierName: string;
  storeName: string;
  storeAddress: string;
  method: string;
  amountReceived: number | null;
  meta?: PaymentMeta;
  items: TransactionDetailItem[];
}

export interface DailySales {
  date: string;
  transactionCount: number;
  revenue: number;
}

export interface PaymentMethodShare {
  method: string;
  paymentCount: number;
  totalAmount: number;
}

export interface ProductPerformance {
  productId: string;
  name: string;
  qtySold: number;
  revenue: number;
}

export interface DashboardData {
  salesTrend: DailySales[];
  paymentBreakdown: PaymentMethodShare[];
  topProducts: ProductPerformance[];
  leastProducts: ProductPerformance[];
  todayTransactionCount: number;
  todayRevenue: number;
  lowStockCount: number;
}

export interface ReconciliationRow {
  date: string;
  method: string;
  systemTotal: number;
  paymentCount: number;
}

export interface MerchantHealth {
  merchantId: string;
  merchantName: string;
  paidCountToday: number;
  paidTotalToday: number;
  pendingCount: number;
  lastActivityAt?: string;
}

export interface StuckPendingRow {
  transactionId: string;
  invoiceNo: string;
  merchantName: string;
  storeName: string;
  amount: number;
  createdAt: string;
  minutesStuck: number;
}

export interface PlatformDashboard {
  merchantCount: number;
  activeMerchantCount: number;
  storeCount: number;
  activeStoreCount: number;
  todayTransactionCount: number;
  todayRevenue: number;
  merchantHealth: MerchantHealth[];
  stuckPending: StuckPendingRow[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  merchantId?: string;
  action: string;
  target?: string;
  detail?: string;
}
