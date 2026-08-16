import { AuthProfile } from './types';

// Access is no longer role-tiered — every account except superadmin is
// just "Staff" here, differentiated by which menus/stores they're
// actually granted (see effectivePages below and the Pengguna page).
export function roleLabel(role: string): string {
  return role === 'superadmin' ? 'Superadmin' : 'Staff';
}

export type PageId =
  | 'dashboard'
  | 'produk'
  | 'promo'
  | 'reporting'
  | 'riwayat'
  | 'stores'
  | 'users'
  | 'pengaturan-merchant'
  | 'pengaturan-edc'
  | 'pengaturan-qris'
  | 'superadmin-dashboard'
  | 'superadmin-merchants'
  | 'audit-trail';

// Every merchant-scoped page a regular user can be granted — mirrors the
// backend's domain.AssignablePages exactly (backend/internal/domain/user.go).
// The three platform-only pages below are deliberately excluded: those
// stay purely a superadmin capability, never grantable through the
// Pengguna page's menu checkboxes no matter what's checked.
//
// Order here is the sidebar's nav order (and the Pengguna page's menu
// checkbox/filter order) — deliberately grouped, not alphabetical:
//   1. Overview        — dashboard
//   2. Merchant & Store — pengaturan-merchant, stores (raised above daily
//                         operations and kept adjacent: a store only ever
//                         exists under a merchant, so the two read as one
//                         hierarchy, not two unrelated settings pages)
//   3. Tim              — users
//   4. Operasional       — produk, promo, riwayat (day-to-day, high-frequency)
//   5. Analitik          — reporting (deeper analysis of the same data)
//   6. Pengaturan        — pengaturan-edc/qris (per-store payment config,
//                         rarely touched once set up)
export const ASSIGNABLE_PAGES: PageId[] = [
  'dashboard',
  'pengaturan-merchant', 'stores',
  'users',
  'produk', 'promo', 'riwayat',
  'reporting',
  'pengaturan-edc', 'pengaturan-qris',
];

// A back-office account's menu access is no longer a fixed role tier —
// it's picked per-user (AuthProfile.allowedPages, set in the Pengguna
// page). superadmin is the one fixed exception: always every
// merchant-scoped page plus the platform-only ones. "Merchants" (the
// platform-wide merchant list) slots in right after "Stores" rather than
// being tacked on at the very end with the other platform-only pages —
// merchant and store are the same organizational hierarchy just zoomed
// out one more level for superadmin, so they read as one continuous
// group. Investigation mode via the merchant switcher (see
// lib/MerchantScopeContext.tsx) lets them look at any merchant's data to
// help with a complaint.
export function effectivePages(user: Pick<AuthProfile, 'role' | 'allowedPages'>): PageId[] {
  if (user.role === 'superadmin') {
    const pages: PageId[] = [];
    for (const p of ASSIGNABLE_PAGES) {
      pages.push(p);
      if (p === 'stores') pages.push('superadmin-merchants');
    }
    return [...pages, 'superadmin-dashboard', 'audit-trail'];
  }
  return ASSIGNABLE_PAGES.filter(p => user.allowedPages.includes(p));
}

export const PAGE_META: Record<PageId, { title: string; subtitle: string; href: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Ringkasan performa toko', href: '/dashboard' },
  produk: { title: 'Produk & Stok', subtitle: 'Kelola katalog produk dan stok', href: '/produk' },
  promo: { title: 'Promo', subtitle: 'Kelola diskon otomatis untuk kasir', href: '/promo' },
  reporting: { title: 'Reporting', subtitle: 'Rekonsiliasi pembayaran per metode', href: '/reporting' },
  riwayat: { title: 'Riwayat Transaksi', subtitle: 'Cari transaksi yang sudah selesai', href: '/riwayat' },
  stores: { title: 'Stores', subtitle: 'Kelola cabang/outlet merchant Anda', href: '/stores' },
  users: { title: 'Pengguna', subtitle: 'Kelola akun staff, akses menu, dan cakupan store', href: '/users' },
  'pengaturan-merchant': { title: 'Profil Merchant', subtitle: 'Nama, alamat, dan logo bisnis Anda', href: '/pengaturan/merchant' },
  'pengaturan-edc': { title: 'Pengaturan EDC', subtitle: 'Integrasi mesin EDC per store', href: '/pengaturan/edc' },
  'pengaturan-qris': { title: 'Pengaturan QRIS', subtitle: 'Akun Midtrans per store', href: '/pengaturan/qris' },
  'superadmin-dashboard': { title: 'Dashboard Platform', subtitle: 'Monitor seluruh merchant', href: '/superadmin/dashboard' },
  'superadmin-merchants': { title: 'Merchants', subtitle: 'Kelola semua merchant di platform', href: '/superadmin/merchants' },
  'audit-trail': { title: 'Audit Trail', subtitle: 'Riwayat aksi lintas merchant', href: '/superadmin/audit-trail' },
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  qris: 'QRIS',
  edc: 'EDC',
  '': '-',
};
