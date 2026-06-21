import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { callouts } from '@blackfire/api-client'
import { useAuth } from '../context/AuthContext'
import type { Callout } from '@blackfire/types'

const STATUS_COLOR: Record<string, string> = {
  'Open': colors.fireOrange,
  'In Progress': colors.warning,
  'Completed': colors.success,
  'Invoiced': colors.info,
  'Cancelled': colors.ash,
}

const PRIORITY_COLOR: Record<string, string> = {
  'Emergency': colors.danger,
  'Urgent': colors.fireOrange,
  'Normal': colors.ash,
}

function CalloutItem({ item }: { item: Callout }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.ref}>{item.ref_id}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Text style={[styles.badge, { color: PRIORITY_COLOR[item.priority] ?? colors.ash }]}>{item.priority}</Text>
          <Text style={[styles.badge, { color: STATUS_COLOR[item.status] ?? colors.ash }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.clientName}>{item.client_name}</Text>
      <Text style={styles.service} numberOfLines={1}>{item.service}</Text>
      <Text style={styles.meta}>{item.location}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{new Date(item.callout_date).toLocaleDateString('en-ZA')}</Text>
        {item.assigned_to && <Text style={styles.meta}>→ {item.assigned_to}</Text>}
      </View>
    </View>
  )
}

export default function CallLogScreen() {
  const { token } = useAuth()
  const [items, setItems] = useState<Callout[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const res = await callouts.list({ limit: '100' }, token ?? undefined)
      setItems(res.success ? (res.data ?? []) : [])
      if (!res.success) setError('Failed to load call log.')
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Call Log</Text>
        <Text style={styles.sub}>Field service callouts</Text>
      </View>

      {loading && <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={c => String(c.id)}
        renderItem={({ item }) => <CalloutItem item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.fireOrange} />}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No callouts found.</Text> : null}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.navy, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  heading: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 4, color: colors.flameGold },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
  item: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ref: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 1 },
  badge: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  clientName: { fontFamily: fonts.body, fontSize: 15, fontWeight: '600', color: colors.bonePaper },
  service: { fontFamily: fonts.body, fontSize: 12, color: colors.ash, marginTop: 2 },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, textAlign: 'center', marginTop: spacing.xl },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.danger, textAlign: 'center', margin: spacing.lg },
})
