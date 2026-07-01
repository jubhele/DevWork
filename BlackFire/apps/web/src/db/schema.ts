import {
  mysqlTable,
  int,
  varchar,
  char,
  mysqlEnum,
  tinyint,
  datetime,
  timestamp,
  date,
  time,
  decimal,
  text,
  longtext,
  json,
  mediumtext,
  bigint,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

// ─────────────────────────────────────────────────────────────────────────────
// Auth + RBAC tables + full business schema.
// Hand-authored from the production bf_ SQL migrations and PHP INSERT queries.
// Run `pnpm --filter web db:pull` against PlanetScale to validate/diff once provisioned.
// ─────────────────────────────────────────────────────────────────────────────

export const userRole = [
  'sysadmin', 'admin', 'manager', 'admin_clerk', 'call_logger',
  'junior_tech', 'senior_tech', 'client_support', 'viewer', 'client', 'safety_officer',
  'finance', 'inspector',
] as const

export const bfUsers = mysqlTable('bf_users', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: mysqlEnum('role', userRole).default('viewer').notNull(),
  title: varchar('title', { length: 100 }).default('').notNull(),
  email: varchar('email', { length: 150 }).default('').notNull(),
  signatureImage: mediumtext('signature_image'),
  signatureUpdatedBy: varchar('signature_updated_by', { length: 100 }),
  signatureUpdatedAt: datetime('signature_updated_at'),
  active: tinyint('active').default(1).notNull(),
  dashboardLayout: longtext('dashboard_layout'),
  lastLogin: datetime('last_login'),
  createdAt: datetime('created_at').notNull(),
  clientId: int('client_id', { unsigned: true }),
}, (t) => [
  uniqueIndex('username').on(t.username),
  index('idx_role').on(t.role),
  index('idx_us_client_id').on(t.clientId),
])

export const bfMobileTokens = mysqlTable('bf_mobile_tokens', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  tokenHash: char('token_hash', { length: 64 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }),
  deviceName: varchar('device_name', { length: 255 }),
  lastUsedAt: datetime('last_used_at'),
  expiresAt: datetime('expires_at').notNull(),
  revoked: tinyint('revoked').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('token_hash').on(t.tokenHash),
  index('idx_user').on(t.userId),
  index('idx_expires').on(t.expiresAt),
  index('idx_device').on(t.deviceId),
])

export const bfUserRoles = mysqlTable('bf_user_roles', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  userId: int('user_id', { unsigned: true }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
}, (t) => [
  uniqueIndex('uq_user_role').on(t.userId, t.role),
])

export const bfRolePermissions = mysqlTable('bf_role_permissions', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  role: varchar('role', { length: 30 }).notNull(),
  permission: varchar('permission', { length: 60 }).notNull(),
}, (t) => [
  uniqueIndex('uq_role_perm').on(t.role, t.permission),
])

export const bfCounters = mysqlTable('bf_counters', {
  counterType: varchar('counter_type', { length: 20 }).primaryKey(),
  currentValue: int('current_value', { unsigned: true }).default(0).notNull(),
})

export const bfAuditLog = mysqlTable('bf_audit_log', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  detail: varchar('detail', { length: 500 }).default('').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).default('').notNull(),
  createdAt: datetime('created_at').notNull(),
}, (t) => [
  index('idx_user').on(t.username),
  index('idx_action').on(t.action),
  index('idx_time').on(t.createdAt),
])

// ─────────────────────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────────────────────

export const bfClients = mysqlTable('bf_clients', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  contact: varchar('contact', { length: 100 }).default('').notNull(),
  email: varchar('email', { length: 150 }).default('').notNull(),
  phone: varchar('phone', { length: 50 }).default('').notNull(),
  vatNumber: varchar('vat_number', { length: 50 }).default('').notNull(),
  address: varchar('address', { length: 255 }).default('').notNull(),
  contactPerson: varchar('contact_person', { length: 255 }).default('').notNull(),
  contactDetails: text('contact_details'),
  notes: text('notes'),
  isActive: tinyint('is_active').default(1).notNull(),
  createdBy: varchar('created_by', { length: 100 }).default('').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('idx_cl_name').on(t.name),
  index('idx_cl_is_active').on(t.isActive),
])

