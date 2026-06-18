import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { callouts as calloutsApi } from '@blackfire/api-client'
import { fonts, spacing } from '@blackfire/ui-tokens'
import type { ThemePalette } from '@blackfire/ui-tokens'
import type { Callout } from '@blackfire/types'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'CalloutDetail'>
type ScreenStyles = ReturnType<typeof createStyles>

function Field({ label, value, styles }: { label: string; value: string; styles: ScreenStyles }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  )
}

export default function CalloutDetailScreen({ route }: Props) {
  const { token } = useAuth()
  const { palette } = useTheme()
  const styles = useMemo(() => createStyles(palette), [palette])
  const { id } = route.params
  const [callout, setCallout] = useState<Callout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calloutsApi.get(id, token ?? undefined)
      .then(res => { if (res.success && res.data) setCallout(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <ActivityIndicator color={palette.accent} style={{ marginTop: spacing.xl }} />
      ) : !callout ? (
        <Text style={styles.empty}>Callout not found.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.refId}>{callout.ref_id}</Text>
          <Text style={styles.status}>{callout.status}</Text>

          <View style={styles.divider} />

          <Field styles={styles} label="Client" value={callout.client_name} />
          <Field styles={styles} label="Service" value={callout.service} />
          <Field styles={styles} label="Location" value={callout.location} />
          <Field styles={styles} label="Priority" value={callout.priority} />
          <Field styles={styles} label="Assigned To" value={callout.assigned_to ?? '—'} />
          <Field styles={styles} label="Date" value={new Date(callout.callout_date).toLocaleDateString('en-ZA')} />
          <Field styles={styles} label="Created By" value={callout.created_by} />

          {callout.notes && (
            <>
              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>NOTES</Text>
              <Text style={styles.notes}>{callout.notes}</Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  )
}

const createStyles = (palette: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
  },
  refId: { fontFamily: fonts.mono, fontSize: 18, letterSpacing: 2, color: palette.accent, marginBottom: 4 },
  status: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: spacing.md },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: palette.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  fieldValue: { fontFamily: fonts.body, fontSize: 15, color: palette.text },
  notes: { fontFamily: fonts.body, fontSize: 14, color: palette.textSecondary, lineHeight: 22, marginTop: 4 },
  empty: { fontFamily: fonts.body, fontSize: 14, color: palette.muted, textAlign: 'center', marginTop: spacing.xl },
})
