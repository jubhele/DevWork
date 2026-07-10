import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { safety } from '@blackfire/api-client'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import type { SafetyFile } from '@blackfire/types'
import { useAuth } from '../context/AuthContext'

function score(file: SafetyFile) {
  return Math.round(file.score_percent || file.score || 0)
}

function statusTone(value: SafetyFile['status']) {
  if (value === 'Approved') return colors.success
  if (value === 'Submitted') return colors.warning
  if (value === 'In Progress') return colors.info
  return colors.ash
}

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <View style={[styles.summaryCard, accent && styles.summaryCardAccent]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  )
}

export default function SafetyScreen() {
  const { token } = useAuth()
  const [files, setFiles] = useState<SafetyFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await safety.list({ filter: 'all' }, token ?? undefined)
      if (res.success && res.data) setFiles(res.data)
      else setError('No safety files returned.')
    } catch {
      setError('Could not load safety files.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const scored = files.map(score).filter(value => Number.isFinite(value))
  const average = scored.length ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length) : null
  const approved = files.filter(file => file.status === 'Approved').length
  const review = files.filter(file => file.status === 'Submitted').length
  const risk = files.filter(file => score(file) < 75).length
  const recentFiles = [...files].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 8)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Safety & Compliance</Text>
        <Text style={styles.heading}>Compliance status first</Text>
        <Text style={styles.sub}>Safety file health, regional status, and recent records for field review.</Text>
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

      {!loading && !error && (
        <>
          <Text style={styles.section}>Status</Text>
          <View style={styles.grid}>
            <SummaryCard label="Compliance Score" value={average == null ? 'N/A' : `${average}%`} accent={average != null && average < 75} />
            <SummaryCard label="Approved Files" value={approved} />
            <SummaryCard label="Under Review" value={review} accent={review > 0} />
            <SummaryCard label="Risk Signals" value={risk} accent={risk > 0} />
          </View>

          <Text style={styles.section}>Recent Files</Text>
          <View style={styles.list}>
            {recentFiles.length ? recentFiles.map((file, index) => (
              <View key={file.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.fileRow}>
                  <View style={styles.fileMain}>
                    <Text style={styles.fileRef}>{file.ref_id}</Text>
                    <Text style={styles.fileClient}>{file.client_name}</Text>
                    <Text style={styles.fileSite}>{file.site}</Text>
                  </View>
                  <View style={styles.fileMeta}>
                    <Text style={[styles.status, { color: statusTone(file.status) }]}>{file.status}</Text>
                    <Text style={styles.fileScore}>{score(file)}%</Text>
                  </View>
                </View>
              </View>
            )) : (
              <Text style={styles.empty}>No safety files found.</Text>
            )}
          </View>
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
  summaryCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.navy,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelDark,
    padding: spacing.md,
  },
  summaryCardAccent: { borderColor: colors.fireOrange },
  summaryValue: { fontFamily: fonts.display, fontSize: 26, color: colors.bonePaper },
  summaryLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  list: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, overflow: 'hidden' },
  fileRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, padding: spacing.md },
  fileMain: { flex: 1, minWidth: 0 },
  fileRef: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 1 },
  fileClient: { fontFamily: fonts.body, fontSize: 14, color: colors.bonePaper, marginTop: 4 },
  fileSite: { fontFamily: fonts.body, fontSize: 12, color: colors.ash, marginTop: 2 },
  fileMeta: { alignItems: 'flex-end', justifyContent: 'center' },
  status: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  fileScore: { fontFamily: fonts.display, fontSize: 22, color: colors.bonePaper, marginTop: 6 },
  divider: { height: 1, backgroundColor: colors.steelDark, marginHorizontal: spacing.md },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, padding: spacing.md, textAlign: 'center' },
  errorBox: { alignItems: 'center', marginTop: spacing.xl },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.ash },
  retryBtn: { marginTop: spacing.md, backgroundColor: colors.fireOrange, borderRadius: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  retryText: { fontFamily: fonts.display, fontSize: 12, letterSpacing: 2, color: colors.coal },
})