export const bfClientContacts = mysqlTable('bf_client_contacts', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  clientId: int('client_id', { unsigned: true }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).default('').notNull(),
  email: varchar('email', { length: 150 }).default('').notNull(),
  phone: varchar('phone', { length: 50 }).default('').notNull(),
  title: varchar('title', { length: 100 }).default('').notNull(),
  isPrimary: tinyint('is_primary').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('idx_cc_client_id').on(t.clientId),
  index('idx_cc_is_primary').on(t.clientId, t.isPrimary),
])

// ─────────────────────────────────────────────────────────────────────────────
// Callouts
// ─────────────────────────────────────────────────────────────────────────────

export const bfCallouts = mysqlTable('bf_callouts', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  refId: varchar('ref_id', { length: 20 }).notNull(),
  jobNo: varchar('job_no', { length: 50 }),
  clientId: int('client_id', { unsigned: true }),
  clientName: varchar('client_name', { length: 150 }).notNull(),
  clientEmail: varchar('client_email', { length: 150 }).default('').notNull(),
  service: varchar('service', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).default('').notNull(),
  tech: varchar('tech', { length: 100 }).default('').notNull(),
  assignedTo: varchar('assigned_to', { length: 50 }).default('').notNull(),
  assignedToUserId: int('assigned_to_user_id', { unsigned: true }),
  priority: mysqlEnum('priority', ['Normal', 'Urgent', 'Emergency']).default('Normal').notNull(),
  status: mysqlEnum('status', ['Open', 'In Progress', 'Completed', 'Invoiced', 'Cancelled']).default('Open').notNull(),
  approvalStatus: mysqlEnum('approval_status', ['not_required', 'pending', 'approved', 'rejected']).default('not_required').notNull(),
  approvalToken: varchar('approval_token', { length: 64 }),
  approvalTokenExpires: datetime('approval_token_expires'),
  calloutDate: date('callout_date').notNull(),
  calloutTime: time('callout_time').default('08:00:00').notNull(),
  notes: text('notes'),
  loggedByUserId: int('logged_by_user_id', { unsigned: true }),
  po: varchar('po', { length: 50 }).default('').notNull(),
  startAt: datetime('start_at'),
  endAt: datetime('end_at'),
  dueAt: datetime('due_at'),
  invoiceGenerated: tinyint('invoice_generated').default(0).notNull(),
  closureConfirmed: tinyint('closure_confirmed').default(0).notNull(),
  closureConfirmedBy: varchar('closure_confirmed_by', { length: 50 }).default('').notNull(),
  closureConfirmedAt: datetime('closure_confirmed_at'),
  closureNotes: text('closure_notes'),
  approvedAt: datetime('approved_at'),
  approvedBy: varchar('approved_by', { length: 100 }).default('').notNull(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex('uq_ref_id').on(t.refId),
  index('idx_co_client_id').on(t.clientId),
  index('idx_co_status').on(t.status),
  index('idx_co_assigned').on(t.assignedToUserId),
  index('idx_co_date').on(t.calloutDate),
])

// ─────────────────────────────────────────────────────────────────────────────
// Quotes + Quote items
// ─────────────────────────────────────────────────────────────────────────────

