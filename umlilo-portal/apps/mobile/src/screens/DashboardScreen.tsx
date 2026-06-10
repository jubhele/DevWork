import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { dashboard } from '@blackfire/api-client'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import type { DashboardKPIs } from '@blackfire/types'
import { useAuth } from '../context/AuthContext'

interface KPICardProps { label: string; value: string | number }

function KPICard({ label, value }: KPICardProps) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{String(value)}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const { user, token, logout } = useAuth()
  const [kpis, setKpis]           = useState<DashboardKPIs | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const res = await dashboard.kpis(token ?? undefined)
      if (res.success && res.data) setKpis(res.data)
    } catch { /* silent */ }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fireOrange} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DASHBOARD</Text>
          {user && <Text style={styles.welcome}>Welcome, {user.name}</Text>}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />
      ) : kpis ? (
        <View style={styles.grid}>
          <KPICard label="Open Callouts"    value={kpis.open_callouts} />
          <KPICard label="Overdue Invoices" value={kpis.overdue_invoices} />
          <KPICard label="MTD Revenue"      value={`R${kpis.mtd_revenue.toLocaleString()}`} />
          <KPICard label="Safety Score"     value={kpis.safety_score != null ? `${kpis.safety_score}%` : '—'} />
          <KPICard label="Pending Quotes"   value={kpis.pending_quotes} />
          <KPICard label="Active Clients"   value={kpis.active_clients} />
        </View>
      ) : (
        <Text style={styles.empty}>Could not load dashboard data.</Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 4,
    color: colors.bonePaper,
  },
  welcome: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ash,
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.steelDark,
  },
  logoutText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ash,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '47%',
    backgroundColor: colors.navy,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.steelDark,
    padding: spacing.md,
  },
  kpiLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.ash,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  kpiValue: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.bonePaper,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ash,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})
