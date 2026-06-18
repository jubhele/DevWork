import { useMemo, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { colors, fonts } from '@blackfire/ui-tokens'
import type { ThemePalette } from '@blackfire/ui-tokens'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const { mode, palette, toggleTheme } = useTheme()
  const styles = useMemo(() => createStyles(palette), [palette])
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
        <TouchableOpacity
          style={styles.themeBtn}
          onPress={toggleTheme}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
          <Text style={styles.themeText}>{mode === 'dark' ? 'DARK' : 'LIGHT'}</Text>
        </TouchableOpacity>
        <Text style={styles.wordmark}>BLACKFIRE</Text>
        <Text style={styles.sub}>Umlilo Portal</Text>

        <View style={styles.card}>
          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={palette.muted}
            placeholder="username"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={palette.muted}
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
              ? <ActivityIndicator color={palette.onAccent} />
              : <Text style={styles.btnText}>SIGN IN</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const createStyles = (palette: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvas },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  themeBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    minWidth: 60,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 3,
    backgroundColor: palette.surface,
  },
  themeText: { color: palette.accent, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1 },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: 8,
    color: palette.accent,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 3,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: palette.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
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
    backgroundColor: palette.accent,
    borderRadius: 3,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 3,
    color: palette.onAccent,
  },
})