export const bfQuotes = mysqlTable('bf_quotes', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  refId: varchar('ref_id', { length: 20 }).notNull(),
  quoteNo: varchar('quote_no', { length: 50 }),
  clientId: int('client_id', { unsigned: true }),
  clientName: varchar('client_name', { length: 150 }).notNull(),
  clientEmail: varchar('client_email', { length: 150 }).default('').notNull(),
  status: mysqlEnum('status', ['Draft', 'Sent', 'Approved', 'Rejected', 'Pending Approval', 'Expired', 'Converted']).default('Draft').notNull(),
  validUntil: date('valid_until'),
  quoteDate: date('quote_date').notNull(),
  submittedBy: varchar('submitted_by', { length: 50 }).default('').notNull(),
  submittedByUserId: int('submitted_by_user_id', { unsigned: true }),
  source: varchar('source', { length: 50 }).default('staff').notNull(),
  approvalStatus: mysqlEnum('approval_status', ['pending', 'approved', 'rejected']),
  approvalToken: varchar('approval_token', { length: 64 }),
  approvalTokenExpires: datetime('approval_token_expires'),
  notes: text('notes'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  approvedAt: datetime('approved_at'),
  approvedBy: varchar('approved_by', { length: 100 }).default('').notNull(),
  calloutRef: varchar('callout_ref', { length: 30 }).default('').notNull(),
  calloutId: int('callout_id', { unsigned: true }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex('uq_ref_id').on(t.refId),
  index('idx_q_client_id').on(t.clientId),
  index('idx_q_status').on(t.status),
  index('idx_q_callout').on(t.calloutRef),
])

export const bfQuoteItems = mysqlTable('bf_quote_items', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  quoteId: int('quote_id', { unsigned: true }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  qty: decimal('qty', { precision: 10, scale: 2 }).default('1.00').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).default('0.00').notNull(),
  lineTotal: decimal('line_total', { precision: 12, scale: 2 }),
}, (t) => [
  index('idx_qi_quote').on(t.quoteId),
])

// ─────────────────────────────────────────────────────────────────────────────
// Invoices + Payments
// ─────────────────────────────────────────────────────────────────────────────

export const bfInvoices = mysqlTable('bf_invoices', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  refId: varchar('ref_id', { length: 30 }).notNull(),
  invoiceNo: varchar('invoice_no', { length: 50 }),
  clientId: int('client_id', { unsigned: true }),
  clientName: varchar('client_name', { length: 150 }).notNull(),
  clientEmail: varchar('client_email', { length: 150 }).default('').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  dueDate: date('due_date').notNull(),
  status: mysqlEnum('status', ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']).default('Draft').notNull(),
  quoteRef: varchar('quote_ref', { length: 30 }).default('').notNull(),
  quoteId: int('quote_id', { unsigned: true }),
  calloutRef: varchar('callout_ref', { length: 20 }).default('').notNull(),
  calloutId: int('callout_id', { unsigned: true }),
  po: varchar('po', { length: 50 }).default('').notNull(),
  invoiceDate: date('invoice_date').notNull(),
  paidDate: date('paid_date'),
  sentAt: datetime('sent_at'),
  sentByUserId: int('sent_by_user_id', { unsigned: true }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex('uq_ref_id').on(t.refId),
  index('idx_inv_client_id').on(t.clientId),
  index('idx_inv_status').on(t.status),
  index('idx_inv_due').on(t.dueDate),
  index('idx_inv_callout').on(t.calloutRef),
  index('idx_inv_quote').on(t.quoteRef),
])

export const bfPayments = mysqlTable('bf_payments', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  paymentRef: varchar('payment_ref', { length: 30 }).default('').notNull(),
  invoiceRef: varchar('invoice_ref', { length: 30 }).notNull(),
  invoiceId: int('invoice_id', { unsigned: true }),
  clientId: int('client_id', { unsigned: true }),
  clientName: varchar('client_name', { length: 150 }).default('').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentDate: date('payment_date').notNull(),
  notes: varchar('notes', { length: 255 }).default('').notNull(),
  loggedByUserId: int('logged_by_user_id', { unsigned: true }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('idx_pay_invoice').on(t.invoiceRef),
  index('idx_pay_client').on(t.clientId),
])

// ─────────────────────────────────────────────────────────────────────────────
// Finance — transactions, statements, remittances
// ─────────────────────────────────────────────────────────────────────────────

export const bfTransactions = mysqlTable('bf_transactions', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  transDate: date('trans_date').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).default('General').notNull(),
  reference: varchar('reference', { length: 50 }).default('').notNull(),
  credit: decimal('credit', { precision: 12, scale: 2 }).default('0.00').notNull(),
  debit: decimal('debit', { precision: 12, scale: 2 }).default('0.00').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('idx_tx_date').on(t.transDate),
  index('idx_tx_category').on(t.category),
])

