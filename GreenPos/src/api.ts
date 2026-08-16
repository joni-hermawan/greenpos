import {
  AuthProfile,
  CreatedOrder,
  PayResult,
  PendingTransaction,
  Product,
  Promo,
  QRISChargeResult,
  QRISStatusResult,
  Store,
  TransactionDetail,
  TransactionHistoryRow,
} from './types';

// Real HTTP client for the GREEN POS Go backend (../backend). Talks to
// http://10.0.2.2:8080 — the Android emulator's alias for the host
// machine's localhost. A physical device would need the host's LAN IP
// instead (e.g. http://192.168.x.x:8080).
const BASE_URL = 'http://10.0.2.2:8080/api/v1';

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
  { username: 'kasir01', password: 'demo123', label: 'Kasir' },
  { username: 'ppic01', password: 'demo123', label: 'PPIC' },
  { username: 'finance01', password: 'demo123', label: 'Finance' },
];

// Kept in-memory only (mirrors how the old mock's `currentUser` worked) —
// no persistence across app restarts, so a fresh launch always needs login.
let authToken: string | null = null;

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Tidak bisa terhubung ke server. Periksa koneksi Anda.');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
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
    authToken = result.token;
    return result.profile;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      authToken = null;
    }
    return { status: 'ok' };
  },
};

export const storeApi = {
  list: () => request<Store[]>('/stores'),
};

export const productApi = {
  list: () => request<Product[]>('/products'),
};

export const promoApi = {
  listActive: () => request<Promo[]>('/promos/active'),
};

export const transactionApi = {
  create: (items: { productId: string; qty: number }[]) =>
    request<CreatedOrder>('/transactions', { method: 'POST', body: { items } }),

  listPending: (storeId?: string) =>
    request<PendingTransaction[]>(`/transactions/pending${storeId ? `?storeId=${storeId}` : ''}`),

  history: (storeId?: string, days = 30) => {
    const params = new URLSearchParams();
    if (storeId) params.set('storeId', storeId);
    params.set('days', String(days));
    return request<TransactionHistoryRow[]>(`/transactions/history?${params.toString()}`);
  },

  detail: (transactionId: string) => request<TransactionDetail>(`/transactions/${transactionId}`),

  void: (transactionId: string) =>
    request<{ status: string }>(`/transactions/${transactionId}/void`, { method: 'POST' }),

  payCash: (transactionId: string, amountReceived: number) =>
    request<PayResult>(`/transactions/${transactionId}/pay/cash`, {
      method: 'POST',
      body: { amountReceived },
    }),

  payEDC: (transactionId: string) =>
    request<PayResult>(`/transactions/${transactionId}/pay/edc`, { method: 'POST' }),

  qrisCharge: (transactionId: string) =>
    request<QRISChargeResult>(`/transactions/${transactionId}/pay/qris/charge`, { method: 'POST' }),

  qrisStatus: (transactionId: string) =>
    request<QRISStatusResult>(`/transactions/${transactionId}/pay/qris/status`),
};
