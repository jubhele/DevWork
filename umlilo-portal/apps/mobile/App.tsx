import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { fonts } from '@blackfire/ui-tokens'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import CalloutsScreen from './src/screens/CalloutsScreen'
import CalloutDetailScreen from './src/screens/CalloutDetailScreen'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'

export type RootStackParamList = {
  Dashboard: undefined
  Callouts:  undefined
  CalloutDetail: { id: number; ref_id: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

function ThemeAction() {
  const { mode, palette, toggleTheme } = useTheme()
  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      style={{ minWidth: 52, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ color: palette.accent, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1 }}>
        {mode === 'dark' ? 'DARK' : 'LIGHT'}
      </Text>
    </Pressable>
  )
}

function AppNavigator() {
  const { user, loading } = useAuth()
  const { mode, palette } = useTheme()
  const baseNavigationTheme = mode === 'dark' ? DarkTheme : DefaultTheme
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: palette.accent,
      background: palette.canvas,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.accentStrong,
    },
  }

  const screenOptions = {
    headerStyle: { backgroundColor: palette.surface },
    headerTintColor: palette.text,
    headerTitleStyle: { fontFamily: fonts.display, letterSpacing: 2 },
    headerRight: () => <ThemeAction />,
    contentStyle: { backgroundColor: palette.canvas },
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.canvas, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={palette.accent} />
      </View>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Dashboard" screenOptions={screenOptions}>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'UMLILO', headerShown: true }}
        />
        <Stack.Screen
          name="Callouts"
          component={CalloutsScreen}
          options={{ title: 'CALLOUTS' }}
        />
        <Stack.Screen
          name="CalloutDetail"
          component={CalloutDetailScreen}
          options={({ route }) => ({ title: route.params.ref_id })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

function AppShell() {
  const { mode, palette } = useTheme()
  return (
    <AuthProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </AuthProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}