export const bfStatements = mysqlTable('bf_statements', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  refId: varchar('ref_id', { length: 20 }).notNull(),
  scheduledFor: date('scheduled_for').notNull(),
  status: mysqlEnum('status', ['pending_approval', 'released', 'cancelled']).default('pending_approval').notNull(),
  fromEmail: varchar('from_email', { length: 150 }).default('').notNull(),
  toEmails: text('to_emails').notNull(),
  invoiceRefs: text('invoice_refs').notNull(),
  totalOutstanding: decimal('total_outstanding', { precision: 12, scale: 2 }).default('0.00').notNull(),
  releasedByUserId: int('released_by_user_id', { unsigned: true }),
  releasedAt: datetime('released_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  uniqueIndex('uq_ref_id').on(t.refId),
  index('idx_stmt_status').on(t.status),
])

export const bfRemittances = mysqlTable('bf_remittances', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  controlNo: varchar('control_no', { length: 20 }).default('').notNull(),
  chequeNo: varchar('cheque_no', { length: 20 }).default('').notNull(),
  remittanceDate: date('remittance_date').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  bankConfirmed: tinyint('bank_confirmed').default(0).notNull(),
  bankDate: date('bank_date'),
  invoicesCovered: text('invoices_covered').notNull(),
  notes: varchar('notes', { length: 500 }).default('').notNull(),
  status: mysqlEnum('status', ['Bank Confirmed', 'Remittance Only', 'Pending']).default('Pending').notNull(),
  clientId: int('client_id', { unsigned: true }),
  createdAt: datetime('created_at').notNull(),
}, (t) => [
  index('idx_bank_confirmed').on(t.bankConfirmed),
  index('idx_remittance_date').on(t.remittanceDate),
])

// ─────────────────────────────────────────────────────────────────────────────
// Tasks + Tracker updates
// ─────────────────────────────────────────────────────────────────────────────

export const bfTasks = mysqlTable('bf_tasks', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  refId: varchar('ref_id', { length: 20 }).notNull(),
  category: mysqlEnum('category', ['admin', 'sales', 'general']).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['Open', 'In Progress', 'Done', 'Cancelled']).default('Open').notNull(),
  priority: mysqlEnum('priority', ['Low', 'Normal', 'High', 'Urgent']).default('Normal').notNull(),
  assignedToUserId: int('assigned_to_user_id', { unsigned: true }),
  assignedTo: varchar('assigned_to', { length: 100 }),
  createdByUserId: int('created_by_user_id', { unsigned: true }).notNull(),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  sourceCalloutRef: varchar('source_callout_ref', { length: 20 }),
  dueDate: date('due_date'),
  startAt: datetime('start_at'),
  endAt: datetime('end_at'),
  dueAt: datetime('due_at'),
  completedAt: datetime('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex('uq_task_ref').on(t.refId),
  index('idx_task_category').on(t.category),
  index('idx_task_status').on(t.status),
  index('idx_task_assigned').on(t.assignedToUserId),
])

