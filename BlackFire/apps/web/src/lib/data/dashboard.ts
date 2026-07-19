import { db, schema } from '@/db/client'
import { and, count, eq, inArray, sql } from 'drizzle-orm'
import type {
  DashboardCashComparison,
  DashboardData,
  DashboardDueSoonRecord,
  DashboardRunRateMonth,
  DashboardUsageRow,
  TaskCategory,
  TaskStreamCounts,
  User,
} from '@blackfire/types'

const {
  bfAuditLog,
  bfCallouts,
  bfClients,
  bfInvoices,
  bfQuotes,
  bfSafetyFiles,
  bfTasks,
  bfTransactions,
  bfUsers,
} = schema

const ROLE_CATEGORIES: Record<string, TaskCategory[]> = {
  sysadmin: ['admin', 'sales', 'general'],
  admin: ['admin', 'sales', 'general'],
  manager: ['admin', 'sales', 'general'],
  admin_clerk: ['admin', 'general'],
  sales: ['sales', 'general'],
  finance: ['admin', 'general'],
  safety_officer: ['general'],
  call_logger: ['general'],
  junior_tech: ['general'],
  senior_tech: ['general'],
  viewer: ['general'],
  client: [],
  client_support: ['general'],
}

type DashboardUser = Pick<User, 'role' | 'roles' | 'permissions'>

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function displayDate(value: Date | string | null): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString().slice(0, 19).replace('T', ' ') : String(value)
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

function canViewUsage(user: DashboardUser): boolean {
  return user.roles.includes('sysadmin') || user.permissions.some(permission => permission === 'security.users' || permission === 'security.audit')
}

