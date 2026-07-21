import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal,
} from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { tasks as taskApi } from '@blackfire/api-client'
import { useAuth } from '../context/AuthContext'
import type { Task, TaskAssignableUser, TaskCategory } from '@blackfire/types'

const STREAMS: { key: TaskCategory; label: string }[] = [
  { key: 'admin', label: 'Admin' },
  { key: 'sales', label: 'Sales' },
  { key: 'general', label: 'General' },
]

const ACTIVE_STATUSES = ['Open', 'In Progress']

const STATUS_COLOR: Record<string, string> = {
  Open: colors.info,
  'In Progress': colors.warning,
  Done: colors.success,
  Cancelled: colors.ash,
}

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: colors.fireOrange,
  High: colors.emberAmber,
  Normal: colors.ash,
  Low: colors.steelDark,
}

const PRIORITY_RANK: Record<string, number> = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  Low: 3,
}

function isActive(task: Task) {
  return ACTIVE_STATUSES.includes(task.status)
}

function dueValue(task: Task) {
  return task.due_at ?? task.due_date ?? null
}

function todayIso() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dueState(task: Task) {
  const value = dueValue(task)
  if (!value || !isActive(task)) return 'No date'
  const day = value.slice(0, 10)
  const today = todayIso()
  if (day < today) return 'Overdue'
  if (day === today) return 'Due today'
  return 'Upcoming'
}

function urgencyRank(task: Task) {
  const due = dueState(task)
  const dueRank = due === 'Overdue' ? 0 : due === 'Due today' ? 1 : due === 'Upcoming' ? 2 : 3
  return dueRank * 10 + (PRIORITY_RANK[task.priority] ?? 4)
}

function assignee(task: Task) {
  return task.assignees?.length
    ? task.assignees.map(item => item.name).join(', ')
    : (task.assignee_name ?? task.assigned_to ?? 'Unassigned')
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) : 'No date'
}

function SummaryCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summarySub}>{sub}</Text>
    </View>
  )
}

