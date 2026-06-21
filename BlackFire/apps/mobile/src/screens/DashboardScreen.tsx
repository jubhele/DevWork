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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.sub}>Live operations overview</Text>

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
          <Text style={styles.section}>Operations</Text>
          <View style={styles.grid}>
            <Card label="Open Tasks" value={kpis.open_tasks} />
            <Card label="Urgent" value={kpis.urgent_tasks} accent />
            <Card label="Due Today" value={kpis.tasks_due_today} />
            <Card label="Open Callouts" value={kpis.open_callouts} />
          </View>

          <Text style={styles.section}>Finance</Text>
          <View style={styles.grid}>
            <Card label="MTD Revenue" value={`R ${Number(kpis.mtd_revenue ?? 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`} />
            <Card label="Overdue Invoices" value={kpis.overdue_invoices} accent={kpis.overdue_invoices > 0} />
            <Card label="Pending Quotes" value={kpis.pending_quotes} />
            <Card label="Active Clients" value={kpis.active_clients} />
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
  heading: { fontFamily: fonts.display, fontSize: 28, letterSpacing: 4, color: colors.flameGold },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.ash, letterSpacing: 2, marginTop: 4, marginBottom: spacing.lg, textTransform: 'uppercase' },
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
  errorBox: { alignItems: 'center', marginTop: spacing.xl },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.ash },
  retryBtn: { marginTop: spacing.md, backgroundColor: colors.fireOrange, borderRadius: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  retryText: { fontFamily: fonts.display, fontSize: 12, letterSpacing: 2, color: colors.coal },
})
