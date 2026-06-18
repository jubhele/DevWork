import { useEffect, useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { dashboard } from '@blackfire/api-client'
import { fonts, spacing } from '@blackfire/ui-tokens'
import type { ThemePalette } from '@blackfire/ui-tokens'
import type { DashboardKPIs } from '@blackfire/types'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>
type ScreenStyles = ReturnType<typeof createStyles>

function KPICard({ label, value, styles }: { label: string; value: string | number; styles: ScreenStyles }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{String(value)}</Text>
    </View>
  )
}

export default function DashboardScreen({ navigation }: Props) {
  const { user, token, logout } = useAuth()
  const { palette } = useTheme()
  const styles = useMemo(() => createStyles(palette), [palette])
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const res = await dashboard.kpis(token ?? undefined)
      if (res.success && res.data) setKpis(res.data)
    } catch {}
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DASHBOARD</Text>
          {user && <Text style={styles.welcome}>Welcome, {user.name}</Text>}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.calloutsLink} onPress={() => navigation.navigate('Callouts')}>
        <Text style={styles.calloutsLinkText}>VIEW CALLOUTS</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={palette.accent} style={{ marginTop: spacing.xl }} />
      ) : kpis ? (
        <View style={styles.grid}>
          <KPICard styles={styles} label="Open Callouts" value={kpis.open_callouts} />
          <KPICard styles={styles} label="Overdue Invoices" value={kpis.overdue_invoices} />
          <KPICard styles={styles} label="MTD Revenue" value={`R${kpis.mtd_revenue.toLocaleString()}`} />
          <KPICard styles={styles} label="Safety Score" value={kpis.safety_score != null ? `${kpis.safety_score}%` : '—'} />
          <KPICard styles={styles} label="Pending Quotes" value={kpis.pending_quotes} />
          <KPICard styles={styles} label="Active Clients" value={kpis.active_clients} />
        </View>
      ) : (
        <Text style={styles.empty}>Could not load dashboard data.</Text>
      )}
    </ScrollView>
  )
}

const createStyles = (palette: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 4, color: palette.text },
  welcome: { fontFamily: fonts.body, fontSize: 13, color: palette.muted, marginTop: 2 },
  logoutBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.border,
  },
  logoutText: { fontFamily: fonts.body, fontSize: 12, color: palette.muted },
  calloutsLink: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: palette.accent,
    borderRadius: 3,
  },
  calloutsLinkText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: palette.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: {
    width: '47%',
    backgroundColor: palette.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  kpiLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: palette.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  kpiValue: { fontFamily: fonts.display, fontSize: 26, color: palette.text },
  empty: { fontFamily: fonts.body, fontSize: 14, color: palette.muted, textAlign: 'center', marginTop: spacing.xl },
})
