import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { statements, statementPdfUrl } from '@blackfire/api-client'
import type { ScheduledStatement } from '@blackfire/types'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { useAuth } from '../context/AuthContext'
import { openAuthenticatedPdf } from '../lib/pdf'

const money = (value: number) => `R ${Number(value ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

export default function StatementsScreen() {
  const { token } = useAuth()
  const [items, setItems] = useState<ScheduledStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ScheduledStatement | null>(null)
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true)
    setError(null)
    try {
      const response = await statements.list({ limit: '100' }, token ?? undefined)
      setItems(response.success ? response.data ?? [] : [])
    } catch { setError('Could not load statements.') }
    finally { setLoading(false); setRefreshing(false) }
  }, [token])
  useEffect(() => { load() }, [load])

  return <View style={styles.container}><FlatList
    data={items}
    keyExtractor={item => String(item.id)}
    contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.fireOrange} />}
    ListHeaderComponent={<View style={styles.header}><Text style={styles.eyebrow}>FINANCE / STATEMENTS</Text><Text style={styles.heading}>Statement Log</Text><Text style={styles.sub}>Scheduler-generated, company-branded PDF statements</Text></View>}
    ListEmptyComponent={!loading ? <Text style={styles.empty}>{error ?? 'No statements found.'}</Text> : null}
    ListFooterComponent={loading ? <ActivityIndicator color={colors.fireOrange} style={styles.loader} /> : null}
    renderItem={({ item }) => <View style={styles.card}>
      <View style={styles.cardHead}><View style={styles.identity}><Text style={styles.ref}>{item.ref_id}</Text><Text style={styles.company}>{item.company_name}</Text></View><Text style={[styles.status, item.status === 'released' ? styles.released : styles.pending]}>{item.status.replace('_', ' ')}</Text></View>
      <View style={styles.details}><View><Text style={styles.label}>DATE</Text><Text style={styles.value}>{item.scheduled_for.slice(0, 10)}</Text></View><View><Text style={styles.label}>INVOICES</Text><Text style={styles.value}>{item.invoice_refs ? item.invoice_refs.split(',').length : 0}</Text></View><View><Text style={styles.label}>OUTSTANDING</Text><Text style={styles.total}>{money(item.total_outstanding)}</Text></View></View>
      <View style={styles.actions}><TouchableOpacity onPress={() => setPreview(item)} style={styles.viewButton}><Text style={styles.viewText}>VIEW</Text></TouchableOpacity><TouchableOpacity onPress={() => openAuthenticatedPdf(statementPdfUrl(item.ref_id), token, `Statement_${item.ref_id}.pdf`, 'Download or save statement PDF')} style={styles.downloadButton}><Text style={styles.downloadText}>DOWNLOAD PDF</Text></TouchableOpacity></View>
    </View>}
  /><Modal visible={preview != null} transparent animationType="fade" onRequestClose={() => setPreview(null)}><View style={styles.modalBackdrop}><View style={styles.modalSheet}><View style={styles.modalHeader}><View><Text style={styles.storeEyebrow}>STATEMENT PREVIEW</Text><Text style={styles.modalRef}>{preview?.ref_id}</Text></View><TouchableOpacity onPress={() => setPreview(null)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></TouchableOpacity></View><ScrollView contentContainerStyle={styles.previewBody}><View style={styles.previewBrand}><Text style={styles.previewCompany}>{preview?.company_name}</Text><Text style={styles.previewTitle}>ACCOUNT STATEMENT</Text></View><View style={styles.previewGrid}><View><Text style={styles.label}>STATEMENT DATE</Text><Text style={styles.value}>{preview?.scheduled_for.slice(0, 10)}</Text></View><View><Text style={styles.label}>STATUS</Text><Text style={styles.value}>{preview?.status.replace('_', ' ')}</Text></View><View><Text style={styles.label}>INVOICES</Text><Text style={styles.value}>{preview?.invoice_refs ? preview.invoice_refs.split(',').length : 0}</Text></View></View><Text style={styles.label}>INVOICE REFERENCES</Text><Text style={styles.previewRefs}>{preview?.invoice_refs || 'None'}</Text><View style={styles.previewTotal}><Text style={styles.previewTotalLabel}>TOTAL OUTSTANDING</Text><Text style={styles.previewTotalValue}>{money(preview?.total_outstanding ?? 0)}</Text></View><TouchableOpacity onPress={() => preview && openAuthenticatedPdf(statementPdfUrl(preview.ref_id), token, `Statement_${preview.ref_id}.pdf`, 'Download or save statement PDF')} style={styles.downloadButton}><Text style={styles.downloadText}>DOWNLOAD PDF</Text></TouchableOpacity></ScrollView></View></View></Modal></View>
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal }, content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { borderLeftWidth: 3, borderLeftColor: colors.fireOrange, backgroundColor: colors.navy, padding: spacing.lg, marginBottom: spacing.sm },
  eyebrow: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 2, color: colors.fireOrange }, heading: { marginTop: spacing.xs, fontFamily: fonts.display, fontSize: 32, color: colors.bonePaper }, sub: { marginTop: spacing.xs, fontFamily: fonts.body, fontSize: 12, color: colors.ash },
  card: { backgroundColor: colors.navy, borderWidth: 1, borderColor: colors.steelDark, borderLeftWidth: 2, borderLeftColor: colors.fireOrange, padding: spacing.md }, cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }, identity: { flex: 1 }, ref: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange }, company: { marginTop: 5, fontFamily: fonts.display, fontSize: 21, color: colors.bonePaper }, status: { overflow: 'hidden', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, fontFamily: fonts.mono, fontSize: 8, textTransform: 'uppercase' }, pending: { color: colors.warning, backgroundColor: colors.coal }, released: { color: colors.success, backgroundColor: colors.coal },
  details: { marginTop: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.steelDark, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.md }, label: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 1, color: colors.ash }, value: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: colors.bonePaper }, total: { marginTop: 4, fontFamily: fonts.display, fontSize: 17, color: colors.flameGold },
  actions: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, viewButton: { minHeight: 44, flexGrow: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.fireOrange, paddingHorizontal: spacing.md }, downloadButton: { minHeight: 44, flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fireOrange, paddingHorizontal: spacing.md }, viewText: { fontFamily: fonts.mono, fontSize: 9, color: colors.fireOrange }, downloadText: { fontFamily: fonts.mono, fontSize: 9, color: colors.coal }, empty: { padding: spacing.xl, textAlign: 'center', fontFamily: fonts.body, color: colors.ash }, loader: { margin: spacing.xl },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.78)' }, modalSheet: { maxHeight: '90%', backgroundColor: '#F4F0E6', borderWidth: 1, borderColor: '#C2A04A' }, modalHeader: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.navy }, storeEyebrow: { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 1.5, color: colors.ash }, modalRef: { marginTop: 4, fontFamily: fonts.display, fontSize: 22, color: colors.bonePaper }, closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.steelDark }, closeText: { fontFamily: fonts.body, fontSize: 28, color: colors.ash }, previewBody: { padding: spacing.md }, previewBrand: { marginHorizontal: -spacing.md, marginTop: -spacing.md, marginBottom: spacing.lg, padding: spacing.lg, backgroundColor: colors.navy, borderBottomWidth: 5, borderBottomColor: '#C2A04A' }, previewCompany: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 2, color: '#C2A04A' }, previewTitle: { marginTop: spacing.sm, fontFamily: fonts.display, fontSize: 27, color: colors.bonePaper }, previewGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.md, paddingBottom: spacing.md, marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: '#DCD3BF' }, previewRefs: { marginTop: 7, fontFamily: fonts.mono, fontSize: 10, lineHeight: 17, color: colors.navy }, previewTotal: { marginVertical: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 2, borderBottomWidth: 2, borderColor: colors.navy, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, previewTotalLabel: { fontFamily: fonts.display, fontSize: 18, color: colors.navy }, previewTotalValue: { fontFamily: fonts.display, fontSize: 23, color: colors.navy },
})
