import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { useAuth } from '../context/AuthContext'
import type { Task, TaskCategory } from '@blackfire/types'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

const STREAMS: { key: TaskCategory; label: string }[] = [
  { key: 'admin', label: 'Admin' },
  { key: 'sales', label: 'Sales' },
  { key: 'general', label: 'General' },
]

const STATUS_COLOR: Record<string, string> = {
  'Open': colors.info,
  'In Progress': colors.warning,
  'Done': colors.success,
  'Cancelled': colors.ash,
}

const PRIORITY_COLOR: Record<string, string> = {
  'Urgent': colors.fireOrange,
  'High': colors.emberAmber,
  'Normal': colors.ash,
  'Low': colors.steelDark,
}

function TaskItem({ task }: { task: Task }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemRef}>{task.ref_id}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Text style={[styles.badge, { color: PRIORITY_COLOR[task.priority] ?? colors.ash }]}>{task.priority}</Text>
          <Text style={[styles.badge, { color: STATUS_COLOR[task.status] ?? colors.ash }]}>{task.status}</Text>
        </View>
      </View>
      <Text style={styles.itemTitle} numberOfLines={2}>{task.title}</Text>
      {task.assignee_name && <Text style={styles.itemMeta}>→ {task.assignee_name}</Text>}
      {task.due_at && <Text style={styles.itemMeta}>Due: {new Date(task.due_at).toLocaleDateString('en-ZA')}</Text>}
    </View>
  )
}

export default function TrackerScreen() {
  const { token } = useAuth()
  const [stream, setStream] = useState<TaskCategory>('admin')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/tasks.php?category=${stream}&limit=100`, {
        credentials: 'include', headers,
      })
      const body = res.ok ? await res.json() : null
      setTasks(body?.success ? (body.data ?? []) : [])
      if (!body?.success) setError('Failed to load tasks.')
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [stream, token])

  useEffect(() => { load() }, [load])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tracker</Text>
        <View style={styles.tabs}>
          {STREAMS.map(s => (
            <TouchableOpacity key={s.key} onPress={() => setStream(s.key)} style={[styles.tab, stream === s.key && styles.tabActive]}>
              <Text style={[styles.tabText, stream === s.key && styles.tabTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={tasks}
        keyExtractor={t => String(t.id)}
        renderItem={({ item }) => <TaskItem task={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.fireOrange} />}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No tasks in this stream.</Text> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.navy, borderBottomWidth: 1, borderBottomColor: colors.steelDark },
  heading: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 4, color: colors.flameGold, marginBottom: spacing.sm },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 4, borderWidth: 1, borderColor: colors.steelDark },
  tabActive: { backgroundColor: colors.fireOrange, borderColor: colors.fireOrange },
  tabText: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 2, textTransform: 'uppercase' },
  tabTextActive: { color: colors.coal },
  item: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemRef: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 1 },
  badge: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  itemTitle: { fontFamily: fonts.body, fontSize: 14, color: colors.bonePaper, lineHeight: 20 },
  itemMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 4 },
  separator: { height: spacing.sm },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, textAlign: 'center', marginTop: spacing.xl },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.danger, textAlign: 'center', margin: spacing.lg },
})
