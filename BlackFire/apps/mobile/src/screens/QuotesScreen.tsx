import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  TouchableOpacity, TextInput, useWindowDimensions,
} from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { callouts, quotes, quotePdfUrl } from '@blackfire/api-client'
import { useAuth } from '../context/AuthContext'
import type { Callout, Quote, QuoteStatus } from '@blackfire/types'
import { openAuthenticatedPdf } from '../lib/pdf'

type QuoteFilter = 'All' | 'Action' | 'Sent' | 'Converted'

const STATUS_COLOR: Record<string, string> = {
  Draft: colors.ash,
  Sent: colors.info,
  'Pending Approval': colors.warning,
  Approved: colors.success,
  Converted: colors.success,
  Rejected: colors.danger,
  Expired: colors.ash,
}

function money(value: number) {
  return `R ${Number(value ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function shortMoney(value: number) {
  return `R ${Number(value ?? 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value
  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusPill({ status }: { status: QuoteStatus }) {
  const tone = STATUS_COLOR[status] ?? colors.ash
  return (
    <View style={[styles.statusPill, { borderColor: tone, backgroundColor: `${tone}1A` }]}>
      <Text style={[styles.statusText, { color: tone }]}>{status}</Text>
    </View>
  )
}

function QuoteItem({ item, linkedCallout, wide, token }: { item: Quote; linkedCallout?: Callout; wide: boolean; token: string | null }) {
  const description = item.items?.[0]?.description || item.notes || 'Service quotation'
  const total = Number(item.total ?? 0)

  return (
    <View style={[styles.quoteRow, wide ? styles.quoteRowWide : styles.quoteCard]}>
      <View style={styles.identityColumn}>
        <View style={styles.refLine}>
          <Text style={styles.ref} numberOfLines={1}>{item.quote_number || `QUOTE-${item.id}`}</Text>
          {!wide && <StatusPill status={item.status} />}
        </View>
        <Text style={styles.client} numberOfLines={1}>{item.client_name}</Text>
        <Text style={styles.description} numberOfLines={1}>{description}</Text>
      </View>

      <View style={[styles.calloutColumn, !wide && styles.mobileDetailColumn]}>
        <Text style={styles.columnEyebrow}>CALL LOG</Text>
        <Text style={styles.calloutRef}>{linkedCallout?.ref_id ?? item.callout_ref ?? 'Not linked'}</Text>
        <Text style={styles.calloutService} numberOfLines={2}>{linkedCallout?.service ?? 'Service unavailable'}</Text>
      </View>

      <View style={[styles.valueColumn, !wide && styles.mobileDetailColumn]}>
        <Text style={styles.columnEyebrow}>QUOTE VALUE</Text>
        <Text style={[styles.total, total === 0 && styles.zeroTotal]}>{money(total)}</Text>
        <Text style={styles.itemCount}>{item.items?.length ?? 0} line item{item.items?.length === 1 ? '' : 's'}</Text>
      </View>

      <View style={[styles.dateColumn, !wide && styles.mobileDetailColumn]}>
        <Text style={styles.columnEyebrow}>ISSUED</Text>
        <Text style={styles.dateValue}>{formatDate(item.created_at)}</Text>
        <Text style={styles.validDate}>Valid to {formatDate(item.valid_until)}</Text>
      </View>

      {wide && <View style={styles.statusColumn}><StatusPill status={item.status} /></View>}

      <TouchableOpacity
        onPress={() => openAuthenticatedPdf(quotePdfUrl(item.quote_number || item.id), token, `Quote_${item.quote_number || item.id}.pdf`, 'View or save quote PDF')}
        style={[styles.pdfButton, !wide && styles.pdfButtonMobile]}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel={`Download quote ${item.quote_number} PDF`}
      >
        <Text style={styles.pdfButtonText}>PDF</Text>
        <Text style={styles.pdfArrow}>↓</Text>
      </TouchableOpacity>
    </View>
  )
}

function SummaryMetric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.metricValueAccent]} numberOfLines={1}>{value}</Text>
    </View>
  )
}

