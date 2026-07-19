import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { colors, fonts } from '@blackfire/ui-tokens'
import { acceptConsent } from '../lib/consent'

interface Props {
  onAccepted: () => void
}

export default function ConsentScreen({ onAccepted }: Props) {
  async function handleAccept() {
    await acceptConsent()
    onAccepted()
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/blackfire-logo-transparent.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.heading}>Terms of Use</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.body}>
          This application ("Umlilo Portal") is a proprietary tool operated by BlackFire Solutions
          (Pty) Ltd. Access is restricted to authorised personnel only.
        </Text>

        <Text style={styles.sectionTitle}>DATA PROCESSING</Text>
        <Text style={styles.body}>
          By using this app you consent to BlackFire Solutions processing your activity data
          (login events, task updates, call logs) for operational and audit purposes under
          POPIA (Protection of Personal Information Act, Act 4 of 2013).
        </Text>

        <Text style={styles.sectionTitle}>ACCEPTABLE USE</Text>
        <Text style={styles.body}>
          You may only use this application for authorised BlackFire or client business purposes.
          Sharing credentials, exporting data without authorisation, or attempting to access
          data outside your role permissions is prohibited and may result in disciplinary action.
        </Text>

        <Text style={styles.sectionTitle}>ACCOUNT DELETION</Text>
        <Text style={styles.body}>
          You may request deletion of your account and associated personal data at any time by
          contacting your system administrator or using the account settings within the portal.
        </Text>

        <Text style={styles.sectionTitle}>CONTACT</Text>
        <Text style={styles.body}>
          For privacy inquiries: privacy@blackfiresolutions.co.za
        </Text>
      </ScrollView>

      <TouchableOpacity style={styles.btn} onPress={handleAccept} activeOpacity={0.8}>
        <Text style={styles.btnText}>I UNDERSTAND AND AGREE</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 },
  logo: {
    width: 260,
    height: 90,
    alignSelf: 'center',
    marginBottom: 4,
  },
  heading: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ash,
    textAlign: 'center',
    marginBottom: 24,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.fireOrange,
    marginTop: 20,
    marginBottom: 6,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.bonePaper,
    lineHeight: 20,
  },
  btn: {
    marginTop: 16,
    backgroundColor: colors.fireOrange,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 2.5,
    color: colors.coal,
  },
})