function TaskItem({ task, onPress }: { task: Task; onPress?: () => void }) {
  const due = dueState(task)
  const dueColor = due === 'Overdue' ? colors.danger : due === 'Due today' ? colors.warning : colors.ash

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.78}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Reassign ticket ${task.ref_id}` : undefined}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemRef}>{task.ref_id}</Text>
        <Text style={[styles.dueBadge, { color: dueColor }]}>{due}</Text>
      </View>
      <Text style={styles.itemTitle} numberOfLines={2}>{task.title}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.badge, { color: PRIORITY_COLOR[task.priority] ?? colors.ash }]}>{task.priority}</Text>
        <Text style={[styles.badge, { color: STATUS_COLOR[task.status] ?? colors.ash }]}>{task.status}</Text>
      </View>
      <Text style={styles.itemMeta}>{assignee(task)}</Text>
      <Text style={styles.itemMeta}>Due {formatDate(dueValue(task))}</Text>
      {onPress && <Text style={styles.reassignHint}>TAP TO REASSIGN</Text>}
    </TouchableOpacity>
  )
}

export default function TrackerScreen() {
  const { token, user } = useAuth()
  const canUpdate = user?.permissions?.includes('task.update') ?? false
  const [stream, setStream] = useState<TaskCategory>('admin')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignmentTask, setAssignmentTask] = useState<Task | null>(null)
  const [assignableUsers, setAssignableUsers] = useState<TaskAssignableUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [assignmentSaving, setAssignmentSaving] = useState(false)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const response = await taskApi.list({ category: stream, limit: '100' }, token ?? undefined)
      setTasks(response.success ? (response.data ?? []) : [])
      if (!response.success) setError('Failed to load tasks.')
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [stream, token])

  useEffect(() => { load() }, [load])

  const openAssignment = useCallback(async (task: Task) => {
    if (!canUpdate) return
    setAssignmentTask(task)
    setSelectedUsers(task.assignees?.map(item => item.username) ?? [])
    setAssignmentError(null)
    setAssignmentLoading(true)
    try {
      const response = await taskApi.assignableUsers(token ?? undefined)
      const users = response.success ? (response.data ?? []) : []
      setAssignableUsers(users)
      if (!task.assignees?.length && task.assigned_to_user_id) {
        const legacy = users.find(item => item.id === task.assigned_to_user_id)
        if (legacy) setSelectedUsers([legacy.username])
      }
      if (!response.success) setAssignmentError('Assignable users could not be loaded.')
    } catch {
      setAssignmentError('Could not reach the portal API.')
    } finally {
      setAssignmentLoading(false)
    }
  }, [canUpdate, token])

  function toggleUser(username: string) {
    setSelectedUsers(current => current.includes(username)
      ? current.filter(item => item !== username)
      : [...current, username])
  }

  async function saveAssignment() {
    if (!assignmentTask || !selectedUsers.length) {
      setAssignmentError('Select at least one user.')
      return
    }
    setAssignmentSaving(true)
    setAssignmentError(null)
    try {
      const response = await taskApi.reassign(assignmentTask.ref_id, selectedUsers, token ?? undefined)
      if (!response.success) {
        setAssignmentError(response.message ?? 'Assignment could not be updated.')
        return
      }
      await load(true)
      setAssignmentTask(null)
    } catch {
      setAssignmentError('Could not reach the portal API.')
    } finally {
      setAssignmentSaving(false)
    }
  }

  const activeTasks = useMemo(() => tasks.filter(isActive), [tasks])
  const orderedTasks = useMemo(() => [...tasks].sort((a, b) => urgencyRank(a) - urgencyRank(b)), [tasks])
  const overdue = activeTasks.filter(task => dueState(task) === 'Overdue')
  const dueToday = activeTasks.filter(task => dueState(task) === 'Due today')
  const urgent = activeTasks.filter(task => task.priority === 'Urgent')
  const assigneeRows = Object.entries(activeTasks.reduce<Record<string, number>>((acc, task) => {
    const name = assignee(task)
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const maxAssignee = Math.max(...assigneeRows.map(([, count]) => count), 1)

  const listHeader = (
    <View>
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

      <View style={styles.summaryGrid}>
        <SummaryCard label="Open" value={activeTasks.length} sub="Active work" />
        <SummaryCard label="Urgent" value={urgent.length} sub="Priority" />
        <SummaryCard label="Due" value={dueToday.length + overdue.length} sub={`${overdue.length} overdue`} />
      </View>

      <View style={styles.loadCard}>
        <Text style={styles.sectionTitle}>Assignee Load</Text>
        {assigneeRows.length ? assigneeRows.map(([name, count]) => (
          <View key={name} style={styles.loadRow}>
            <View style={styles.loadTextRow}>
              <Text style={styles.loadName}>{name}</Text>
              <Text style={styles.loadCount}>{count}</Text>
            </View>
            <View style={styles.loadTrack}>
              <View style={[styles.loadFill, { width: `${Math.max(8, Math.round((count / maxAssignee) * 100))}%` }]} />
            </View>
          </View>
        )) : <Text style={styles.emptySmall}>No active assignee load.</Text>}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading && <ActivityIndicator color={colors.fireOrange} style={{ marginTop: spacing.lg }} />}
      <Text style={styles.sectionTitle}>Due / Overdue Work</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={orderedTasks}
        keyExtractor={t => String(t.id)}
        renderItem={({ item }) => <TaskItem task={item} onPress={canUpdate ? () => openAssignment(item) : undefined} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.fireOrange} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No tasks in this stream.</Text> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Modal visible={assignmentTask != null} transparent animationType="slide" onRequestClose={() => setAssignmentTask(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>REASSIGN TRACKER TICKET</Text>
            <Text style={styles.modalTitle}>{assignmentTask?.ref_id}</Text>
            <Text style={styles.modalSub}>{assignmentTask?.title}</Text>
            {assignmentLoading ? <ActivityIndicator color={colors.fireOrange} style={styles.modalLoader} /> : (
              <FlatList
                data={assignableUsers}
                keyExtractor={item => String(item.id)}
                style={styles.userList}
                renderItem={({ item }) => {
                  const active = selectedUsers.includes(item.username)
                  return (
                    <TouchableOpacity
                      onPress={() => toggleUser(item.username)}
                      style={[styles.userOption, active && styles.userOptionActive]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`Assign ${item.name}`}
                    >
                      <View style={[styles.checkbox, active && styles.checkboxActive]} />
                      <View style={styles.userText}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userUsername}>{item.username}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                }}
                ListEmptyComponent={<Text style={styles.emptySmall}>No assignable users found.</Text>}
              />
            )}
            {assignmentError && <Text style={styles.assignmentError}>{assignmentError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAssignmentTask(null)} style={styles.cancelButton} accessibilityRole="button">
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={assignmentSaving || assignmentLoading || !selectedUsers.length} onPress={saveAssignment} style={[styles.saveButton, (assignmentSaving || assignmentLoading || !selectedUsers.length) && styles.buttonDisabled]} accessibilityRole="button">
                <Text style={styles.saveButtonText}>{assignmentSaving ? 'SAVING...' : 'SAVE ASSIGNMENT'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.md },
  heading: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 4, color: colors.flameGold, marginBottom: spacing.sm },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 6, borderWidth: 1, borderColor: colors.steelDark },
  tabActive: { backgroundColor: colors.fireOrange, borderColor: colors.fireOrange },
  tabText: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 2, textTransform: 'uppercase' },
  tabTextActive: { color: colors.coal },
  summaryGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: { flex: 1, minHeight: 92, backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.sm },
  summaryLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash, letterSpacing: 1.5, textTransform: 'uppercase' },
  summaryValue: { fontFamily: fonts.display, fontSize: 28, color: colors.bonePaper, marginTop: 8 },
  summarySub: { fontFamily: fonts.body, fontSize: 10, color: colors.ash, marginTop: 4 },
  loadCard: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.sm },
  loadRow: { marginBottom: spacing.sm },
  loadTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  loadName: { fontFamily: fonts.body, fontSize: 12, color: colors.bonePaper },
  loadCount: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash },
  loadTrack: { height: 6, borderRadius: 999, backgroundColor: colors.steelDark, overflow: 'hidden' },
  loadFill: { height: 6, borderRadius: 999, backgroundColor: colors.fireOrange },
  item: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, padding: spacing.md, minHeight: 132 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemRef: { fontFamily: fonts.mono, fontSize: 10, color: colors.fireOrange, letterSpacing: 1 },
  dueBadge: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 10 },
  badge: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  itemTitle: { fontFamily: fonts.body, fontSize: 14, color: colors.bonePaper, lineHeight: 20 },
  itemMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 4 },
  reassignHint: { fontFamily: fonts.mono, fontSize: 8, color: colors.fireOrange, letterSpacing: 1.2, marginTop: spacing.sm },
  separator: { height: spacing.sm },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, textAlign: 'center', marginTop: spacing.xl },
  emptySmall: { fontFamily: fonts.body, fontSize: 12, color: colors.ash },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalCard: { maxHeight: '82%', backgroundColor: colors.navy, borderTopWidth: 1, borderColor: colors.fireOrange, padding: spacing.lg },
  modalEyebrow: { fontFamily: fonts.mono, fontSize: 9, color: colors.fireOrange, letterSpacing: 1.8 },
  modalTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.bonePaper, marginTop: spacing.xs },
  modalSub: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, marginTop: spacing.xs, marginBottom: spacing.md },
  modalLoader: { marginVertical: spacing.xl },
  userList: { maxHeight: 360 },
  userOption: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.steelDark, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  userOptionActive: { borderColor: colors.fireOrange, backgroundColor: `${colors.fireOrange}12` },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: colors.ash, marginRight: spacing.md },
  checkboxActive: { borderWidth: 5, borderColor: colors.fireOrange, backgroundColor: colors.bonePaper },
  userText: { flex: 1 },
  userName: { fontFamily: fonts.body, fontSize: 14, color: colors.bonePaper },
  userUsername: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, marginTop: 2 },
  assignmentError: { fontFamily: fonts.body, fontSize: 12, color: colors.danger, marginTop: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  cancelButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.steelDark },
  cancelButtonText: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 1 },
  saveButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, backgroundColor: colors.fireOrange, borderWidth: 1, borderColor: colors.fireOrange },
  saveButtonText: { fontFamily: fonts.mono, fontSize: 10, color: colors.coal, letterSpacing: 1 },
  buttonDisabled: { opacity: 0.45 },
})
