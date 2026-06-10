import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { callouts as calloutsApi } from '@blackfire/api-client'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import type { Callout } from '@blackfire/types'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'CalloutDetail'>

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  )
}

export default function CalloutDetailScreen({ route }: Props) {
  const { token } = useAuth()
  const { id }    = route.params
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
        <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />
      ) : !callout ? (
        <Text style={styles.empty}>Callout not found.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.refId}>{callout.ref_id}</Text>
          <Text style={styles.status}>{callout.status}</Text>

          <View style={styles.divider} />

          <Field label="Client"      value={callout.client_name} />
          <Field label="Service"     value={callout.service} />
          <Field label="Location"    value={callout.location} />
          <Field label="Priority"    value={callout.priority} />
          <Field label="Assigned To" value={callout.assigned_to ?? '—'} />
          <Field label="Date"        value={new Date(callout.callout_date).toLocaleDateString('en-ZA')} />
          <Field label="Created By"  value={callout.created_by} />

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.steelDark,
    padding: spacing.lg,
  },
  refId: {
    fontFamily: fonts.mono,
    fontSize: 18,
    letterSpacing: 2,
    color: colors.flameGold,
    marginBottom: 4,
  },
  status: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ash,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.steelDark,
    marginVertical: spacing.md,
  },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.ash,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.bonePaper,
  },
  notes: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ash,
    lineHeight: 22,
    marginTop: 4,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ash,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})
