import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity, Linking,
} from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { quotes, quotePdfUrl } from '@blackfire/api-client'
import { useAuth } from '../context/AuthContext'
import type { Quote } from '@blackfire/types'

const STATUS_COLOR: Record<string, string> = {
  'Draft': colors.ash,
  'Sent': colors.info,
  'Accepted': colors.success,
  'Rejected': colors.danger,
  'Expired': colors.ash,
}

function quotePdfRef(item: Quote) {
  return item.quote_number || item.id
}

function openQuotePdf(item: Quote) {
  Linking.openURL(quotePdfUrl(quotePdfRef(item)))
}

function QuoteItem({ item }: { item: Quote }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.ref}>{item.quote_number}</Text>
        <Text style={[styles.badge, { color: STATUS_COLOR[item.status] ?? colors.ash }]}>{item.status}</Text>
      </View>
      <Text style={styles.client}>{item.client_name}</Text>
      <View style={styles.footer}>
        <Text style={styles.total}>R {Number(item.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.meta}>Valid: {item.valid_until ? new Date(item.valid_until).toLocaleDateString('en-ZA') : '—'}</Text>
      </View>
      <TouchableOpacity onPress={() => openQuotePdf(item)} style={styles.pdfButton}>
        <Text style={styles.pdfButtonText}>Download PDF</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function QuotesScreen() {
  const { token } = useAuth()
  const [items, setItems] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const res = await quotes.list({ limit: '100' }, token ?? undefined)
      setItems(res.success ? (res.data ?? []) : [])
      if (!res.success) setError('Failed to load quotes.')
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
        <Text style={styles.heading}>Quote Log</Text>
        <Text style={styles.sub}>Finance - service quotations</Text>
      </View>

      {loading && <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={q => String(q.id)}
        renderItem={({ item }) => <QuoteItem item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.fireOrange} />}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No quotes found.</Text> : null}
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
  client: { fontFamily: fonts.body, fontSize: 15, fontWeight: '600', color: colors.bonePaper },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  total: { fontFamily: fonts.display, fontSize: 16, color: colors.flameGold },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  pdfButton: { marginTop: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.fireOrange, paddingVertical: spacing.sm, alignItems: 'center' },
  pdfButtonText: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 1.2, textTransform: 'uppercase' },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, textAlign: 'center', marginTop: spacing.xl },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.danger, textAlign: 'center', margin: spacing.lg },
})
