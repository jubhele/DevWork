import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { callouts as calloutsApi } from '@blackfire/api-client'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import type { Callout } from '@blackfire/types'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'Callouts'>

const PRIORITY_COLOR: Record<string, string> = {
  Normal:    colors.ash,
  Urgent:    colors.emberAmber,
  Emergency: colors.danger,
}

const STATUS_BG: Record<string, string> = {
  Open:          '#F0782015',
  'In Progress': '#2980B915',
  Completed:     '#27AE6015',
  Invoiced:      '#7A869915',
  Cancelled:     '#E74C3C15',
}
const STATUS_TEXT: Record<string, string> = {
  Open:          colors.emberAmber,
  'In Progress': colors.info,
  Completed:     colors.success,
  Invoiced:      colors.ash,
  Cancelled:     colors.danger,
}

function CalloutRow({ item, onPress }: { item: Callout; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowTop}>
        <Text style={styles.refId}>{item.ref_id}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_BG[item.status] ?? '#ffffff10' }]}>
          <Text style={[styles.badgeText, { color: STATUS_TEXT[item.status] ?? colors.ash }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.client}>{item.client_name}</Text>
      <View style={styles.rowBottom}>
        <Text style={styles.service}>{item.service}</Text>
        <Text style={[styles.priority, { color: PRIORITY_COLOR[item.priority] ?? colors.ash }]}>
          {item.priority}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function CalloutsScreen({ navigation }: Props) {
  const { token } = useAuth()
  const [items, setItems]       = useState<Callout[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const res = await calloutsApi.list(undefined, token ?? undefined)
      if (res.success && res.data) setItems(res.data)
    } catch { /* silent */ }
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
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fireOrange} />}
          ListEmptyComponent={<Text style={styles.empty}>No callouts found.</Text>}
          renderItem={({ item }) => (
            <CalloutRow
              item={item}
              onPress={() => navigation.navigate('CalloutDetail', { id: item.id, ref_id: item.ref_id })}
            />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: {
    backgroundColor: colors.navy,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelDark,
    padding: spacing.md,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  refId: { fontFamily: fonts.mono, fontSize: 12, color: colors.flameGold, letterSpacing: 1 },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5 },
  client: { fontFamily: fonts.body, fontSize: 15, color: colors.bonePaper, marginBottom: 6 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  service: { fontFamily: fonts.body, fontSize: 13, color: colors.ash },
  priority: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600' },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, textAlign: 'center', marginTop: spacing.xl },
})
