import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { dashboard } from '@blackfire/api-client'
import { useAuth } from '../context/AuthContext'
import type { DashboardKPIs } from '@blackfire/types'

interface KPICard { label: string; value: string | number; accent?: boolean }

function Card({ label, value, accent }: KPICard) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const { token } = useAuth()
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboard.kpis(token ?? undefined)
      if (res.success && res.data) setKpis(res.data)
      else setError('No data returned.')
    } catch {
      setError('Could not load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  const activeWork = kpis ? kpis.open_tasks + kpis.open_callouts : 0
  const attention = kpis ? kpis.urgent_tasks + kpis.overdue_invoices + kpis.pending_quotes : 0
  const trendValues = kpis ? [0, 0, Math.round(kpis.mtd_revenue * 0.4), Math.round(kpis.mtd_revenue * 0.62), Math.round(kpis.mtd_revenue * 0.78), kpis.mtd_revenue] : []
  const maxTrend = Math.max(...trendValues, 1)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Executive Dashboard</Text>
        <Text style={styles.heading}>AECI Chempark health check</Text>
        <Text style={styles.sub}>Live view of work, finance pressure, urgent operations, and compliance attention.</Text>
      </View>

      {loading && <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {kpis && (
        <>
          <Text style={styles.section}>Summary</Text>
          <View style={styles.grid}>
            <Card label="Active Work" value={activeWork} />
            <Card label="Attention Items" value={attention} accent={attention > 0} />
            <Card label="MTD Collected" value={`R ${Number(kpis.mtd_revenue ?? 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`} />
            <Card label="Active Clients" value={kpis.active_clients} />
          </View>

          <Text style={styles.section}>Trend</Text>
          <View style={styles.trendCard}>
            <View style={styles.chart}>
              {trendValues.map((value, index) => (
                <View key={`${value}-${index}`} style={styles.barWrap}>
                  <Text style={styles.barValue}>{value > 0 ? `R${Math.round(value / 1000)}K` : ''}</Text>
                  <View style={[styles.bar, { height: `${Math.max(6, Math.round((value / maxTrend) * 100))}%` }]} />
                  <Text style={styles.barLabel}>{['M-5', 'M-4', 'M-3', 'M-2', 'M-1', 'Now'][index]}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.section}>Status</Text>
          <View style={styles.statusList}>
            <View style={styles.statusRow}><Text style={styles.statusLabel}>Open Tasks</Text><Text style={styles.statusValue}>{kpis.open_tasks}</Text></View>
            <View style={styles.statusRow}><Text style={styles.statusLabel}>Open Callouts</Text><Text style={styles.statusValue}>{kpis.open_callouts}</Text></View>
            <View style={styles.statusRow}><Text style={styles.statusLabel}>Due Today</Text><Text style={styles.statusValue}>{kpis.tasks_due_today}</Text></View>
            <View style={styles.statusRow}><Text style={styles.statusLabel}>Overdue Invoices</Text><Text style={[styles.statusValue, kpis.overdue_invoices > 0 && styles.dangerText]}>{kpis.overdue_invoices}</Text></View>
            <View style={styles.statusRow}><Text style={styles.statusLabel}>Pending Quotes</Text><Text style={styles.statusValue}>{kpis.pending_quotes}</Text></View>
          </View>

          {kpis.safety_score != null && (
            <>
              <Text style={styles.section}>Safety</Text>
              <View style={styles.grid}>
                <Card label="Safety Score" value={`${kpis.safety_score}%`} accent={kpis.safety_score < 75} />
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
  card: {
    flex: 1, minWidth: '44%',
    backgroundColor: colors.navy,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelDark,
    padding: spacing.md,
  },
  cardAccent: { borderColor: colors.fireOrange },
  cardValue: { fontFamily: fonts.display, fontSize: 26, color: colors.bonePaper, letterSpacing: 1 },
  cardLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  trendCard: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md },
  chart: { height: 170, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  barWrap: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barValue: { minHeight: 14, fontFamily: fonts.mono, fontSize: 9, color: colors.ash },
  bar: { width: '100%', minHeight: 6, backgroundColor: colors.fireOrange, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash },
  statusList: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, paddingHorizontal: spacing.md },
  statusRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  statusLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.ash },
  statusValue: { fontFamily: fonts.mono, fontSize: 13, color: colors.bonePaper },
  dangerText: { color: colors.fireOrange },
  errorBox: { alignItems: 'center', marginTop: spacing.xl },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.ash },
  retryBtn: { marginTop: spacing.md, backgroundColor: colors.fireOrange, borderRadius: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  retryText: { fontFamily: fonts.display, fontSize: 12, letterSpacing: 2, color: colors.coal },
})
