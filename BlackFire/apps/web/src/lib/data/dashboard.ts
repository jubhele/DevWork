import { db, schema } from '@/db/client'
import { and, count, eq, inArray, sql } from 'drizzle-orm'
import type { DashboardKPIs, Task, TaskCategory, TaskStreamCounts } from '@blackfire/types'

const {
  bfTasks, bfCallouts, bfQuotes, bfInvoices, bfClients, bfSafetyFiles,
} = schema

// Task categories visible per role — mirrors task_access.php
const ROLE_CATEGORIES: Record<string, TaskCategory[]> = {
  sysadmin:      ['admin', 'sales', 'general'],
  admin:         ['admin', 'sales', 'general'],
  manager:       ['admin', 'sales', 'general'],
  admin_clerk:   ['admin', 'general'],
  sales:         ['sales', 'general'],
  finance:       ['admin', 'general'],
  safety_officer:['general'],
  call_logger:   ['general'],
  junior_tech:   ['general'],
  senior_tech:   ['general'],
  viewer:        ['general'],
  client:        [],
  client_support:['general'],
}

function taskCategories(role: string): TaskCategory[] {
  return ROLE_CATEGORIES[role] ?? ['general']
}

export interface DashboardData {
  data: DashboardKPIs
  recent_tasks: Pick<Task, 'ref_id' | 'category' | 'title' | 'status' | 'priority' | 'assigned_to' | 'due_date' | 'source_callout_ref' | 'created_at'>[]
  task_streams: TaskStreamCounts
  recent_callouts: { ref_id: string; client_name: string; service: string; status: string; priority: string; callout_date: string | null }[]
  monthly_revenue: { label: string; value: number }[]
}

