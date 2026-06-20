import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '@astute/ui-tokens'
import { BRIEFS } from '../data'
import { useNav } from '../navigation'

const TAG_COLORS: Record<string, string> = {
  WEEKLY: '#244360',
  RISK:   '#4a1a1e',
  ACTION: '#2a3a1a',
  UPDATE: '#1a2a3a',
}

export function BriefListScreen() {
  const insets = useSafeAreaInsets()
  const { push } = useNav()

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>Briefs</Text>
      <Text style={styles.heading}>All briefs</Text>

      {BRIEFS.map(brief => (
        <Pressable
          key={brief.id}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => push({ name: 'BriefDetail', params: brief })}
        >
          <View style={styles.cardMeta}>
            <View style={[styles.tag, { backgroundColor: TAG_COLORS[brief.tag] ?? colors.slate }]}>
              <Text style={styles.tagLabel}>{brief.tag}</Text>
            </View>
            <Text style={styles.date}>{brief.date}</Text>
          </View>
          <Text style={styles.title}>{brief.title}</Text>
          <Text style={styles.excerpt} numberOfLines={2}>{brief.excerpt}</Text>
        </Pressable>
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
  heading: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 46,
    color: colors.bone,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.harbor,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 20,
    gap: 10,
  },
  cardPressed: { opacity: 0.75 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.bone,
    textTransform: 'uppercase',
  },
  date: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 1 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.bone, lineHeight: 28 },
  excerpt: { color: colors.ash, fontSize: 14, lineHeight: 20 },
})
