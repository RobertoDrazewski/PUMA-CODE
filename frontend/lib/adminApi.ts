// --- Cliente de API del panel de control ---
// Usa el mismo patron que el resto del front: NEXT_PUBLIC_API_URL o localhost.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'puma_admin_token';
const USER_KEY = 'puma_admin_user';

export type Role = 'admin' | 'worker';
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function saveSession(token: string, user: SessionUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin cuerpo */
  }

  if (res.status === 401) {
    clearSession();
    if (typeof window !== 'undefined') window.location.reload();
  }

  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

// --- Helpers de formato ---
export function money(amount: number | string, currency: string) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = currency === 'ARS' ? '$' : 'US$';
  return `${symbol} ${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}
