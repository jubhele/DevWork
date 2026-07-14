import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { colors, fonts, spacing } from '@blackfire/ui-tokens'
import { useAuth } from '../context/AuthContext'

const CONTACTS = [
  { label: 'BlackFire Office', value: '+27 (0)11 000 0000', action: 'tel:+27110000000' },
  { label: 'Emergency Dispatch', value: '+27 (0)82 000 0000', action: 'tel:+27820000000' },
  { label: 'Email Support', value: 'support@blackfiresolutions.co.za', action: 'mailto:support@blackfiresolutions.co.za' },
]

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function ContactRow({ label, value, action }: { label: string; value: string; action: string }) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(action).catch(() => null)} activeOpacity={0.7}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, styles.link]}>{value}</Text>
    </TouchableOpacity>
  )
}

export default function SupportScreen() {
  const { user, logout } = useAuth()

  const ROLE_DISPLAY: Record<string, string> = {
    sysadmin: 'System Admin', admin: 'Admin', manager: 'Manager',
    admin_clerk: 'Admin Clerk', call_logger: 'Call Logger',
    senior_tech: 'Senior Technician', junior_tech: 'Junior Technician',
    client_support: 'Client Support', safety_officer: 'Safety Officer', viewer: 'Viewer',
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Support</Text>
      <Text style={styles.sub}>Clients, reports, timeline and assistance</Text>

      <Text style={styles.section}>My Account</Text>
      <View style={styles.card}>
        <InfoRow label="Name" value={user?.name ?? '—'} />
        <View style={styles.divider} />
        <InfoRow label="Username" value={user?.username ?? '—'} />
        <View style={styles.divider} />
        <InfoRow label="Email" value={user?.email ?? '—'} />
        <View style={styles.divider} />
        <InfoRow label="Role" value={ROLE_DISPLAY[user?.role ?? ''] ?? (user?.role ?? '—')} />
      </View>

      <Text style={styles.section}>Support Areas</Text>
      <View style={styles.card}>
        <InfoRow label="Clients" value="Support-owned records for jobs, quotes and invoices" />
        <View style={styles.divider} />
        <InfoRow label="Reports" value="Support-owned oversight and reporting area" />
        <View style={styles.divider} />
        <InfoRow label="Site Timeline" value="Support-owned site history and activity view" />
      </View>

      <Text style={styles.section}>Contacts</Text>
      <View style={styles.card}>
        {CONTACTS.map((c, i) => (
          <View key={c.label}>
            {i > 0 && <View style={styles.divider} />}
            <ContactRow label={c.label} value={c.value} action={c.action} />
          </View>
        ))}
      </View>

      <Text style={styles.section}>About</Text>
      <View style={styles.card}>
        <InfoRow label="App" value="Umlilo — BlackFire Solutions" />
        <View style={styles.divider} />
        <InfoRow label="Version" value="1.0.0" />
        <View style={styles.divider} />
        <InfoRow label="Portal" value="blackfiresolutions.co.za" />
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.signOutText}>SIGN OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontFamily: fonts.display, fontSize: 28, letterSpacing: 4, color: colors.flameGold },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.ash, letterSpacing: 2, marginTop: 4, marginBottom: spacing.lg, textTransform: 'uppercase' },
  section: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 3, color: colors.ash, textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.navy, borderRadius: 8, borderWidth: 1, borderColor: colors.steelDark, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  rowLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 1, textTransform: 'uppercase' },
  rowValue: { fontFamily: fonts.body, fontSize: 13, color: colors.bonePaper, flexShrink: 1, textAlign: 'right', marginLeft: spacing.md },
  link: { color: colors.fireOrange },
  divider: { height: 1, backgroundColor: colors.steelDark, marginHorizontal: spacing.md },
  signOutBtn: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: { fontFamily: fonts.display, fontSize: 13, letterSpacing: 3, color: colors.danger },
})
