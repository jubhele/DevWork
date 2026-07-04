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
  Task,
  TaskCategory,
  TaskStatus,
} from '@blackfire/types'

// Injected at build time — web uses session cookie, mobile passes Bearer token
const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ??
  process.env.NEXT_PUBLIC_API_BASE ??
  'http://localhost:8080/api'

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
  captcha: async () => {
    const res = await fetch('/api/auth/captcha', {
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
    }
    return res.json() as Promise<{ success: boolean; message?: string; question?: string }>
  },

  me: async (token?: string) => {
    const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
      headers,
    })
    if (res.status === 401) throw new AuthError()
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
    }
    return res.json() as Promise<ApiResponse<User>>
  },

  login: (username: string, password: string, captcha?: string) =>
    fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, captcha }),
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
      }
      return res.json() as Promise<AuthResponse>
    }),

  mobileLogin: (username: string, password: string, device_id: string, device_name: string) =>
    apiFetch<AuthResponse>('auth.php?action=mobile_login', {
      method: 'POST',
      body: JSON.stringify({ username, password, device_id, device_name }),
    }),

  logout: (token?: string) =>
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
      }
      return res.json() as Promise<ApiResponse>
    }),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboard = {
  kpis: (token?: string) =>
    apiFetch<ApiResponse<DashboardKPIs>>('/api/dashboard', { token }),
}

// ─── Callouts ────────────────────────────────────────────────────────────────

export const callouts = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ success: boolean; data: Callout[]; total: number }>(`/api/callouts${qs}`, { token })
  },
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<Callout>>(`/api/callouts?id=${id}`, { token }),
  create: (data: Partial<Callout>, token?: string) =>
    apiFetch<ApiResponse<Callout>>('/api/callouts', { method: 'POST', body: JSON.stringify(data), token }),
  update: (id: number, data: Partial<Callout>, token?: string) =>
    apiFetch<ApiResponse<Callout>>(`/api/callouts?id=${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export const quotes = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ success: boolean; data: Quote[]; total: number }>(`/api/quotes${qs}`, { token })
  },
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<Quote>>(`/api/quotes?id=${id}`, { token }),
  create: (data: Partial<Quote> & { items: Array<{ description: string; qty: number; unitPrice: number }> }, token?: string) =>
    apiFetch<ApiResponse<Quote>>('/api/quotes', { method: 'POST', body: JSON.stringify(data), token }),
  approve: (id: number, token?: string) =>
    apiFetch<ApiResponse>(`approvals.php`, { method: 'POST', body: JSON.stringify({ type: 'quote', id }), token }),
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export const invoices = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ success: boolean; data: Invoice[]; total: number }>(`/api/invoices${qs}`, { token })
  },
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<Invoice>>(`/api/invoices?id=${id}`, { token }),
  create: (data: Partial<Invoice>, token?: string) =>
    apiFetch<ApiResponse<Invoice>>('/api/invoices', { method: 'POST', body: JSON.stringify(data), token }),
  markPaid: (id: number, paidDate?: string, token?: string) =>
    apiFetch<ApiResponse<Invoice>>('/api/invoices', { method: 'PATCH', body: JSON.stringify({ id, paidDate }), token }),
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clients = {
  list: (token?: string) =>
    apiFetch<ApiResponse<Client[]>>('/api/clients', { token }),
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<Client>>(`/api/clients?id=${id}`, { token }),
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasks = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ success: boolean; data: Task[]; total: number }>(`/api/tasks${qs}`, { token })
  },
  get: (id: string | number, token?: string) =>
    apiFetch<ApiResponse<Task>>(`/api/tasks?id=${id}`, { token }),
  create: (data: { category: TaskCategory; title: string; [k: string]: unknown }, token?: string) =>
    apiFetch<ApiResponse<Task>>('/api/tasks', { method: 'POST', body: JSON.stringify(data), token }),
  updateStatus: (refId: string, status: TaskStatus, token?: string) =>
    apiFetch<ApiResponse<Task>>('/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: refId, status }), token }),
}

// ─── Safety ──────────────────────────────────────────────────────────────────

export const safety = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<PaginatedResponse<SafetyFile>>(`/api/safety${qs}`, { token })
  },
  get: (id: number, token?: string) =>
    apiFetch<ApiResponse<SafetyFile>>(`/api/safety?id=${id}`, { token }),
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export const finance = {
  summary: (token?: string) =>
    apiFetch<{ success: boolean; data: { mtd_invoiced: number; mtd_collected: number; outstanding_balance: number; overdue_amount: number; overdue_count: number; aging: Array<{ band: string; amount: number }> } }>('/api/finance', { token }),
  statement: (client_id: number, from: string, to: string, token?: string) =>
    apiFetch<ApiResponse<Statement>>(
      `statements.php?client_id=${client_id}&from=${from}&to=${to}`,
      { token }
    ),
}

// ─── Tracker updates ─────────────────────────────────────────────────────────

export const trackerUpdates = {
  list: (entityType: string, entityRef: string, token?: string) =>
    apiFetch<{ success: boolean; data: unknown[] }>(`/api/tracker-updates?entity_type=${encodeURIComponent(entityType)}&entity_ref=${encodeURIComponent(entityRef)}`, { token }),
  revisions: (id: number, token?: string) =>
    apiFetch<{ success: boolean; data: unknown[] }>(`/api/tracker-updates?id=${id}&action=revisions`, { token }),
  create: (data: { entityType: string; entityRef: string; label: string; content: string; sourceKind?: string }, token?: string) =>
    apiFetch<{ success: boolean; data: { id: number } }>('/api/tracker-updates', { method: 'POST', body: JSON.stringify(data), token }),
  update: (id: number, data: { label: string; content: string }, token?: string) =>
    apiFetch<{ success: boolean }>(`/api/tracker-updates?id=${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
  delete: (id: number, token?: string) =>
    apiFetch<{ success: boolean }>(`/api/tracker-updates?id=${id}`, { method: 'DELETE', token }),
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ success: boolean; data: unknown[]; total: number; totals: { total_credit: number; total_debit: number } }>(`/api/transactions${qs}`, { token })
  },
  create: (data: { trans_date: string; description: string; category: string; reference?: string; credit?: number; debit?: number }, token?: string) =>
    apiFetch<{ success: boolean; data: { id: number } }>('/api/transactions', { method: 'POST', body: JSON.stringify(data), token }),
}

// ─── Enquiries ────────────────────────────────────────────────────────────────

export const enquiries = {
  submit: (data: { name: string; company?: string; phone?: string; email: string; service: string; message?: string }, token?: string) =>
    apiFetch<{ success: boolean; message: string }>('/api/enquiries', { method: 'POST', body: JSON.stringify(data), token }),
  list: (token?: string) =>
    apiFetch<{ success: boolean; enquiries: unknown[] }>('/api/enquiries', { token }),
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export const audit = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<PaginatedResponse<AuditEvent>>('/api/audit', { token })
  },
}
