import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { invoices, transactions } from '@blackfire/api-client'
import { useAuth } from '../context/AuthContext'
import type { Invoice } from '@blackfire/types'

const STATUS_COLOR: Record<string, string> = {
  'Draft': colors.ash,
  'Sent': colors.info,
  'Paid': colors.success,
  'Overdue': colors.danger,
  'Cancelled': colors.ash,
}

function money(value: number) {
  return `R ${Number(value ?? 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function fullMoney(value: number) {
  return `R ${Number(value ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
}

function monthKey(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function isCurrentMonth(value?: string | null) {
  const now = new Date()
  return monthKey(value) === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

type LedgerTransaction = {
  id: number
  transDate?: string
  trans_date?: string
  description: string
  category: string
  reference?: string
  credit: string | number
  debit: string | number
}

function txDate(item: LedgerTransaction) {
  return item.transDate ?? item.trans_date ?? ''
}

function InvoiceItem({ item }: { item: Invoice }) {
  return (
    <View style={[styles.item, item.status === 'Overdue' && styles.itemOverdue]}>
      <View style={styles.itemHeader}>
        <Text style={styles.ref} numberOfLines={1}>{item.invoice_number}</Text>
        <Text style={[styles.badge, { color: STATUS_COLOR[item.status] ?? colors.ash }]}>{item.status}</Text>
      </View>
      <Text style={styles.client} numberOfLines={2}>{item.client_name}</Text>
      <View style={styles.footer}>
        <Text style={styles.total}>{fullMoney(item.total ?? item.amount ?? 0)}</Text>
        <Text style={styles.meta}>Due {item.due_date ? new Date(item.due_date).toLocaleDateString('en-ZA') : 'N/A'}</Text>
      </View>
    </View>
  )
}

function LedgerItem({ item }: { item: LedgerTransaction }) {
  const credit = Number(item.credit ?? 0)
  const debit = Number(item.debit ?? 0)
  return (
    <View style={styles.ledgerItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.ref} numberOfLines={1}>{item.reference || `TX-${item.id}`}</Text>
        <Text style={[styles.badge, { color: credit >= debit ? colors.success : colors.warning }]}>{credit >= debit ? 'Credit' : 'Debit'}</Text>
      </View>
      <Text style={styles.client} numberOfLines={2}>{item.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{item.category} · {txDate(item) ? new Date(txDate(item)).toLocaleDateString('en-ZA') : 'No date'}</Text>
      </View>
      <View style={styles.ledgerAmounts}>
        <Text style={styles.ledgerCredit}>CR {credit > 0 ? fullMoney(credit) : '-'}</Text>
        <Text style={styles.ledgerDebit}>DR {debit > 0 ? fullMoney(debit) : '-'}</Text>
      </View>
    </View>
  )
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.metricCard, accent && styles.metricCardAccent]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.metricValueAccent]} numberOfLines={1}>{value}</Text>
    </View>
  )
}

export default function InvoicesScreen() {
  const { token } = useAuth()
  const [items, setItems] = useState<Invoice[]>([])
  const [ledgerItems, setLedgerItems] = useState<LedgerTransaction[]>([])
  const [ledgerTotals, setLedgerTotals] = useState({ total_credit: 0, total_debit: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'All' | 'Overdue' | 'Outstanding'>('All')

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const [res, txRes] = await Promise.all([
        invoices.list({ limit: '100' }, token ?? undefined),
        transactions.list({ limit: '25' }, token ?? undefined),
      ])
      setItems(res.success ? (res.data ?? []) : [])
      setLedgerItems(txRes.success ? ((txRes.data ?? []) as LedgerTransaction[]) : [])
      setLedgerTotals(txRes.success ? (txRes.totals ?? { total_credit: 0, total_debit: 0 }) : { total_credit: 0, total_debit: 0 })
      if (!res.success || !txRes.success) setError('Failed to load all finance data.')
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const finance = useMemo(() => {
    const mtdInvoiced = items
      .filter(item => isCurrentMonth(item.created_at))
      .reduce((sum, item) => sum + Number(item.total ?? item.amount ?? 0), 0)
    const mtdCollected = items
      .filter(item => item.status === 'Paid' && isCurrentMonth(item.paid_date))
      .reduce((sum, item) => sum + Number(item.total ?? item.amount ?? 0), 0)
    const outstanding = items
      .filter(item => ['Draft', 'Sent', 'Overdue'].includes(item.status))
      .reduce((sum, item) => sum + Number(item.total ?? item.amount ?? 0), 0)
    const overdue = items.filter(item => item.status === 'Overdue')
    const overdueAmount = overdue.reduce((sum, item) => sum + Number(item.total ?? item.amount ?? 0), 0)

    const byClient = Array.from(items.reduce((map, item) => {
      const key = item.client_name || 'Unassigned'
      const amount = Number(item.total ?? item.amount ?? 0)
      const current = map.get(key) ?? { client: key, amount: 0, count: 0 }
      current.amount += amount
      current.count += 1
      map.set(key, current)
      return map
    }, new Map<string, { client: string; amount: number; count: number }>()).values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)

    const byStatus = ['Paid', 'Sent', 'Overdue', 'Draft']
      .map(status => ({
        status,
        count: items.filter(item => item.status === status).length,
        amount: items
          .filter(item => item.status === status)
          .reduce((sum, item) => sum + Number(item.total ?? item.amount ?? 0), 0),
      }))
      .filter(row => row.count > 0)

    const totalCredits = Number(ledgerTotals.total_credit ?? 0)
    const totalDebits = Number(ledgerTotals.total_debit ?? 0)
    const paymentsReceived = ledgerItems
      .filter(item => (item.category === 'Invoice Payment') || Number(item.credit ?? 0) > 0)
      .reduce((sum, item) => sum + Number(item.credit ?? 0), 0)

    const ledgerByCategory = Array.from(ledgerItems.reduce((map, item) => {
      const key = item.category || 'Uncategorised'
      const current = map.get(key) ?? { category: key, credits: 0, debits: 0, count: 0 }
      current.credits += Number(item.credit ?? 0)
      current.debits += Number(item.debit ?? 0)
      current.count += 1
      map.set(key, current)
      return map
    }, new Map<string, { category: string; credits: number; debits: number; count: number }>()).values())
      .sort((a, b) => Math.max(b.credits, b.debits) - Math.max(a.credits, a.debits))
      .slice(0, 4)

    return {
      mtdInvoiced,
      mtdCollected,
      outstanding,
      overdueCount: overdue.length,
      overdueAmount,
      byClient,
      byStatus,
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits,
      paymentsReceived,
      ledgerByCategory,
    }
  }, [items, ledgerItems, ledgerTotals])

  const filteredItems = useMemo(() => {
    if (filter === 'Overdue') return items.filter(item => item.status === 'Overdue')
    if (filter === 'Outstanding') return items.filter(item => ['Draft', 'Sent', 'Overdue'].includes(item.status))
    return items
  }, [filter, items])

  const header = (
    <View>
      <View style={styles.header}>
        <Text style={styles.heading}>Finance</Text>
        <Text style={styles.sub}>Revenue, invoices and payments</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.metricsGrid}>
          <MetricCard label="MTD invoiced" value={money(finance.mtdInvoiced)} />
          <MetricCard label="MTD collected" value={money(finance.mtdCollected)} />
          <MetricCard label="Outstanding" value={money(finance.outstanding)} />
          <MetricCard label="Overdue" value={`${finance.overdueCount} / ${money(finance.overdueAmount)}`} accent={finance.overdueCount > 0} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ledger Summary</Text>
          <View style={styles.metricsGridTight}>
            <MetricCard label="Net balance" value={money(finance.netBalance)} accent={finance.netBalance < 0} />
            <MetricCard label="Credits" value={money(finance.totalCredits)} />
            <MetricCard label="Debits" value={money(finance.totalDebits)} />
            <MetricCard label="Payments" value={money(finance.paymentsReceived)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ledger Categories</Text>
          {finance.ledgerByCategory.length === 0 ? <Text style={styles.emptySmall}>No ledger transactions yet.</Text> : finance.ledgerByCategory.map(row => (
            <View key={row.category} style={styles.groupRow}>
              <View style={styles.groupText}>
                <Text style={styles.groupName} numberOfLines={1}>{row.category}</Text>
                <Text style={styles.groupMeta}>{row.count} transactions · CR {money(row.credits)} · DR {money(row.debits)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Feed</Text>
          {ledgerItems.length === 0 ? <Text style={styles.emptySmall}>No transactions found.</Text> : ledgerItems.slice(0, 8).map(item => (
            <LedgerItem key={String(item.id)} item={item} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Breakdown</Text>
          {finance.byClient.length === 0 ? <Text style={styles.emptySmall}>No client finance data yet.</Text> : finance.byClient.map(client => (
            <View key={client.client} style={styles.groupRow}>
              <View style={styles.groupText}>
                <Text style={styles.groupName} numberOfLines={1}>{client.client}</Text>
                <Text style={styles.groupMeta}>{client.count} invoices</Text>
              </View>
              <Text style={styles.groupAmount}>{money(client.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Aging</Text>
          {finance.byStatus.length === 0 ? <Text style={styles.emptySmall}>No invoice status data yet.</Text> : finance.byStatus.map(row => (
            <View key={row.status} style={styles.groupRow}>
              <View style={styles.groupText}>
                <Text style={[styles.groupName, { color: STATUS_COLOR[row.status] ?? colors.bonePaper }]}>{row.status}</Text>
                <Text style={styles.groupMeta}>{row.count} invoices</Text>
              </View>
              <Text style={styles.groupAmount}>{money(row.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.filters}>
          {(['All', 'Outstanding', 'Overdue'] as const).map(label => (
            <TouchableOpacity key={label} onPress={() => setFilter(label)} style={[styles.filterButton, filter === label && styles.filterButtonActive]}>
              <Text style={[styles.filterText, filter === label && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={filteredItems}
        keyExtractor={inv => String(inv.id)}
        renderItem={({ item }) => <InvoiceItem item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.fireOrange} />}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        ListHeaderComponent={header}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No invoices found.</Text> : null}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  header: { marginHorizontal: -spacing.md, marginTop: -spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.navy, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  heading: { fontFamily: fonts.display, fontSize: 28, color: colors.flameGold },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
  summary: { gap: spacing.md, marginBottom: spacing.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  metricCard: { width: '48%', minHeight: 86, backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md },
  metricCardAccent: { borderColor: colors.danger },
  metricLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash, letterSpacing: 1.4, textTransform: 'uppercase' },
  metricValue: { marginTop: spacing.sm, fontFamily: fonts.display, fontSize: 24, color: colors.bonePaper },
  metricValueAccent: { color: colors.danger },
  section: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md },
  sectionTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.bonePaper, marginBottom: spacing.sm },
  metricsGridTight: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  groupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.steelDark },
  groupText: { flex: 1, minWidth: 0 },
  groupName: { fontFamily: fonts.body, fontSize: 14, fontWeight: '600', color: colors.bonePaper },
  groupMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 2 },
  groupAmount: { fontFamily: fonts.mono, fontSize: 12, color: colors.flameGold },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  filterButton: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, paddingVertical: spacing.sm, alignItems: 'center' },
  filterButtonActive: { borderColor: colors.fireOrange, backgroundColor: colors.fireOrange },
  filterText: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, textTransform: 'uppercase' },
  filterTextActive: { color: colors.bonePaper },
  item: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md },
  ledgerItem: { backgroundColor: colors.coal, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md, marginTop: spacing.sm },
  itemOverdue: { borderColor: colors.danger },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  ref: { flex: 1, fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 1 },
  badge: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  client: { fontFamily: fonts.body, fontSize: 15, fontWeight: '600', color: colors.bonePaper },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.sm },
  total: { fontFamily: fonts.display, fontSize: 16, color: colors.flameGold },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  ledgerAmounts: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.steelDark },
  ledgerCredit: { fontFamily: fonts.mono, fontSize: 11, color: colors.success },
  ledgerDebit: { fontFamily: fonts.mono, fontSize: 11, color: colors.warning },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, textAlign: 'center', marginTop: spacing.xl },
  emptySmall: { fontFamily: fonts.body, fontSize: 12, color: colors.ash },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.danger, textAlign: 'center', margin: spacing.lg },
})
