import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '@astute/ui-tokens'
import type { BriefItem } from '../data'
import { useNav } from '../navigation'

type Props = { brief: BriefItem }

export function BriefDetailScreen({ brief }: Props) {
  const insets = useSafeAreaInsets()
  const { goBack } = useNav()

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.back} onPress={goBack} hitSlop={12}>
        <Text style={styles.backLabel}>← Briefs</Text>
      </Pressable>

      <View style={styles.tag}>
        <Text style={styles.tagLabel}>{brief.tag}</Text>
      </View>

      <Text style={styles.title}>{brief.title}</Text>
      <Text style={styles.date}>{brief.date}</Text>

      <View style={styles.divider} />

      <Text style={styles.body}>{brief.body}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.midnight },
  container: { padding: 24, gap: 14 },
  back: { alignSelf: 'flex-start', marginBottom: 4 },
  backLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.aurum,
    textTransform: 'uppercase',
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.slate,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.bone,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 46,
    color: colors.bone,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.ash,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  body: {
    color: colors.bone,
    fontSize: 17,
    lineHeight: 28,
  },
})
