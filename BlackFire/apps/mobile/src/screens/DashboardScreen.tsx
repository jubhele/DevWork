import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { dashboard } from '@blackfire/api-client'
import { useAuth } from '../context/AuthContext'
import type { DashboardResponse } from '@blackfire/types'

const money = (value: number) => `R${Number(value ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const compactMoney = (value: number) => value >= 1_000_000 ? `R${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `R${Math.round(value / 1_000)}K` : `R${Math.round(value)}`

function MetricCard({ label, value, sub, tone = 'default' }: { label: string; value: string | number; sub: string; tone?: 'default' | 'warning' | 'danger' }) {
  return (
    <View style={[styles.card, tone === 'warning' && styles.cardWarning, tone === 'danger' && styles.cardDanger]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, tone === 'warning' && styles.warningText, tone === 'danger' && styles.dangerText]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await dashboard.summary(token ?? undefined)
      if (response.success && response.data) setSummary(response)
      else setError('No data returned.')
    } catch {
      setError('Could not load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const kpis = summary?.data
  const maxInvoice = Math.max(...(summary?.invoice_run_rate.months.map(month => month.amount) ?? [1]), 1)
  const activeUsers = summary?.usage.filter(row => row.current_logins > 0).length ?? 0
  const inactiveUsers = (summary?.usage.length ?? 0) - activeUsers
  const today = new Date(); today.setHours(0, 0, 0, 0)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Executive Dashboard</Text>
        <Text style={styles.heading}>AECI Chempark health check</Text>
        <Text style={styles.sub}>Workload counts, financial amounts, deadline risk, invoice run rate, cash collection and portal adoption.</Text>
      </View>

      {loading && <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />}
      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={load} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View>}

      {kpis && summary && (
        <>
          <Text style={styles.section}>Counts</Text>
          <View style={styles.grid}>
            <MetricCard label="Open Tasks" value={kpis.open_tasks} sub="Admin, sales and general" />
            <MetricCard label="Open Callouts" value={kpis.open_callouts} sub="Operational jobs" />
            <MetricCard label="Pending Quotes" value={kpis.pending_quotes} sub="Draft, sent or approval" />
            <MetricCard label="Active Clients" value={kpis.active_clients} sub="Enabled client accounts" />
          </View>

          <Text style={styles.section}>Amounts</Text>
          <View style={styles.grid}>
            <MetricCard label="Invoiced" value={money(summary.amounts.invoiced)} sub={summary.invoice_run_rate.period_label} />
            <MetricCard label="Outstanding" value={money(summary.amounts.outstanding)} sub="Sent and overdue" />
            <MetricCard label="Net Cash" value={money(summary.amounts.net_cash_movement)} sub="Credits less debits" />
            <MetricCard label="Quote Pipeline" value={money(summary.amounts.quote_pipeline)} sub="Active quote value" />
          </View>

          <Text style={styles.section}>Attention</Text>
          <View style={styles.grid}>
            <MetricCard label="Urgent Tasks" value={kpis.urgent_tasks} sub="Immediate attention" tone={kpis.urgent_tasks > 0 ? 'warning' : 'default'} />
            <MetricCard label="Urgent Callouts" value={kpis.urgent_callouts} sub="Priority dispatch" tone={kpis.urgent_callouts > 0 ? 'warning' : 'default'} />
            <MetricCard label="Due in 7 Days" value={summary.due_soon.length} sub="Prevent overdue work" tone={summary.due_soon.length > 0 ? 'warning' : 'default'} />
            <MetricCard label="Overdue Invoices" value={kpis.overdue_invoices} sub="Past due and unpaid" tone={kpis.overdue_invoices > 0 ? 'danger' : 'default'} />
          </View>

          <Text style={styles.section}>Invoice Run Rate</Text>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View style={styles.panelHeaderText}><Text style={styles.panelTitle}>Invoice value and count</Text><Text style={styles.panelSub}>{summary.invoice_run_rate.period_label}</Text></View><Text style={styles.panelBadge}>Avg {summary.invoice_run_rate.average_count.toFixed(1)} / month</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
              {summary.invoice_run_rate.months.map(month => (
                <View key={month.month} style={styles.barWrap} accessibilityLabel={`${month.label}: ${month.count} invoices, ${money(month.amount)}`}>
                  <View style={styles.barValues}><Text style={styles.barCount}>{month.count} inv</Text><Text style={styles.barAmount}>{compactMoney(month.amount)}</Text></View>
                  <View style={[styles.bar, { height: Math.max(6, Math.round((month.amount / maxInvoice) * 112)) }]} />
                  <Text style={styles.barLabel}>{month.label}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.summaryRows}><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Average monthly value</Text><Text style={styles.summaryValue}>{money(summary.invoice_run_rate.average_amount)}</Text></View><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Period total</Text><Text style={styles.summaryValue}>{money(summary.invoice_run_rate.total_amount)}</Text></View></View>
          </View>

          <Text style={styles.section}>Cash Collected Comparisons</Text>
          <View style={styles.panel}>
            {summary.cash_comparisons.map(item => (
              <View key={item.key} style={styles.comparisonRow}>
                <View><Text style={styles.comparisonLabel}>{item.label}</Text><Text style={styles.comparisonPrior}>Prior year {money(item.previous)}</Text></View>
                <View style={styles.comparisonValueWrap}><Text style={styles.comparisonValue}>{money(item.current)}</Text><Text style={[styles.comparisonChange, (item.change_percent ?? 0) < 0 && styles.dangerText, (item.change_percent ?? 0) > 0 && styles.successText]}>{item.change_percent == null ? 'New' : `${item.change_percent > 0 ? '+' : ''}${item.change_percent}%`}</Text></View>
              </View>
            ))}
          </View>

          <Text style={styles.section}>Approaching Deadlines</Text>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><View style={styles.panelHeaderText}><Text style={styles.panelTitle}>Due within seven days</Text><Text style={styles.panelSub}>Type, owner and remaining time</Text></View><Text style={styles.panelBadge}>{summary.due_soon.length} records</Text></View>
            {summary.due_soon.length ? summary.due_soon.slice(0, 12).map(record => {
              const due = new Date(`${record.due_date}T00:00:00`)
              const days = Math.max(0, Math.round((due.getTime() - today.getTime()) / 86_400_000))
              return <View key={`${record.record_type}-${record.ref_id}`} style={styles.deadlineRow}><View style={styles.deadlineMain}><View style={styles.deadlineMeta}><Text style={styles.typeBadge}>{record.record_type}</Text><Text style={styles.deadlineRef}>{record.ref_id}</Text></View><Text style={styles.deadlineTitle}>{record.record_title}</Text><Text style={styles.deadlineOwner}>{record.assignee}</Text></View><View style={styles.deadlineSide}><Text style={[styles.dueBadge, days <= 2 && styles.dueBadgeHot]}>{days === 0 ? 'Today' : `${days}d`}</Text><Text style={styles.deadlineDate}>{record.due_date}</Text></View></View>
            }) : <Text style={styles.emptyText}>No records are due in the next seven days.</Text>}
          </View>

          {summary.usage.length > 0 && (
            <>
              <Text style={styles.section}>Portal Usage by User</Text>
              <View style={styles.panel}>
                <View style={styles.panelHeader}><View style={styles.panelHeaderText}><Text style={styles.panelTitle}>Last 7 days</Text><Text style={styles.panelSub}>No successful login means inactive</Text></View><View style={styles.usageTotals}><Text style={styles.activeTotal}>{activeUsers} active</Text><Text style={styles.inactiveTotal}>{inactiveUsers} inactive</Text></View></View>
                {summary.usage.map(row => {
                  const inactive = row.current_logins === 0
                  const change = row.current_logins - row.previous_logins
                  return <View key={row.username} style={[styles.usageRow, inactive && styles.usageRowInactive]}><View style={styles.usageIdentity}><Text style={styles.usageName}>{row.name || row.username}</Text><Text style={styles.usageUsername}>{row.username}</Text><Text style={styles.usageLast}>Last login: {row.last_login?.slice(0, 16) || 'Never'}</Text></View><View style={styles.usageNumbers}><Text style={[styles.statusBadge, inactive ? styles.statusInactive : styles.statusActive]}>{inactive ? 'Inactive' : 'Active'}</Text><Text style={styles.usageMetric}>{row.current_logins} login{row.current_logins === 1 ? '' : 's'} · {change > 0 ? '+' : ''}{change}</Text><Text style={styles.usageSupport}>{row.page_views} views · {row.actions} actions</Text></View></View>
                })}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { backgroundColor: colors.navy, borderLeftWidth: 3, borderLeftColor: colors.fireOrange, padding: spacing.lg, marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.xs },
  heading: { fontFamily: fonts.display, fontSize: 28, color: colors.flameGold },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, marginTop: 6, lineHeight: 20 },
  section: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 3, color: colors.ash, textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { flex: 1, minWidth: '46%', minHeight: 118, backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, borderLeftWidth: 2, padding: spacing.md },
  cardWarning: { borderLeftColor: colors.warning },
  cardDanger: { borderLeftColor: colors.danger },
  cardLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash, textTransform: 'uppercase', letterSpacing: 1.3 },
  cardValue: { marginTop: 8, fontFamily: fonts.display, fontSize: 24, color: colors.bonePaper, letterSpacing: 0.5 },
  cardSub: { marginTop: 6, fontFamily: fonts.body, fontSize: 10, lineHeight: 14, color: colors.ash },
  warningText: { color: colors.warning },
  dangerText: { color: colors.danger },
  successText: { color: colors.success },
  panel: { overflow: 'hidden', backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark },
  panelHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  panelHeaderText: { flex: 1 },
  panelTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.bonePaper },
  panelSub: { marginTop: 3, fontFamily: fonts.body, fontSize: 10, color: colors.ash },
  panelBadge: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash, borderWidth: 1, borderColor: colors.steelDark, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  chart: { height: 190, alignItems: 'flex-end', gap: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  barWrap: { width: 58, height: 158, alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  barValues: { minHeight: 28, alignItems: 'center', justifyContent: 'flex-end' },
  barCount: { fontFamily: fonts.mono, fontSize: 8, color: colors.ash },
  barAmount: { fontFamily: fonts.mono, fontSize: 9, color: colors.bonePaper },
  bar: { width: 48, minHeight: 6, backgroundColor: colors.fireOrange, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash, textTransform: 'uppercase' },
  summaryRows: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.steelDark, gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  summaryLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  summaryValue: { fontFamily: fonts.mono, fontSize: 10, color: colors.bonePaper },
  comparisonRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  comparisonLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash, textTransform: 'uppercase', letterSpacing: 1 },
  comparisonPrior: { marginTop: 5, fontFamily: fonts.body, fontSize: 9, color: colors.ash },
  comparisonValueWrap: { alignItems: 'flex-end' },
  comparisonValue: { fontFamily: fonts.display, fontSize: 19, color: colors.bonePaper },
  comparisonChange: { marginTop: 3, fontFamily: fonts.mono, fontSize: 9, color: colors.ash },
  deadlineRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  deadlineMain: { flex: 1, minWidth: 0 },
  deadlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  typeBadge: { fontFamily: fonts.mono, fontSize: 8, color: colors.ash, backgroundColor: colors.coal, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  deadlineRef: { fontFamily: fonts.mono, fontSize: 9, color: colors.fireOrange },
  deadlineTitle: { marginTop: 6, fontFamily: fonts.body, fontSize: 12, color: colors.bonePaper },
  deadlineOwner: { marginTop: 3, fontFamily: fonts.body, fontSize: 10, color: colors.ash },
  deadlineSide: { alignItems: 'flex-end' },
  dueBadge: { overflow: 'hidden', fontFamily: fonts.mono, fontSize: 9, color: colors.warning, backgroundColor: colors.coal, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  dueBadgeHot: { color: colors.danger },
  deadlineDate: { marginTop: 6, fontFamily: fonts.mono, fontSize: 8, color: colors.ash },
  emptyText: { padding: spacing.xl, textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.ash },
  usageTotals: { alignItems: 'flex-end', gap: 4 },
  activeTotal: { fontFamily: fonts.mono, fontSize: 9, color: colors.success },
  inactiveTotal: { fontFamily: fonts.mono, fontSize: 9, color: colors.danger },
  usageRow: { minHeight: 94, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.steelDark, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  usageRowInactive: { borderLeftColor: colors.danger, backgroundColor: colors.coal },
  usageIdentity: { flex: 1, minWidth: 0 },
  usageName: { fontFamily: fonts.body, fontSize: 12, color: colors.bonePaper },
  usageUsername: { marginTop: 2, fontFamily: fonts.mono, fontSize: 8, color: colors.ash },
  usageLast: { marginTop: 6, fontFamily: fonts.body, fontSize: 9, color: colors.ash },
  usageNumbers: { alignItems: 'flex-end' },
  statusBadge: { overflow: 'hidden', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4, fontFamily: fonts.mono, fontSize: 8 },
  statusActive: { color: colors.success, backgroundColor: colors.coal },
  statusInactive: { color: colors.danger, backgroundColor: colors.coal },
  usageMetric: { marginTop: 7, fontFamily: fonts.mono, fontSize: 9, color: colors.bonePaper },
  usageSupport: { marginTop: 3, fontFamily: fonts.body, fontSize: 9, color: colors.ash },
  errorBox: { alignItems: 'center', marginTop: spacing.xl },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.ash },
  retryBtn: { marginTop: spacing.md, backgroundColor: colors.fireOrange, borderRadius: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  retryText: { fontFamily: fonts.display, fontSize: 12, letterSpacing: 2, color: colors.coal },
})
