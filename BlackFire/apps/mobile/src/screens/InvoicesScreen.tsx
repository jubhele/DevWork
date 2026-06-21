import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { invoices } from '@blackfire/api-client'
import { useAuth } from '../context/AuthContext'
import type { Invoice } from '@blackfire/types'

const STATUS_COLOR: Record<string, string> = {
  'Draft': colors.ash,
  'Sent': colors.info,
  'Paid': colors.success,
  'Overdue': colors.danger,
  'Cancelled': colors.ash,
}

function InvoiceItem({ item }: { item: Invoice }) {
  return (
    <View style={[styles.item, item.status === 'Overdue' && styles.itemOverdue]}>
      <View style={styles.itemHeader}>
        <Text style={styles.ref}>{item.invoice_number}</Text>
        <Text style={[styles.badge, { color: STATUS_COLOR[item.status] ?? colors.ash }]}>{item.status}</Text>
      </View>
      <Text style={styles.client}>{item.client_name}</Text>
      <View style={styles.footer}>
        <Text style={styles.total}>R {Number(item.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.meta}>Due: {item.due_date ? new Date(item.due_date).toLocaleDateString('en-ZA') : '—'}</Text>
      </View>
    </View>
  )
}

export default function InvoicesScreen() {
  const { token } = useAuth()
  const [items, setItems] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const res = await invoices.list({ limit: '100' }, token ?? undefined)
      setItems(res.success ? (res.data ?? []) : [])
      if (!res.success) setError('Failed to load invoices.')
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
        <Text style={styles.heading}>Invoices</Text>
        <Text style={styles.sub}>Billing and payments</Text>
      </View>

      {loading && <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={inv => String(inv.id)}
        renderItem={({ item }) => <InvoiceItem item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.fireOrange} />}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No invoices found.</Text> : null}
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
  itemOverdue: { borderColor: colors.danger },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ref: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 1 },
  badge: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  client: { fontFamily: fonts.body, fontSize: 15, fontWeight: '600', color: colors.bonePaper },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  total: { fontFamily: fonts.display, fontSize: 16, color: colors.flameGold },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, textAlign: 'center', marginTop: spacing.xl },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.danger, textAlign: 'center', margin: spacing.lg },
})