export const bfTaskAssignees = mysqlTable('bf_task_assignees', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  taskRef: varchar('task_ref', { length: 20 }).notNull(),
  userId: int('user_id', { unsigned: true }).notNull(),
  username: varchar('username', { length: 100 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedByUid: int('assigned_by_uid', { unsigned: true }).notNull(),
}, (t) => [
  uniqueIndex('uq_task_user').on(t.taskRef, t.userId),
  index('idx_ta_task_ref').on(t.taskRef),
  index('idx_ta_user_id').on(t.userId),
])

export const bfTaskSequences = mysqlTable('bf_task_sequences', {
  category: varchar('category', { length: 20 }).primaryKey(),
  lastSeq: int('last_seq').default(0).notNull(),
})

export const bfTrackerUpdates = mysqlTable('bf_tracker_updates', {
  id: bigint('id', { unsigned: true, mode: 'number' }).autoincrement().primaryKey(),
  hostCompanyId: int('host_company_id', { unsigned: true }).default(1).notNull(),
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  entityRef: varchar('entity_ref', { length: 50 }).notNull(),
  label: varchar('label', { length: 120 }).notNull(),
  content: text('content').notNull(),
  sourceKind: varchar('source_kind', { length: 40 }),
  createdByUserId: int('created_by_user_id', { unsigned: true }).notNull(),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  updatedByUserId: int('updated_by_user_id', { unsigned: true }),
  updatedBy: varchar('updated_by', { length: 100 }),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
}, (t) => [
  uniqueIndex('uq_tracker_source').on(t.entityType, t.entityRef, t.sourceKind),
  index('idx_tracker_updates_entity').on(t.entityType, t.entityRef, t.createdAt),
])

export const bfTrackerUpdateRevisions = mysqlTable('bf_tracker_update_revisions', {
  id: bigint('id', { unsigned: true, mode: 'number' }).autoincrement().primaryKey(),
  hostCompanyId: int('host_company_id', { unsigned: true }).default(1).notNull(),
  trackerUpdateId: bigint('tracker_update_id', { unsigned: true, mode: 'number' }).notNull(),
  oldLabel: varchar('old_label', { length: 120 }).notNull(),
  oldContent: text('old_content').notNull(),
  newLabel: varchar('new_label', { length: 120 }).notNull(),
  newContent: text('new_content').notNull(),
  editedByUserId: int('edited_by_user_id', { unsigned: true }).notNull(),
  editedBy: varchar('edited_by', { length: 100 }).notNull(),
  editedAt: datetime('edited_at').notNull(),
}, (t) => [
  index('idx_tracker_revision_update').on(t.trackerUpdateId, t.editedAt),
])

// ─────────────────────────────────────────────────────────────────────────────
// Safety files
// ─────────────────────────────────────────────────────────────────────────────

export const bfSafetyFiles = mysqlTable('bf_safety_files', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  refId: varchar('ref_id', { length: 30 }).notNull(),
  contractor: varchar('contractor', { length: 255 }).default('').notNull(),
  contractorRepId: int('contractor_rep_id', { unsigned: true }),
  appointee162Id: int('appointee162_id', { unsigned: true }),
  auditDate: date('audit_date'),
  region: varchar('region', { length: 255 }).default('').notNull(),
  auditTeam: varchar('audit_team', { length: 255 }).default('').notNull(),
  scopeOfWork: text('scope_of_work'),
  manpower: tinyint('manpower', { unsigned: true }).default(0).notNull(),
  supervisors: tinyint('supervisors', { unsigned: true }).default(0).notNull(),
  sheReps: tinyint('she_reps', { unsigned: true }).default(0).notNull(),
  firstAiders: tinyint('first_aiders', { unsigned: true }).default(0).notNull(),
  auditorName: varchar('auditor_name', { length: 255 }).default('').notNull(),
  signOffDate: date('sign_off_date'),
  status: mysqlEnum('status', ['Draft', 'In Progress', 'Submitted', 'Approved']).default('Draft').notNull(),
  isActive: tinyint('is_active').default(1).notNull(),
  score: decimal('score', { precision: 5, scale: 2 }),
  band: mysqlEnum('band', ['RED', 'ORANGE', 'YELLOW', 'GREEN']),
  policyEmailSent: tinyint('policy_email_sent').default(0).notNull(),
  policyEmailDate: date('policy_email_date'),
  policyEmailTo: varchar('policy_email_to', { length: 255 }).default('').notNull(),
  createdById: int('created_by_id', { unsigned: true }),
  updatedById: int('updated_by_id', { unsigned: true }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex('uq_ref_id').on(t.refId),
  index('idx_status').on(t.status),
  index('idx_audit_date').on(t.auditDate),
])

export const bfSafetyItems = mysqlTable('bf_safety_items', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  fileRef: varchar('file_ref', { length: 30 }).notNull(),
  sectionKey: char('section_key', { length: 1 }).notNull(),
  itemNo: tinyint('item_no', { unsigned: true }).notNull(),
  result: mysqlEnum('result', ['N/A', 'Not to Standard', 'To Standard']),
  appointeeId: int('appointee_id', { unsigned: true }),
  comments: text('comments'),
  apStatus: mysqlEnum('ap_status', ['Open', 'In Progress', 'Resolved']).default('Open').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex('uq_item').on(t.fileRef, t.sectionKey, t.itemNo),
  index('idx_file_ref').on(t.fileRef),
])

