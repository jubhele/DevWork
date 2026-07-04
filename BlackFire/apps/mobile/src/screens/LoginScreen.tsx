import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native'
import { colors, fonts } from '@blackfire/ui-tokens'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!username || !password) return
    setError(null)
    setLoading(true)
    const err = await login(username, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Image
          source={require('../../assets/blackfire-logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.sub}>Umlilo Portal</Text>

        <View style={styles.card}>
          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={colors.ash}
            placeholder="username"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={colors.ash}
            placeholder="••••••••"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={colors.coal} />
              : <Text style={styles.btnText}>SIGN IN</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.coal },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: {
    width: 260,
    height: 90,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ash,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.steelDark,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.ash,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.charcoal,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.steelDark,
    color: colors.bonePaper,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 12,
  },
  btn: {
    marginTop: 24,
    backgroundColor: colors.fireOrange,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 3,
    color: colors.coal,
  },
})
