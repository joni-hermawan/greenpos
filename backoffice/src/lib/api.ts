import {
  AuditLog,
  AuthProfile,
  DashboardData,
  EdcTerminal,
  Merchant,
  PlatformDashboard,
  Product,
  Promo,
  ReconciliationRow,
  Store,
  StorePaymentConfig,
  TransactionDetail,
  TransactionHistoryRow,
  UserSummary,
} from './types';

// Real HTTP client against the GREEN POS Go backend (../backend) — the
// same one the mobile app talks to. No mock layer here (unlike the
// reference project this was designed against).
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';
// /uploads/* is served at the backend's root, not under /api/v1 — derive
// the origin once so uploadApi can turn the relative path the server
// returns into an absolute URL (needed since imageUrl/logoUrl get
// rendered from pages that don't share the backend's origin).
const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const DEMO_ACCOUNTS = [
  { username: 'admin01', password: 'demo123', label: 'Administrator' },
  { username: 'manager01', password: 'demo123', label: 'Store Manager' },
  { username: 'finance01', password: 'demo123', label: 'Finance' },
  { username: 'ppic01', password: 'demo123', label: 'PPIC' },
  { username: 'superadmin01', password: 'demo123', label: 'Superadmin' },
];

let authToken: string | null = null;

// The web app benefits from surviving a page refresh (unlike the mobile
// app's in-memory-only token) — persisted to localStorage, loaded once on
// module init (client-side only; SSR has no localStorage).
if (typeof window !== 'undefined') {
  authToken = window.localStorage.getItem('greenpos_token');
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem('greenpos_token', token);
  else window.localStorage.removeItem('greenpos_token');
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let url = `${BASE_URL}${path}`;
  if (options.query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== '') params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Tidak bisa terhubung ke server backend.');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401) {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('greenpos:session-expired'));
      }
    }
    throw new ApiError(res.status, data?.message ?? 'Terjadi kesalahan pada server.');
  }
  return data as T;
}

export const authApi = {
  login: async (username: string, password: string) => {
    const result = await request<{ token: string; profile: AuthProfile }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    setAuthToken(result.token);
    return result.profile;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },
  me: () => request<AuthProfile>('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ status: string }>('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } }),
};

export const merchantApi = {
  getMine: () => request<Merchant>('/merchants/me'),
  updateMine: (input: { name: string; address: string; logoUrl?: string }) =>
    request<Merchant>('/merchants/me', { method: 'PUT', body: input }),
  // get(id) is the superadmin "investigation mode" equivalent of getMine —
  // fetch any one merchant by id to show in the merchant switcher / as
  // context while looking at their data.
  get: (id: string) => request<Merchant>(`/merchants/${id}`),
  list: () => request<Merchant[]>('/merchants'),
  create: (input: { name: string; address: string }) =>
    request<Merchant>('/merchants', { method: 'POST', body: input }),
  update: (id: string, input: { name: string; address: string; logoUrl?: string }) =>
    request<Merchant>(`/merchants/${id}`, { method: 'PUT', body: input }),
  setActive: (id: string, active: boolean) =>
    request<{ status: string }>(`/merchants/${id}/active`, { method: 'POST', body: { active } }),
};

// Every `merchantId` param below is only ever sent for a superadmin acting
// in "investigation mode" (see lib/MerchantScopeContext.tsx) — every other
// role is scoped server-side to their own merchant regardless of what's
// passed, so it's safe to always thread it through.
export const storeApi = {
  list: (merchantId?: string) => request<Store[]>('/stores', { query: { merchantId } }),
  create: (input: { name: string; address: string }, merchantId?: string) =>
    request<Store>('/stores', { method: 'POST', body: input, query: { merchantId } }),
  update: (id: string, input: { name: string; address: string }, merchantId?: string) =>
    request<Store>(`/stores/${id}`, { method: 'PUT', body: input, query: { merchantId } }),
  setActive: (id: string, active: boolean) =>
    request<Store>(`/stores/${id}/active`, { method: 'POST', body: { active } }),
};

export const paymentConfigApi = {
  get: (storeId: string, merchantId?: string) =>
    request<StorePaymentConfig>(`/stores/${storeId}/payment-config`, { query: { merchantId } }),
  update: (storeId: string, cfg: Partial<StorePaymentConfig>, merchantId?: string) =>
    request<StorePaymentConfig>(`/stores/${storeId}/payment-config`, { method: 'PUT', body: cfg, query: { merchantId } }),
};

export type EdcTerminalInput = { label: string; mode: 'simulator' | 'live'; wsUrl?: string; apiKey?: string; mid?: string; stationCode?: string };

export const edcTerminalApi = {
  // Per-store editor list, used by the Pengaturan EDC page's terminal
  // manager for one store at a time.
  listByStore: (storeId: string, merchantId?: string) =>
    request<EdcTerminal[]>(`/stores/${storeId}/edc-terminals`, { query: { merchantId } }),
  // Cross-store mapping dashboard — every terminal across every store in
  // the merchant (or every merchant for superadmin with no merchantId), so
  // the whole EDC device layout is visible at a glance.
  listMapping: (merchantId?: string) => request<EdcTerminal[]>('/edc-terminals', { query: { merchantId } }),
  create: (storeId: string, input: EdcTerminalInput, merchantId?: string) =>
    request<EdcTerminal>(`/stores/${storeId}/edc-terminals`, { method: 'POST', body: input, query: { merchantId } }),
  update: (id: string, input: EdcTerminalInput, merchantId?: string) =>
    request<EdcTerminal>(`/edc-terminals/${id}`, { method: 'PUT', body: input, query: { merchantId } }),
  setActive: (id: string, active: boolean, merchantId?: string) =>
    request<EdcTerminal>(`/edc-terminals/${id}/active`, { method: 'POST', body: { active }, query: { merchantId } }),
  delete: (id: string, merchantId?: string) =>
    request<{ status: string }>(`/edc-terminals/${id}`, { method: 'DELETE', query: { merchantId } }),
};

