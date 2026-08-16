export type Role = 'kasir' | 'ppic' | 'finance' | 'admin' | 'superadmin' | 'store_manager';

export interface AuthProfile {
  id: string;
  username: string;
  name: string;
  role: Role;
  merchantId?: string;
  merchantName: string;
  merchantAddress: string;
  merchantLogoUrl?: string;
  merchantSlug?: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  // Back-office menu permissions (see Game Sederhana/backoffice) — unused
  // on mobile, kept here only so this type stays a faithful mirror of the
  // backend's domain.AuthProfile.
  allowedPages?: string[];
}

export interface Store {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  emoji: string;
}

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export type PromoType = 'percentage' | 'fixed';

// Promo rules are assumed to be authored in the backoffice (out of scope for
// this app) — the Kasir app only reads active promos and auto-applies the
// best match, it never creates/edits them.
export interface Promo {
  id: string;
  name: string;
  description: string;
  type: PromoType;
  value: number; // percent (0-100) when type is 'percentage', rupiah when 'fixed'
  minPurchase: number;
  categories?: string[]; // undefined/empty = applies to every category
  // Which stores this promo applies at (undefined/empty = every store) —
  // the backend already filters GET /promos/active to only ones eligible
  // for the calling kasir's own store, so this is informational only here.
  storeIds?: string[];
  active: boolean;
}

export interface CreatedOrder {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  promoName?: string;
  total: number;
  itemCount: number;
  items: TransactionDetailItem[];
}

export type PaymentMethod = 'cash' | 'qris' | 'edc';

// Extra fields printed on the receipt depending on payment method — real
// EDC/QRIS terminals return these from the switching host; here they're
// generated as plausible-looking mock values (see PaymentMethodSelector).
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

export interface PayResult {
  paymentId: string;
  status: 'paid';
  meta?: PaymentMeta;
}

export type QRISChargeResult = {
  orderId: string;
  qrString: string;
  expiresAt: string;
};

export type QRISStatusResult = {
  status: 'pending' | 'settlement' | 'expire';
  meta?: PaymentMeta;
};

export interface PendingTransaction {
  id: string;
  invoiceNo: string;
  total: number;
  itemCount: number;
  cashierName: string;
  createdAt: string;
  minutesOpen: number;
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
