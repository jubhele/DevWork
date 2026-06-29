import type {
  ApiResponse,
  PaginatedResponse,
  AuthResponse,
  User,
  Callout,
  Quote,
  Invoice,
  Client,
  SafetyFile,
  Statement,
  DashboardKPIs,
  AuditEvent,
} from '@blackfire/types'

// Injected at build time — web uses session cookie, mobile passes Bearer token
const API_BASE =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
    : 'https://blackfiresolutions.co.za/api'

export class AuthError extends Error {
  constructor() { super('Unauthenticated') }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

interface FetchOptions extends RequestInit {
  token?: string   // Bearer token for mobile path
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...rest } = options
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    ...(rest.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (rest.body && typeof rest.body === 'string') headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}/${endpoint}`, {
    credentials: 'include',   // web session cookie
    ...rest,
    headers,
  })

  if (res.status === 401) throw new AuthError()
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const auth = {
  captcha: () =>
    apiFetch<ApiResponse<{ question: string }>>('auth.php?action=captcha'),

  me: (token?: string) =>
    apiFetch<ApiResponse<User>>('auth.php?action=me', { token }),

  login: (username: string, password: string, captcha?: string) =>
    apiFetch<AuthResponse>('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password, captcha }),
    }),

  mobileLogin: (username: string, password: string, device_id: string, device_name: string) =>
    apiFetch<AuthResponse>('auth.php?action=mobile_login', {
      method: 'POST',
      body: JSON.stringify({ username, password, device_id, device_name }),
    }),

  logout: (token?: string) =>
    apiFetch<ApiResponse>('auth.php?action=logout', { method: 'POST', token }),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboard = {
  kpis: (token?: string) =>
    apiFetch<ApiResponse<DashboardKPIs>>('dashboard.php', { token }),
}

// ─── Callouts ────────────────────────────────────────────────────────────────

export const callouts = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<PaginatedResponse<Callout>>(`callouts.php${qs}`, { token })
  },
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<Callout>>(`callouts.php?id=${id}`, { token }),
  create: (data: Partial<Callout>, token?: string) =>
    apiFetch<ApiResponse<Callout>>('callouts.php', { method: 'POST', body: JSON.stringify(data), token }),
  update: (id: number, data: Partial<Callout>, token?: string) =>
    apiFetch<ApiResponse<Callout>>(`callouts.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export const quotes = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<PaginatedResponse<Quote>>(`quotes.php${qs}`, { token })
  },
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<Quote>>(`quotes.php?id=${id}`, { token }),
  approve: (id: number, token?: string) =>
    apiFetch<ApiResponse>(`approvals.php`, { method: 'POST', body: JSON.stringify({ type: 'quote', id }), token }),
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export const invoices = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<PaginatedResponse<Invoice>>(`invoices.php${qs}`, { token })
  },
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<Invoice>>(`invoices.php?id=${id}`, { token }),
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clients = {
  list: (token?: string) =>
    apiFetch<ApiResponse<Client[]>>('clients.php', { token }),
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<Client>>(`clients.php?id=${id}`, { token }),
}

// ─── Safety ──────────────────────────────────────────────────────────────────

export const safety = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<PaginatedResponse<SafetyFile>>(`safety.php${qs}`, { token })
  },
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<SafetyFile>>(`safety.php?id=${id}`, { token }),
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export const finance = {
  statement: (client_id: number, from: string, to: string, token?: string) =>
    apiFetch<ApiResponse<Statement>>(
      `statements.php?client_id=${client_id}&from=${from}&to=${to}`,
      { token }
    ),
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export const audit = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<PaginatedResponse<AuditEvent>>(`audit.php${qs}`, { token })
  },
}