export const bfSafetyPersonnel = mysqlTable('bf_safety_personnel', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  fileRef: varchar('file_ref', { length: 30 }).notNull(),
  userId: int('user_id', { unsigned: true }),
  company: varchar('company', { length: 255 }).default('').notNull(),
  isActive: tinyint('is_active').default(1).notNull(),
  removedAt: date('removed_at'),
  removedReason: varchar('removed_reason', { length: 500 }).default('').notNull(),
  removedById: int('removed_by_id', { unsigned: true }),
  createdById: int('created_by_id', { unsigned: true }),
  updatedById: int('updated_by_id', { unsigned: true }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index('idx_sp_file_ref').on(t.fileRef),
  index('idx_sp_is_active').on(t.isActive),
])

export const bfSafetyCompliance = mysqlTable('bf_safety_compliance', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  fileRef: varchar('file_ref', { length: 30 }).notNull(),
  personnelId: int('personnel_id', { unsigned: true }),
  complianceType: varchar('compliance_type', { length: 100 }).notNull(),
  category: mysqlEnum('category', ['Induction', 'Certification', 'Submission', 'Permit', 'Policy', 'Other']).default('Other').notNull(),
  scope: mysqlEnum('scope', ['Person', 'Company']).default('Person').notNull(),
  issueDate: date('issue_date'),
  expiryDate: date('expiry_date'),
  renewalMonths: tinyint('renewal_months', { unsigned: true }).default(12).notNull(),
  documentRef: varchar('document_ref', { length: 255 }).default('').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index('idx_sc_file_ref').on(t.fileRef),
  index('idx_sc_personnel_id').on(t.personnelId),
  index('idx_sc_expiry_date').on(t.expiryDate),
])

// ─────────────────────────────────────────────────────────────────────────────
// Attachments + Signatures + Uploads
// ─────────────────────────────────────────────────────────────────────────────

export const bfAttachments = mysqlTable('bf_attachments', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  entityType: varchar('entity_type', { length: 30 }).notNull(),
  entityRef: varchar('entity_ref', { length: 30 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  fileSize: int('file_size', { unsigned: true }).default(0).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).default('').notNull(),
  uploadedById: int('uploaded_by_id', { unsigned: true }),
  createdAt: datetime('created_at').notNull(),
}, (t) => [
  uniqueIndex('uq_stored_name').on(t.storedName),
  index('idx_att_entity').on(t.entityType, t.entityRef),
])

export const bfDigitalSignatures = mysqlTable('bf_digital_signatures', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  entityType: varchar('entity_type', { length: 30 }).notNull(),
  entityRef: varchar('entity_ref', { length: 50 }).notNull(),
  documentLabel: varchar('document_label', { length: 255 }).notNull(),
  signerName: varchar('signer_name', { length: 255 }).notNull(),
  signerEmail: varchar('signer_email', { length: 255 }).notNull(),
  signerRole: varchar('signer_role', { length: 100 }),
  signerCompany: varchar('signer_company', { length: 255 }),
  signatureMethod: mysqlEnum('signature_method', ['email_link', 'digital_certificate']).default('email_link').notNull(),
  token: char('token', { length: 64 }),
  tokenExpiresAt: datetime('token_expires_at'),
  certificateSerial: varchar('certificate_serial', { length: 255 }),
  certificateIssuer: varchar('certificate_issuer', { length: 255 }),
  certificateSubject: varchar('certificate_subject', { length: 500 }),
  signatureImage: mediumtext('signature_image'),
  documentHash: char('document_hash', { length: 64 }),
  signedDocumentRef: varchar('signed_document_ref', { length: 255 }),
  status: mysqlEnum('status', ['Pending', 'Sent', 'Signed', 'Declined', 'Expired']).default('Pending').notNull(),
  sentAt: datetime('sent_at'),
  signedAt: datetime('signed_at'),
  declinedAt: datetime('declined_at'),
  declinedReason: text('declined_reason'),
  signerIp: varchar('signer_ip', { length: 45 }),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index('idx_ds_entity').on(t.entityType, t.entityRef),
  index('idx_ds_signer_email').on(t.signerEmail),
  uniqueIndex('uq_token').on(t.token),
  index('idx_status').on(t.status),
])

