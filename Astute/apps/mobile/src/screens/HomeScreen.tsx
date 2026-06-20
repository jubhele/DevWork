import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '@astute/ui-tokens'
import { METRICS } from '../data'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  return 'Good evening.'
}

export function HomeScreen() {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.brand}>ASTUTE INSIGHTS</Text>
      <Text style={styles.greeting}>{greeting()}</Text>
      <Text style={styles.sub}>Your monitoring and reporting surface.</Text>

      <View style={styles.metricGrid}>
        {METRICS.map(m => (
          <View key={m.label} style={styles.metric}>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoKicker}>This week</Text>
        <Text style={styles.infoBody}>
          All North portfolio sites reported normal activity. One access fault at Site 03 was resolved
          within 4 hours. Zone 12 is now live.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.midnight },
  container: { padding: 24, gap: 16 },
  brand: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.aurum,
    marginBottom: 4,
  },
  greeting: {
    fontFamily: fonts.display,
    fontSize: 52,
    lineHeight: 54,
    color: colors.bone,
  },
  sub: { color: colors.ash, fontSize: 16, lineHeight: 24, marginBottom: 8 },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.harbor,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    gap: 4,
  },
  metricValue: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.champagne,
  },
  metricLabel: { color: colors.ash, fontSize: 12, lineHeight: 16 },
  infoCard: {
    backgroundColor: colors.harbor,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 20,
    gap: 8,
  },
  infoKicker: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.aurum,
  },
  infoBody: { color: colors.ash, lineHeight: 22, fontSize: 15 },
})
