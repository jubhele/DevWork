import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { colors } from '@blackfire/ui-tokens'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/LoginScreen'

function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.coal, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.fireOrange} />
      </View>
    )
  }

  // TODO: replace with React Navigation stack once screens are built
  if (!user) return <LoginScreen />

  // Placeholder — dashboard screen comes next
  return <LoginScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={colors.coal} />
      <AppNavigator />
    </AuthProvider>
  )
}