export default function QuotesScreen() {
  const { token } = useAuth()
  const { width } = useWindowDimensions()
  const wide = width >= 900
  const [items, setItems] = useState<Quote[]>([])
  const [calloutItems, setCalloutItems] = useState<Callout[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<QuoteFilter>('All')

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const [quoteResponse, calloutResponse] = await Promise.all([
        quotes.list({ limit: '100' }, token ?? undefined),
        callouts.list({ limit: '500' }, token ?? undefined),
      ])
      setItems(quoteResponse.success ? (quoteResponse.data ?? []) : [])
      setCalloutItems(calloutResponse.success ? (calloutResponse.data ?? []) : [])
      if (!quoteResponse.success || !calloutResponse.success) setError('Failed to load quote records.')
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const calloutsById = useMemo(() => new Map(calloutItems.map(item => [item.id, item])), [calloutItems])
  const calloutsByRef = useMemo(() => new Map(calloutItems.map(item => [item.ref_id, item])), [calloutItems])
  const linkedCallout = useCallback((quote: Quote) =>
    (quote.callout_ref ? calloutsByRef.get(quote.callout_ref) : undefined)
      ?? (quote.callout_id ? calloutsById.get(quote.callout_id) : undefined),
  [calloutsById, calloutsByRef])

  const summary = useMemo(() => {
    const quotedValue = items.reduce((sum, item) => sum + Number(item.total ?? 0), 0)
    const actionCount = items.filter(item => ['Draft', 'Pending Approval'].includes(item.status)).length
    const convertedCount = items.filter(item => item.status === 'Converted').length
    return { quotedValue, actionCount, convertedCount }
  }, [items])

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter(item => {
      const callout = linkedCallout(item)
      const matchesQuery = !needle || `${item.quote_number} ${item.client_name} ${item.status} ${callout?.ref_id ?? item.callout_ref ?? ''} ${callout?.service ?? ''}`.toLowerCase().includes(needle)
      const matchesFilter = filter === 'All'
        || (filter === 'Action' && ['Draft', 'Pending Approval'].includes(item.status))
        || item.status === filter
      return matchesQuery && matchesFilter
    })
  }, [filter, items, linkedCallout, query])

  const listHeader = (
    <View>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.eyebrow}>FINANCE / QUOTATIONS</Text>
          <Text style={styles.heading}>Quote Log</Text>
          <Text style={styles.sub}>Track value, validity and conversion status</Text>
        </View>
        <View style={styles.recordCount}>
          <Text style={styles.recordCountValue}>{items.length}</Text>
          <Text style={styles.recordCountLabel}>RECORDS</Text>
        </View>
      </View>

      <View style={styles.summaryStrip}>
        <SummaryMetric label="Total quotes" value={String(items.length)} />
        <SummaryMetric label="Quoted value" value={shortMoney(summary.quotedValue)} />
        <SummaryMetric label="Needs action" value={String(summary.actionCount)} accent={summary.actionCount > 0} />
        <SummaryMetric label="Converted" value={String(summary.convertedCount)} />
      </View>

      <View style={[styles.controls, !wide && styles.controlsStacked]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={[styles.search, wide && styles.searchWide]}
          placeholder="Search quote, client or call log"
          placeholderTextColor={colors.ash}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.filters}>
          {(['All', 'Action', 'Sent', 'Converted'] as const).map(label => (
            <TouchableOpacity
              key={label}
              onPress={() => setFilter(label)}
              style={[styles.filterButton, filter === label && styles.filterButtonActive]}
            >
              <Text style={[styles.filterText, filter === label && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {wide && (
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.identityColumn]}>QUOTE / CLIENT</Text>
          <Text style={[styles.tableHeaderText, styles.calloutColumn]}>CALL LOG / SERVICE</Text>
          <Text style={[styles.tableHeaderText, styles.valueColumn]}>VALUE</Text>
          <Text style={[styles.tableHeaderText, styles.dateColumn]}>DATES</Text>
          <Text style={[styles.tableHeaderText, styles.statusColumn]}>STATUS</Text>
          <Text style={[styles.tableHeaderText, styles.actionColumn]}>FILE</Text>
        </View>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={quote => String(quote.id)}
        renderItem={({ item }) => <QuoteItem item={item} linkedCallout={linkedCallout(item)} wide={wide} token={token} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.fireOrange} />}
        contentContainerStyle={[styles.listContent, wide && styles.listContentWide]}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{query || filter !== 'All' ? 'No quotes match these filters.' : 'No quotes found.'}</Text> : null}
        ListFooterComponent={loading ? <ActivityIndicator color={colors.fireOrange} style={styles.loader} /> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  listContentWide: { width: '100%', maxWidth: 1320, alignSelf: 'center', paddingHorizontal: spacing.xl },
  pageHeader: { minHeight: 116, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, color: colors.fireOrange, marginBottom: spacing.xs },
  heading: { fontFamily: fonts.display, fontSize: 34, color: colors.bonePaper },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, marginTop: spacing.xs },
  recordCount: { alignItems: 'flex-end' },
  recordCountValue: { fontFamily: fonts.display, fontSize: 32, color: colors.flameGold },
  recordCountLabel: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5, color: colors.ash },
  summaryStrip: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.navy, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  metric: { flexGrow: 1, flexBasis: 150, minHeight: 86, justifyContent: 'center', paddingHorizontal: spacing.md, borderRightWidth: 1, borderRightColor: colors.steelDark },
  metricLabel: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.3, color: colors.ash, textTransform: 'uppercase' },
  metricValue: { fontFamily: fonts.display, fontSize: 24, color: colors.bonePaper, marginTop: spacing.xs },
  metricValueAccent: { color: colors.warning },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  controlsStacked: { alignItems: 'stretch', flexDirection: 'column' },
  search: { minHeight: 44, borderWidth: 1, borderColor: colors.steelDark, backgroundColor: colors.navy, color: colors.bonePaper, paddingHorizontal: spacing.md, fontFamily: fonts.body, fontSize: 14 },
  searchWide: { width: 340 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.steelDark, backgroundColor: colors.navy },
  filterButtonActive: { borderColor: colors.fireOrange, backgroundColor: colors.fireOrange },
  filterText: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, textTransform: 'uppercase', letterSpacing: 1 },
  filterTextActive: { color: colors.coal },
  tableHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 38, paddingHorizontal: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.steelDark },
  tableHeaderText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.2, color: colors.ash },
  quoteRow: { backgroundColor: colors.navy, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  quoteRowWide: { minHeight: 104, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  quoteCard: { padding: spacing.md, borderWidth: 1, borderColor: colors.steelDark },
  identityColumn: { flex: 1.8, minWidth: 0 },
  calloutColumn: { flex: 1.2, minWidth: 150 },
  valueColumn: { flex: 0.8, minWidth: 130 },
  dateColumn: { flex: 0.9, minWidth: 160 },
  statusColumn: { flex: 0.72, minWidth: 130, alignItems: 'flex-start' },
  actionColumn: { width: 76, textAlign: 'center' },
  refLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  ref: { flexShrink: 1, fontFamily: fonts.mono, fontSize: 11, color: colors.fireOrange, letterSpacing: 1 },
  client: { fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.bonePaper, marginTop: spacing.xs },
  description: { fontFamily: fonts.body, fontSize: 12, color: colors.ash, marginTop: 2 },
  calloutRef: { fontFamily: fonts.mono, fontSize: 11, color: colors.fireOrange, letterSpacing: 1, marginTop: 3 },
  calloutService: { fontFamily: fonts.body, fontSize: 12, color: colors.bonePaper, marginTop: 3 },
  columnEyebrow: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 1.1, color: colors.ash },
  total: { fontFamily: fonts.display, fontSize: 20, color: colors.flameGold, marginTop: 2 },
  zeroTotal: { color: colors.ash },
  itemCount: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 2 },
  dateValue: { fontFamily: fonts.body, fontSize: 13, color: colors.bonePaper, marginTop: 3 },
  validDate: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 3 },
  mobileDetailColumn: { marginTop: spacing.md },
  statusPill: { minHeight: 28, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.sm, borderWidth: 1, borderRadius: 14 },
  statusText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  pdfButton: { width: 64, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.fireOrange },
  pdfButtonMobile: { width: '100%', marginTop: spacing.md },
  pdfButtonText: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 1 },
  pdfArrow: { fontFamily: fonts.body, fontSize: 16, color: colors.fireOrange },
  separator: { height: 1 },
  loader: { marginVertical: spacing.xl },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, textAlign: 'center', paddingVertical: spacing.xxl },
  errorText: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, padding: spacing.md, backgroundColor: colors.navy, borderWidth: 1, borderColor: colors.danger, fontFamily: fonts.body, fontSize: 13, color: colors.danger, textAlign: 'center' },
})