export const productApi = {
  list: (merchantId?: string) => request<Product[]>('/products', { query: { merchantId } }),
  create: (input: Omit<Product, 'id' | 'merchantId'>, merchantId?: string) =>
    request<Product>('/products', { method: 'POST', body: input, query: { merchantId } }),
  update: (id: string, input: Omit<Product, 'id' | 'merchantId'>, merchantId?: string) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: input, query: { merchantId } }),
  delete: (id: string, merchantId?: string) =>
    request<{ status: string }>(`/products/${id}`, { method: 'DELETE', query: { merchantId } }),
  adjustStock: (id: string, delta: number, reason: string, merchantId?: string) =>
    request<Product>(`/products/${id}/adjust-stock`, { method: 'POST', body: { delta, reason }, query: { merchantId } }),
};

export const promoApi = {
  list: (merchantId?: string) => request<Promo[]>('/promos', { query: { merchantId } }),
  create: (input: Omit<Promo, 'id' | 'merchantId'>, merchantId?: string) =>
    request<Promo>('/promos', { method: 'POST', body: input, query: { merchantId } }),
  update: (id: string, input: Omit<Promo, 'id' | 'merchantId'>, merchantId?: string) =>
    request<Promo>(`/promos/${id}`, { method: 'PUT', body: input, query: { merchantId } }),
  delete: (id: string, merchantId?: string) =>
    request<{ status: string }>(`/promos/${id}`, { method: 'DELETE', query: { merchantId } }),
};

export const userApi = {
  list: (merchantId?: string) => request<UserSummary[]>('/users', { query: { merchantId } }),
  create: (input: { username: string; password: string; name: string; merchantId?: string; storeIds: string[]; allowedPages: string[]; edcTerminalId?: string }) =>
    request<UserSummary>('/users', { method: 'POST', body: input }),
  update: (id: string, input: { name: string; allowedPages: string[] }) =>
    request<UserSummary>(`/users/${id}`, { method: 'PUT', body: input }),
  setActive: (id: string, active: boolean) =>
    request<UserSummary>(`/users/${id}/active`, { method: 'POST', body: { active } }),
  resetPassword: (id: string, newPassword: string) =>
    request<{ status: string }>(`/users/${id}/reset-password`, { method: 'POST', body: { newPassword } }),
  // Data filter: which stores this account's views/mobile POS are scoped
  // to — empty means every store in their merchant.
  setStoreFilter: (id: string, storeIds: string[]) =>
    request<UserSummary>(`/users/${id}/store-filter`, { method: 'POST', body: { storeIds } }),
  // Pin/unpin which EDC terminal this account's POS sales resolve to when
  // its (single) store has more than one terminal. Empty = auto-pick.
  setEDCTerminal: (id: string, edcTerminalId: string) =>
    request<UserSummary>(`/users/${id}/edc-terminal`, { method: 'POST', body: { edcTerminalId } }),
  reassignMerchant: (id: string, merchantId: string) =>
    request<UserSummary>(`/users/${id}/reassign-merchant`, { method: 'POST', body: { merchantId } }),
};

export const transactionApi = {
  history: (storeId?: string, days = 30, merchantId?: string) =>
    request<TransactionHistoryRow[]>('/transactions/history', { query: { storeId, days, merchantId } }),
  detail: (id: string, merchantId?: string) =>
    request<TransactionDetail>(`/transactions/${id}`, { query: { merchantId } }),
};

export const reportApi = {
  dashboard: (storeId?: string, days = 7, merchantId?: string) =>
    request<DashboardData>('/reports/dashboard', { query: { storeId, days, merchantId } }),
  reconciliation: (storeId?: string, days = 30, merchantId?: string) =>
    request<ReconciliationRow[]>('/reports/reconciliation', { query: { storeId, days, merchantId } }),
};

export const platformApi = {
  dashboard: () => request<PlatformDashboard>('/platform/dashboard'),
};

export const auditApi = {
  list: (merchantId?: string, limit = 200) => request<AuditLog[]>('/audit-log', { query: { merchantId, limit } }),
};

// Product images and merchant logos — browse a file, get back an absolute
// URL ready to drop straight into imageUrl/logoUrl. Existing dummy data
// that still points at an external URL keeps working unchanged: both are
// just strings an <img src> renders identically.
export const uploadApi = {
  upload: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const headers: Record<string, string> = {};
    if (getAuthToken()) headers.Authorization = `Bearer ${getAuthToken()}`;
    const res = await fetch(`${BASE_URL}/uploads`, { method: 'POST', headers, body: form });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Gagal mengunggah file.');
    return `${API_ORIGIN}${data.url}`;
  },
};