async function collectedBetween(start: string, end: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${bfTransactions.credit}), 0)` })
    .from(bfTransactions)
    .where(and(
      eq(bfTransactions.category, 'Invoice Payment'),
      sql`${bfTransactions.transDate} >= ${start}`,
      sql`${bfTransactions.transDate} <= ${end}`,
    ))
  return Number(row?.total ?? 0)
}

export async function getDashboardData(user: DashboardUser): Promise<DashboardData> {
  const now = new Date()
  const today = dateKey(now)
  const dueEnd = dateKey(addDays(now, 7))
  const cats = ROLE_CATEGORIES[user.role] ?? ['general']
  const taskStreams: TaskStreamCounts = { admin: 0, sales: 0, general: 0 }
  let openTasks = 0
  let urgentTasks = 0
  let tasksDueToday = 0
  let recentTasks: DashboardData['recent_tasks'] = []

  if (cats.length > 0) {
    try {
      const [taskAgg, streamRows, taskRows] = await Promise.all([
        db.select({
          openTasks: sql<number>`SUM(IF(${bfTasks.status} IN ('Open','In Progress'), 1, 0))`,
          urgentTasks: sql<number>`SUM(IF(${bfTasks.priority} = 'Urgent' AND ${bfTasks.status} IN ('Open','In Progress'), 1, 0))`,
          tasksDueToday: sql<number>`SUM(IF(COALESCE(DATE(${bfTasks.dueAt}), ${bfTasks.dueDate}) = ${today} AND ${bfTasks.status} IN ('Open','In Progress'), 1, 0))`,
        }).from(bfTasks).where(inArray(bfTasks.category, cats)),
        db.select({ category: bfTasks.category, total: count() })
          .from(bfTasks)
          .where(and(inArray(bfTasks.category, cats), inArray(bfTasks.status, ['Open', 'In Progress'])))
          .groupBy(bfTasks.category),
        db.select({
          refId: bfTasks.refId,
          category: bfTasks.category,
          title: bfTasks.title,
          status: bfTasks.status,
          priority: bfTasks.priority,
          assignedTo: bfTasks.assignedTo,
          dueDate: bfTasks.dueDate,
          sourceCalloutRef: bfTasks.sourceCalloutRef,
          createdAt: bfTasks.createdAt,
        }).from(bfTasks)
          .where(and(inArray(bfTasks.category, cats), sql`${bfTasks.status} != 'Cancelled'`))
          .orderBy(sql`${bfTasks.createdAt} DESC`)
          .limit(5),
      ])

      openTasks = Number(taskAgg[0]?.openTasks ?? 0)
      urgentTasks = Number(taskAgg[0]?.urgentTasks ?? 0)
      tasksDueToday = Number(taskAgg[0]?.tasksDueToday ?? 0)
      for (const row of streamRows) taskStreams[row.category] = row.total
      recentTasks = taskRows.map(row => ({
        ref_id: row.refId,
        category: row.category,
        title: row.title,
        status: row.status,
        priority: row.priority,
        assigned_to: row.assignedTo ?? null,
        due_date: displayDate(row.dueDate)?.slice(0, 10) ?? null,
        source_callout_ref: row.sourceCalloutRef ?? null,
        created_at: displayDate(row.createdAt) ?? '',
      }))
    } catch (error) {
      console.error('[dashboard] task queries failed:', error)
    }
  }

  const kpiResults = await Promise.allSettled([
    db.select({ n: count() }).from(bfCallouts).where(inArray(bfCallouts.status, ['Open', 'In Progress'])),
    db.select({ n: count() }).from(bfCallouts).where(and(inArray(bfCallouts.status, ['Open', 'In Progress']), inArray(bfCallouts.priority, ['Urgent', 'Emergency']))),
    db.select({ n: count() }).from(bfQuotes).where(inArray(bfQuotes.status, ['Draft', 'Sent', 'Pending Approval'])),
    db.select({ n: count() }).from(bfInvoices).where(and(sql`${bfInvoices.status} NOT IN ('Paid','Cancelled')`, sql`${bfInvoices.dueDate} < ${today}`)),
    db.select({ n: count() }).from(bfClients).where(eq(bfClients.isActive, 1)),
  ])
  const kpi = (index: number) => kpiResults[index].status === 'fulfilled' ? Number(kpiResults[index].value[0]?.n ?? 0) : 0
  const openCallouts = kpi(0)
  const urgentCallouts = kpi(1)
  const pendingQuotes = kpi(2)
  const overdueInvoices = kpi(3)
  const activeClients = kpi(4)

  const fyStartYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1
  const periodStart = `${fyStartYear}-03-01`
  const periodEnd = today
  const periodLabel = `Financial YTD ${fyStartYear}/${String(fyStartYear + 1).slice(-2)}`
  const monthDates: Date[] = []
  for (let cursor = new Date(fyStartYear, 2, 1); cursor <= now; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    monthDates.push(cursor)
  }

  const invoiceRunRate: DashboardRunRateMonth[] = await Promise.all(monthDates.map(async month => {
    const year = month.getFullYear()
    const monthNo = month.getMonth() + 1
    const [row] = await db.select({
      count: count(),
      amount: sql<string>`COALESCE(SUM(${bfInvoices.amount}), 0)`,
    }).from(bfInvoices).where(and(
      sql`${bfInvoices.status} != 'Cancelled'`,
      sql`YEAR(${bfInvoices.invoiceDate}) = ${year}`,
      sql`MONTH(${bfInvoices.invoiceDate}) = ${monthNo}`,
    ))
    return {
      label: month.toLocaleString('en-ZA', { month: 'short' }),
      month: `${year}-${String(monthNo).padStart(2, '0')}`,
      count: Number(row?.count ?? 0),
      amount: Number(row?.amount ?? 0),
    }
  }))
  const invoiced = invoiceRunRate.reduce((sum, month) => sum + month.amount, 0)
  const invoiceCount = invoiceRunRate.reduce((sum, month) => sum + month.count, 0)
  const monthDivisor = Math.max(invoiceRunRate.length, 1)

  const [outstandingRow, movementRow, quotePipelineRow] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${bfInvoices.amount}), 0)` })
      .from(bfInvoices)
      .where(inArray(bfInvoices.status, ['Sent', 'Overdue'])),
    db.select({ total: sql<string>`COALESCE(SUM(${bfTransactions.credit} - ${bfTransactions.debit}), 0)` })
      .from(bfTransactions)
      .where(and(sql`${bfTransactions.transDate} >= ${periodStart}`, sql`${bfTransactions.transDate} <= ${periodEnd}`)),
    db.select({ total: sql<string>`COALESCE(SUM(${bfQuotes.totalAmount}), 0)` })
      .from(bfQuotes)
      .where(and(inArray(bfQuotes.status, ['Draft', 'Sent', 'Pending Approval']), sql`${bfQuotes.quoteDate} >= ${periodStart}`, sql`${bfQuotes.quoteDate} <= ${periodEnd}`)),
  ])

  const monthStart = dateKey(new Date(now.getFullYear(), now.getMonth(), 1))
  const previousMonthStart = dateKey(new Date(now.getFullYear() - 1, now.getMonth(), 1))
  const previousToday = dateKey(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()))
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
  const quarterStart = dateKey(new Date(now.getFullYear(), quarterStartMonth, 1))
  const previousQuarterStart = dateKey(new Date(now.getFullYear() - 1, quarterStartMonth, 1))
  const yearStart = `${now.getFullYear()}-01-01`
  const previousYearStart = `${now.getFullYear() - 1}-01-01`
  const [mtd, previousMtd, qtd, previousQtd, ytd, previousYtd] = await Promise.all([
    collectedBetween(monthStart, today),
    collectedBetween(previousMonthStart, previousToday),
    collectedBetween(quarterStart, today),
    collectedBetween(previousQuarterStart, previousToday),
    collectedBetween(yearStart, today),
    collectedBetween(previousYearStart, previousToday),
  ])
  const cashComparisons: DashboardCashComparison[] = [
    { key: 'mtd', label: 'MTD Collected', current: mtd, previous: previousMtd, change_percent: changePercent(mtd, previousMtd) },
    { key: 'qtd', label: `Q${Math.floor(now.getMonth() / 3) + 1} Collected`, current: qtd, previous: previousQtd, change_percent: changePercent(qtd, previousQtd) },
    { key: 'ytd', label: 'YTD Collected', current: ytd, previous: previousYtd, change_percent: changePercent(ytd, previousYtd) },
  ]

  const dueSoon: DashboardDueSoonRecord[] = []
  if (cats.length > 0) {
    const rows = await db.select({
      refId: bfTasks.refId,
      title: bfTasks.title,
      assignee: bfTasks.assignedTo,
      dueDate: sql<string>`COALESCE(DATE(${bfTasks.dueAt}), ${bfTasks.dueDate})`,
    }).from(bfTasks).where(and(
      inArray(bfTasks.category, cats),
      inArray(bfTasks.status, ['Open', 'In Progress']),
      sql`COALESCE(DATE(${bfTasks.dueAt}), ${bfTasks.dueDate}) BETWEEN ${today} AND ${dueEnd}`,
    ))
    dueSoon.push(...rows.map(row => ({ record_type: 'Task' as const, ref_id: row.refId, record_title: row.title, assignee: row.assignee || 'Unassigned', due_date: String(row.dueDate) })))
  }
  const [dueCallouts, dueInvoices, dueQuotes] = await Promise.all([
    db.select({ refId: bfCallouts.refId, title: bfCallouts.service, assignee: bfCallouts.assignedTo, dueDate: sql<string>`DATE(${bfCallouts.dueAt})` })
      .from(bfCallouts)
      .where(and(inArray(bfCallouts.status, ['Open', 'In Progress']), sql`DATE(${bfCallouts.dueAt}) BETWEEN ${today} AND ${dueEnd}`)),
    db.select({ refId: bfInvoices.refId, title: bfInvoices.clientName, dueDate: bfInvoices.dueDate })
      .from(bfInvoices)
      .where(and(inArray(bfInvoices.status, ['Draft', 'Sent']), sql`${bfInvoices.dueDate} BETWEEN ${today} AND ${dueEnd}`)),
    db.select({ refId: bfQuotes.refId, title: bfQuotes.clientName, assignee: bfQuotes.submittedBy, dueDate: bfQuotes.validUntil })
      .from(bfQuotes)
      .where(and(inArray(bfQuotes.status, ['Draft', 'Sent', 'Pending Approval']), sql`${bfQuotes.validUntil} BETWEEN ${today} AND ${dueEnd}`)),
  ])
  dueSoon.push(
    ...dueCallouts.map(row => ({ record_type: 'Callout' as const, ref_id: row.refId, record_title: row.title, assignee: row.assignee || 'Unassigned', due_date: String(row.dueDate) })),
    ...dueInvoices.map(row => ({ record_type: 'Invoice' as const, ref_id: row.refId, record_title: row.title, assignee: 'Finance team', due_date: displayDate(row.dueDate)?.slice(0, 10) ?? '' })),
    ...dueQuotes.map(row => ({ record_type: 'Quote' as const, ref_id: row.refId, record_title: row.title, assignee: row.assignee || 'Unassigned', due_date: displayDate(row.dueDate)?.slice(0, 10) ?? '' })),
  )
  dueSoon.sort((a, b) => a.due_date.localeCompare(b.due_date) || a.record_type.localeCompare(b.record_type))

  let usage: DashboardUsageRow[] = []
  if (canViewUsage(user)) {
    const rows = await db.select({
      username: bfUsers.username,
      name: bfUsers.name,
      lastLogin: bfUsers.lastLogin,
      lastActivity: sql<Date | string | null>`MAX(CASE WHEN ${bfAuditLog.action} NOT IN ('LOGIN_FAIL','MOBILE_LOGIN_FAIL','RESET_REQUEST') THEN ${bfAuditLog.createdAt} END)`,
      currentLogins: sql<number>`SUM(CASE WHEN ${bfAuditLog.createdAt} >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND ${bfAuditLog.action} IN ('LOGIN','MOBILE_LOGIN') THEN 1 ELSE 0 END)`,
      previousLogins: sql<number>`SUM(CASE WHEN ${bfAuditLog.createdAt} >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND ${bfAuditLog.createdAt} < DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND ${bfAuditLog.action} IN ('LOGIN','MOBILE_LOGIN') THEN 1 ELSE 0 END)`,
      pageViews: sql<number>`SUM(CASE WHEN ${bfAuditLog.createdAt} >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND ${bfAuditLog.action} = 'PAGE_VIEW' THEN 1 ELSE 0 END)`,
      actions: sql<number>`SUM(CASE WHEN ${bfAuditLog.createdAt} >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND ${bfAuditLog.action} NOT IN ('LOGIN','MOBILE_LOGIN','LOGIN_FAIL','MOBILE_LOGIN_FAIL','LOGOUT','PAGE_VIEW') THEN 1 ELSE 0 END)`,
    }).from(bfUsers)
      .leftJoin(bfAuditLog, eq(bfAuditLog.username, bfUsers.username))
      .where(eq(bfUsers.active, 1))
      .groupBy(bfUsers.id, bfUsers.username, bfUsers.name, bfUsers.lastLogin)
      .orderBy(sql`currentLogins DESC, pageViews DESC, actions DESC, ${bfUsers.name} ASC`)
    usage = rows.map(row => ({
      username: row.username,
      name: row.name,
      last_login: displayDate(row.lastLogin),
      last_activity: displayDate(row.lastActivity),
      current_logins: Number(row.currentLogins ?? 0),
      previous_logins: Number(row.previousLogins ?? 0),
      page_views: Number(row.pageViews ?? 0),
      actions: Number(row.actions ?? 0),
    }))
  }

  let safetyScore: number | null = null
  try {
    const [row] = await db.select({ average: sql<string | null>`AVG(${bfSafetyFiles.score})` })
      .from(bfSafetyFiles)
      .where(and(eq(bfSafetyFiles.status, 'Approved'), eq(bfSafetyFiles.isActive, 1)))
    safetyScore = row?.average == null ? null : Math.round(Number(row.average) * 10) / 10
  } catch (error) {
    console.error('[dashboard] safety score query failed:', error)
  }

  let recentCallouts: DashboardData['recent_callouts'] = []
  try {
    const rows = await db.select({
      refId: bfCallouts.refId,
      clientName: bfCallouts.clientName,
      service: bfCallouts.service,
      status: bfCallouts.status,
      priority: bfCallouts.priority,
      calloutDate: bfCallouts.calloutDate,
    }).from(bfCallouts).orderBy(sql`${bfCallouts.calloutDate} DESC`).limit(5)
    recentCallouts = rows.map(row => ({
      ref_id: row.refId,
      client_name: row.clientName,
      service: row.service,
      status: row.status,
      priority: row.priority,
      callout_date: displayDate(row.calloutDate)?.slice(0, 10) ?? null,
    }))
  } catch (error) {
    console.error('[dashboard] recent callouts query failed:', error)
  }

  return {
    data: {
      open_tasks: openTasks,
      urgent_tasks: urgentTasks,
      tasks_due_today: tasksDueToday,
      open_callouts: openCallouts,
      urgent_callouts: urgentCallouts,
      overdue_invoices: overdueInvoices,
      mtd_revenue: mtd,
      safety_score: safetyScore,
      pending_quotes: pendingQuotes,
      active_clients: activeClients,
    },
    amounts: {
      invoiced,
      outstanding: Number(outstandingRow[0]?.total ?? 0),
      net_cash_movement: Number(movementRow[0]?.total ?? 0),
      quote_pipeline: Number(quotePipelineRow[0]?.total ?? 0),
    },
    invoice_run_rate: {
      period_label: periodLabel,
      period_start: periodStart,
      period_end: periodEnd,
      average_count: invoiceCount / monthDivisor,
      average_amount: invoiced / monthDivisor,
      total_count: invoiceCount,
      total_amount: invoiced,
      months: invoiceRunRate,
    },
    cash_comparisons: cashComparisons,
    due_soon: dueSoon,
    usage,
    usage_period_days: 7,
    recent_tasks: recentTasks,
    task_streams: taskStreams,
    recent_callouts: recentCallouts,
    monthly_revenue: invoiceRunRate.map(month => ({ label: month.label, value: month.amount })),
  }
}