export const bfExternalUploadTokens = mysqlTable('bf_external_upload_tokens', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  token: char('token', { length: 64 }).notNull(),
  entityType: varchar('entity_type', { length: 30 }).default('safety_file').notNull(),
  entityRef: varchar('entity_ref', { length: 50 }).notNull(),
  sectionKey: char('section_key', { length: 1 }),
  itemNo: tinyint('item_no'),
  uploadPurpose: varchar('upload_purpose', { length: 255 }).notNull(),
  allowedMimeTypes: varchar('allowed_mime_types', { length: 500 }).default('application/pdf,image/jpeg,image/png'),
  maxFiles: tinyint('max_files').default(5).notNull(),
  filesUploaded: tinyint('files_uploaded').default(0).notNull(),
  uploaderName: varchar('uploader_name', { length: 255 }),
  uploaderEmail: varchar('uploader_email', { length: 255 }),
  uploaderCompany: varchar('uploader_company', { length: 255 }),
  uploaderPhone: varchar('uploader_phone', { length: 50 }),
  status: mysqlEnum('status', ['Active', 'Partially Used', 'Completed', 'Expired', 'Cancelled']).default('Active').notNull(),
  expiresAt: datetime('expires_at').notNull(),
  firstUsedAt: datetime('first_used_at'),
  completedAt: datetime('completed_at'),
  notifyEmail: varchar('notify_email', { length: 255 }),
  lastReminderAt: datetime('last_reminder_at'),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('uq_token').on(t.token),
  index('idx_eut_entity').on(t.entityType, t.entityRef),
  index('idx_status').on(t.status),
  index('idx_expires').on(t.expiresAt),
])

// ─────────────────────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────────────────────

export const bfPolicyAcks = mysqlTable('bf_policy_acks', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  fileRef: varchar('file_ref', { length: 30 }).notNull(),
  policyTitle: varchar('policy_title', { length: 255 }).default('').notNull(),
  policyBody: text('policy_body'),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  sentAt: datetime('sent_at'),
  ackedAt: datetime('acked_at'),
  ackedIp: varchar('acked_ip', { length: 45 }).default('').notNull(),
  status: mysqlEnum('status', ['Pending', 'Sent', 'Acknowledged', 'Declined']).default('Pending').notNull(),
  createdById: int('created_by_id', { unsigned: true }),
  recipientId: int('recipient_id', { unsigned: true }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  token: char('token', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('uq_token').on(t.token),
  index('idx_pa_file_ref').on(t.fileRef),
])

export const bfPortalEnquiries = mysqlTable('bf_portal_enquiries', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).default('').notNull(),
  phone: varchar('phone', { length: 50 }).default('').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  service: varchar('service', { length: 100 }).notNull(),
  message: text('message').notNull(),
  submittedBy: varchar('submitted_by', { length: 100 }).default('').notNull(),
  submittedAt: datetime('submitted_at').notNull(),
  status: mysqlEnum('status', ['New', 'In Progress', 'Closed']).default('New').notNull(),
  notes: text('notes'),
}, (t) => [
  index('idx_pe_status').on(t.status),
])

