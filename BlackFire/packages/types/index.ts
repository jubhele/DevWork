// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role =
  | 'sysadmin'
  | 'admin'
  | 'manager'
  | 'finance'
  | 'safety_officer'
  | 'viewer'
  | 'client_support'
  | 'junior_tech'
  | 'senior_tech'
  | 'call_logger'
  | 'admin_clerk'

export interface User {
  id: number
  username: string
  name: string
  email: string
  role: Role
  permissions: string[]
  client_id: number | null
  active: boolean
  created_at: string
  last_login: string | null
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string  // mobile Bearer token only
  message?: string
}

// ─── Callouts ────────────────────────────────────────────────────────────────

export type CalloutPriority = 'Normal' | 'Urgent' | 'Emergency'
export type CalloutStatus = 'Open' | 'In Progress' | 'Completed' | 'Invoiced' | 'Cancelled'

export interface Callout {
  id: number
  ref_id: string                  // JOB-YYMMDD-XXXX
  client_id: number | null
  client_name: string
  service: string
  location: string
  priority: CalloutPriority
  status: CalloutStatus
  assigned_to: string | null
  callout_date: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired'

export interface QuoteItem {
  id: number
  quote_id: number
  description: string
  qty: number
  unit_price: number
  total: number
}

export interface Quote {
  id: number
  quote_number: string
  client_id: number
  client_name: string
  callout_id: number | null
  status: QuoteStatus
  subtotal: number
  tax: number
  total: number
  valid_until: string
  notes: string | null
  items: QuoteItem[]
  created_by: string
  created_at: string
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'

export interface Invoice {
  id: number
  invoice_number: string
  client_id: number
  client_name: string
  quote_id: number | null
  amount: number
  tax: number
  total: number
  status: InvoiceStatus
  due_date: string
  paid_date: string | null
  notes: string | null
  created_by: string
  created_at: string
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export interface Client {
  id: number
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  site: string | null
  active: boolean
  created_at: string
}

// ─── Safety ──────────────────────────────────────────────────────────────────

export type SafetyFileStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
export type SafetyItemStatus = 'Pass' | 'Fail' | 'Not to Standard' | 'N/A' | 'Pending'
export type ComplianceLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'

export interface SafetyItem {
  id: number
  file_id: number
  section: string
  item_number: number
  description: string
  status: SafetyItemStatus
  comment: string | null
  evidence_path: string | null
  updated_at: string
}

export interface SafetyFile {
  id: number
  ref_id: string                  // SAF-YYMMDD-XXXX
  client_id: number
  client_name: string
  site: string
  status: SafetyFileStatus
  score: number
  total_items: number
  score_percent: number
  compliance_level: ComplianceLevel
  submitted_by: string | null
  approved_by: string | null
  submitted_at: string | null
  approved_at: string | null
  created_at: string
  items?: SafetyItem[]
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export type TransactionType = 'credit' | 'debit'

export interface Transaction {
  id: number
  client_id: number
  invoice_id: number | null
  type: TransactionType
  amount: number
  description: string
  transaction_date: string
  created_at: string
}

export interface Payment {
  id: number
  invoice_id: number
  amount: number
  method: string
  reference: string | null
  payment_date: string
  created_at: string
}

export interface Statement {
  client_id: number
  client_name: string
  period_start: string
  period_end: string
  opening_balance: number
  total_invoiced: number
  total_paid: number
  closing_balance: number
  transactions: Transaction[]
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  open_callouts: number
  overdue_invoices: number
  mtd_revenue: number
  safety_score: number | null
  pending_quotes: number
  active_clients: number
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: number
  user_id: number
  username: string
  action: string
  entity: string
  entity_id: number | null
  detail: string | null
  ip: string | null
  created_at: string
}

// ─── API responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  per_page: number
}
