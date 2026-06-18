import { useEffect, useMemo, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { callouts as calloutsApi } from '@blackfire/api-client'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import type { ThemePalette } from '@blackfire/ui-tokens'
import type { Callout } from '@blackfire/types'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'Callouts'>
type ScreenStyles = ReturnType<typeof createStyles>

const STATUS_BG: Record<string, string> = {
  Open: '#F0782020',
  'In Progress': '#2980B920',
  Completed: '#27AE6020',
  Invoiced: '#7A869920',
  Cancelled: '#E74C3C20',
}

const STATUS_TEXT: Record<string, string> = {
  Open: colors.emberAmber,
  'In Progress': colors.info,
  Completed: colors.success,
  Invoiced: colors.ash,
  Cancelled: colors.danger,
}

function CalloutRow({ item, onPress, palette, styles }: {
  item: Callout
  onPress: () => void
  palette: ThemePalette
  styles: ScreenStyles
}) {
  const priorityColor = item.priority === 'Emergency'
    ? colors.danger
    : item.priority === 'Urgent' ? colors.emberAmber : palette.muted

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowTop}>
        <Text style={styles.refId}>{item.ref_id}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_BG[item.status] ?? palette.accentSoft }]}>
          <Text style={[styles.badgeText, { color: STATUS_TEXT[item.status] ?? palette.muted }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.client}>{item.client_name}</Text>
      <View style={styles.rowBottom}>
        <Text style={styles.service}>{item.service}</Text>
        <Text style={[styles.priority, { color: priorityColor }]}>{item.priority}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function CalloutsScreen({ navigation }: Props) {
  const { token } = useAuth()
  const { palette } = useTheme()
  const styles = useMemo(() => createStyles(palette), [palette])
  const [items, setItems] = useState<Callout[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const res = await calloutsApi.list(undefined, token ?? undefined)
      if (res.success && res.data) setItems(res.data)
    } catch {}
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
        <ActivityIndicator color={palette.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>No callouts found.</Text>}
          renderItem={({ item }) => (
            <CalloutRow
              item={item}
              palette={palette}
              styles={styles}
              onPress={() => navigation.navigate('CalloutDetail', { id: item.id, ref_id: item.ref_id })}
            />
          )}
        />
      )}
    </View>
  )
}

const createStyles = (palette: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvas },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: {
    minHeight: 92,
    backgroundColor: palette.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  refId: { fontFamily: fonts.mono, fontSize: 12, color: palette.accent, letterSpacing: 1 },
  badge: { borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5 },
  client: { fontFamily: fonts.body, fontSize: 15, color: palette.text, marginBottom: 6 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  service: { fontFamily: fonts.body, fontSize: 13, color: palette.muted },
  priority: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600' },
  empty: { fontFamily: fonts.body, fontSize: 14, color: palette.muted, textAlign: 'center', marginTop: spacing.xl },
})
