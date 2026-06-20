import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '@astute/ui-tokens'
import { ALERTS } from '../data'

export function AlertsScreen() {
  const insets = useSafeAreaInsets()
  const unread = ALERTS.filter(a => !a.read).length

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>Alerts</Text>
      <View style={styles.headRow}>
        <Text style={styles.heading}>Notifications</Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{unread}</Text>
          </View>
        )}
      </View>

      {ALERTS.map(alert => (
        <View key={alert.id} style={[styles.item, !alert.read && styles.itemUnread]}>
          <View style={styles.itemHeader}>
            <View style={styles.titleRow}>
              {!alert.read && <View style={styles.dot} />}
              <Text style={[styles.title, !alert.read && styles.titleUnread]}>{alert.title}</Text>
            </View>
            <Text style={styles.time}>{alert.time}</Text>
          </View>
          <Text style={styles.detail}>{alert.detail}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.midnight },
  container: { padding: 24, gap: 14 },
  kicker: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: colors.aurum,
    marginBottom: 2,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  heading: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 46,
    color: colors.bone,
  },
  badge: {
    backgroundColor: colors.aurum,
    borderRadius: 999,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginTop: 8,
  },
  badgeLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  item: {
    backgroundColor: colors.harbor,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 18,
    gap: 8,
  },
  itemUnread: {
    borderColor: 'rgba(194,160,74,0.35)',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.aurum, flexShrink: 0 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ash, flex: 1 },
  titleUnread: { color: colors.bone },
  time: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 1 },
  detail: { color: colors.ash, fontSize: 14, lineHeight: 20 },
})