export async function getDashboardData(userRole: string): Promise<DashboardData> {
  const now = new Date()
  const cats = taskCategories(userRole)

  // ── Task KPIs ──────────────────────────────────────────────────────────────
  let openTasks = 0, urgentTasks = 0, tasksDueToday = 0
  const taskStreams: TaskStreamCounts = { admin: 0, sales: 0, general: 0 }
  let recentTasks: DashboardData['recent_tasks'] = []

  if (cats.length > 0) {
    const today = now.toISOString().slice(0, 10)

    try {
      const taskAgg = await db
        .select({
          openTasks:    sql<number>`SUM(IF(${bfTasks.status} IN ('Open','In Progress'), 1, 0))`,
          urgentTasks:  sql<number>`SUM(IF(${bfTasks.priority} = 'Urgent' AND ${bfTasks.status} IN ('Open','In Progress'), 1, 0))`,
          tasksDueToday: sql<number>`SUM(IF(DATE(${bfTasks.dueAt}) = ${today} AND ${bfTasks.status} IN ('Open','In Progress'), 1, 0))`,
        })
        .from(bfTasks)
        .where(inArray(bfTasks.category, cats))

      openTasks     = Number(taskAgg[0]?.openTasks     ?? 0)
      urgentTasks   = Number(taskAgg[0]?.urgentTasks   ?? 0)
      tasksDueToday = Number(taskAgg[0]?.tasksDueToday ?? 0)

      const streamRows = await db
        .select({ category: bfTasks.category, total: count() })
        .from(bfTasks)
        .where(and(inArray(bfTasks.category, cats), inArray(bfTasks.status, ['Open', 'In Progress'])))
        .groupBy(bfTasks.category)

      for (const row of streamRows) {
        taskStreams[row.category] = row.total
      }

      recentTasks = (await db
        .select({
          refId:           bfTasks.refId,
          category:        bfTasks.category,
          title:           bfTasks.title,
          status:          bfTasks.status,
          priority:        bfTasks.priority,
          assignedTo:      bfTasks.assignedTo,
          dueDate:         bfTasks.dueDate,
          sourceCalloutRef: bfTasks.sourceCalloutRef,
          createdAt:       bfTasks.createdAt,
        })
        .from(bfTasks)
        .where(and(inArray(bfTasks.category, cats), sql`${bfTasks.status} != 'Cancelled'`))
        .orderBy(sql`${bfTasks.createdAt} DESC`)
        .limit(5)).map(r => ({
          ref_id: r.refId,
          category: r.category,
          title: r.title,
          status: r.status,
          priority: r.priority,
          assigned_to: r.assignedTo ?? null,
          due_date: r.dueDate ? (r.dueDate instanceof Date ? r.dueDate.toISOString().slice(0, 10) : String(r.dueDate)) : null,
          source_callout_ref: r.sourceCalloutRef ?? null,
          created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        }))
    } catch (e) {
      console.error('[dashboard] bf_tasks query failed (table may not be migrated yet):', e)
    }
  }

  // ── KPI counts ─────────────────────────────────────────────────────────────
  let openCallouts = 0, pendingQuotes = 0, overdueInvoices = 0, activeClients = 0

  const kpiResults = await Promise.allSettled([
    db.select({ n: count() }).from(bfCallouts).where(inArray(bfCallouts.status, ['Open', 'In Progress'])),
    db.select({ n: count() }).from(bfQuotes).where(inArray(bfQuotes.status, ['Draft', 'Sent', 'Pending Approval'])),
    db.select({ n: count() }).from(bfInvoices).where(eq(bfInvoices.status, 'Overdue')),
    db.select({ n: count() }).from(bfClients).where(eq(bfClients.isActive, 1)),
  ])

  if (kpiResults[0].status === 'fulfilled') openCallouts    = kpiResults[0].value[0]?.n ?? 0
  else console.error('[dashboard] bf_callouts KPI failed:', kpiResults[0].reason)
  if (kpiResults[1].status === 'fulfilled') pendingQuotes   = kpiResults[1].value[0]?.n ?? 0
  else console.error('[dashboard] bf_quotes KPI failed:', kpiResults[1].reason)
  if (kpiResults[2].status === 'fulfilled') overdueInvoices = kpiResults[2].value[0]?.n ?? 0
  else console.error('[dashboard] bf_invoices (overdue) KPI failed:', kpiResults[2].reason)
  if (kpiResults[3].status === 'fulfilled') activeClients   = kpiResults[3].value[0]?.n ?? 0
  else console.error('[dashboard] bf_clients KPI failed:', kpiResults[3].reason)

  // ── Safety score ───────────────────────────────────────────────────────────
  let safetyScore: number | null = null
  try {
    const [ssRow] = await db
      .select({ avg: sql<string | null>`AVG(${bfSafetyFiles.score})` })
      .from(bfSafetyFiles)
      .where(and(eq(bfSafetyFiles.status, 'Approved'), eq(bfSafetyFiles.isActive, 1)))
    safetyScore = ssRow?.avg != null ? Math.round(Number(ssRow.avg) * 10) / 10 : null
  } catch (e) {
    console.error('[dashboard] bf_safety_files query failed:', e)
  }

  // ── MTD revenue ────────────────────────────────────────────────────────────
  const y = now.getFullYear(), m = now.getMonth() + 1
  let mtdRevenue = 0
  try {
    const [mtdRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(${bfInvoices.amount}),0)` })
      .from(bfInvoices)
      .where(
        and(
          eq(bfInvoices.status, 'Paid'),
          sql`YEAR(${bfInvoices.paidDate}) = ${y}`,
          sql`MONTH(${bfInvoices.paidDate}) = ${m}`,
        )
      )
    mtdRevenue = Number(mtdRow?.total ?? 0)
  } catch (e) {
    console.error('[dashboard] MTD revenue query failed:', e)
  }

  // ── Recent callouts ────────────────────────────────────────────────────────
  let recentCallouts: DashboardData['recent_callouts'] = []
  try {
    recentCallouts = (await db
      .select({
        refId: bfCallouts.refId,
        clientName: bfCallouts.clientName,
        service: bfCallouts.service,
        status: bfCallouts.status,
        priority: bfCallouts.priority,
        calloutDate: bfCallouts.calloutDate,
      })
      .from(bfCallouts)
      .orderBy(sql`${bfCallouts.calloutDate} DESC`)
      .limit(5)).map(r => ({
        ref_id: r.refId,
        client_name: r.clientName,
        service: r.service,
        status: r.status,
        priority: r.priority,
        callout_date: r.calloutDate ? (r.calloutDate instanceof Date ? r.calloutDate.toISOString().slice(0, 10) : String(r.calloutDate)) : null,
      }))
  } catch (e) {
    console.error('[dashboard] recent callouts query failed:', e)
  }

  // ── Monthly revenue chart (last 6 months) ──────────────────────────────────
  const monthlyRevenue: { label: string; value: number }[] = []
  try {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const my = d.getFullYear(), mm = d.getMonth() + 1
      const label = d.toLocaleString('en-ZA', { month: 'short' })
      const [row] = await db
        .select({ total: sql<string>`COALESCE(SUM(${bfInvoices.amount}),0)` })
        .from(bfInvoices)
        .where(
          and(
            eq(bfInvoices.status, 'Paid'),
            sql`YEAR(${bfInvoices.paidDate}) = ${my}`,
            sql`MONTH(${bfInvoices.paidDate}) = ${mm}`,
          )
        )
      monthlyRevenue.push({ label, value: Number(row?.total ?? 0) })
    }
  } catch (e) {
    console.error('[dashboard] monthly revenue query failed:', e)
  }

  return {
    data: {
      open_tasks: openTasks,
      urgent_tasks: urgentTasks,
      tasks_due_today: tasksDueToday,
      open_callouts: openCallouts,
      overdue_invoices: overdueInvoices,
      mtd_revenue: mtdRevenue,
      safety_score: safetyScore,
      pending_quotes: pendingQuotes,
      active_clients: activeClients,
    },
    recent_tasks: recentTasks,
    task_streams: taskStreams,
    recent_callouts: recentCallouts,
    monthly_revenue: monthlyRevenue,
  }
}