export const bfMobileRateLimits = mysqlTable('bf_mobile_rate_limits', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).default('').notNull(),
  failCount: tinyint('fail_count').default(0).notNull(),
  lockedUntil: datetime('locked_until'),
  lastAttemptAt: datetime('last_attempt_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('uq_ip_device').on(t.ipAddress, t.deviceId),
  index('idx_locked').on(t.lockedUntil),
])

// ─────────────────────────────────────────────────────────────────────────────
// Newly-discovered tables (SYNC-P0-07 — previously absent from this schema)
// ─────────────────────────────────────────────────────────────────────────────

export const bfErrorLog = mysqlTable('bf_error_log', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  script: varchar('script', { length: 100 }).notNull(),
  step: varchar('step', { length: 200 }).default('').notNull(),
  errorNo: int('error_no').default(0).notNull(),
  errorMsg: varchar('error_msg', { length: 500 }).default('').notNull(),
  loggedAt: datetime('logged_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('idx_el_logged_at').on(t.loggedAt),
])

export const bfPasswordResets = mysqlTable('bf_password_resets', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  userId: int('user_id', { unsigned: true }).notNull(),
  token: varchar('token', { length: 64 }).notNull(),
  expiresAt: datetime('expires_at').notNull(),
  used: tinyint('used').default(0).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('idx_pr_user_id').on(t.userId),
  index('idx_pr_token').on(t.token),
])

export const bfSafetyFileUsers = mysqlTable('bf_safety_file_users', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  fileRef: varchar('file_ref', { length: 30 }).notNull(),
  userId: int('user_id', { unsigned: true }).notNull(),
  addedBy: varchar('added_by', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('idx_sfu_file_ref').on(t.fileRef),
  index('idx_sfu_user_id').on(t.userId),
])

export const bfServiceCategories = mysqlTable('bf_service_categories', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  icon: varchar('icon', { length: 10 }).notNull(),
  count: tinyint('count', { unsigned: true }).default(0).notNull(),
}, (t) => [
  uniqueIndex('uq_sc_name').on(t.name),
])

export const bfServices = mysqlTable('bf_services', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  categoryId: int('category_id', { unsigned: true }).notNull(),
  active: tinyint('active').default(1).notNull(),
}, (t) => [
  uniqueIndex('uq_svc_name').on(t.name),
  index('idx_svc_category').on(t.categoryId),
])

export const bfSessions = mysqlTable('bf_sessions', {
  sessionId: varchar('session_id', { length: 128 }).primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  data: text('data').notNull(),
  lastActive: int('last_active', { unsigned: true }).notNull(),
}, (t) => [
  index('idx_sess_username').on(t.username),
])

export const bfSettings = mysqlTable('bf_settings', {
  hostCompanyId: int('host_company_id').default(1).notNull(),
  settingKey: varchar('setting_key', { length: 100 }).notNull(),
  settingValue: longtext('setting_value'),
  updatedBy: varchar('updated_by', { length: 100 }).default('').notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  primaryKey({ columns: [t.hostCompanyId, t.settingKey] }),
])

export const bfSupplierInvoices = mysqlTable('bf_supplier_invoices', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  refId: varchar('ref_id', { length: 30 }).notNull(),
  supplier: varchar('supplier', { length: 60 }).notNull(),
  supplierRef: varchar('supplier_ref', { length: 30 }).default('').notNull(),
  calloutRef: varchar('callout_ref', { length: 20 }).default('').notNull(),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).default('0.00').notNull(),
  status: mysqlEnum('status', ['outstanding', 'partially_paid', 'paid', 'cancelled', 'estimate']).default('outstanding').notNull(),
  description: varchar('description', { length: 255 }).default('').notNull(),
  notes: text('notes'),
  loggedBy: varchar('logged_by', { length: 50 }).default('').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex('uq_ref_id').on(t.refId),
  index('idx_si_supplier').on(t.supplier),
  index('idx_si_callout_ref').on(t.calloutRef),
  index('idx_si_invoice_date').on(t.invoiceDate),
  index('idx_si_status').on(t.status),
])
