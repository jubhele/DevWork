import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, Platform } from 'react-native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { colors, fonts } from '@blackfire/ui-tokens'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { hasAcceptedConsent } from './src/lib/consent'
import ConsentScreen from './src/screens/ConsentScreen'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import TrackerScreen from './src/screens/TrackerScreen'
import CallLogScreen from './src/screens/CallLogScreen'
import QuotesScreen from './src/screens/QuotesScreen'
import InvoicesScreen from './src/screens/InvoicesScreen'
import SafetyScreen from './src/screens/SafetyScreen'
import SupportScreen from './src/screens/SupportScreen'

// ─── Navigator types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

export type OperationsTabParamList = {
  Tracker: undefined
  'Call Log': undefined
}

export type FinanceTabParamList = {
  Overview: undefined
  'Quote Log': undefined
}

export type MainTabParamList = {
  Dashboard: undefined
  Operations: { screen?: keyof OperationsTabParamList }
  Finance: { screen?: keyof FinanceTabParamList }
  Safety: undefined
  Support: undefined
}

// ─── Tab icon chars (no icon library needed) ─────────────────────────────────

const TAB_ICONS: Record<string, string> = {
  Dashboard: '⬡',
  Operations: '◈',
  Finance: '◎',
  Support: '◌',
}

// ─── Operations nested tabs ───────────────────────────────────────────────────

const OpsTab = createBottomTabNavigator<OperationsTabParamList>()

function OperationsNavigator() {
  return (
    <OpsTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.charcoal, borderTopColor: colors.steelDark, height: 52 },
        tabBarActiveTintColor: colors.fireOrange,
        tabBarInactiveTintColor: colors.ash,
        tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
        tabBarLabel: route.name,
      })}
    >
      <OpsTab.Screen name="Tracker" component={TrackerScreen} />
      <OpsTab.Screen name="Call Log" component={CallLogScreen} />
    </OpsTab.Navigator>
  )
}

const FinanceTab = createBottomTabNavigator<FinanceTabParamList>()

function FinanceNavigator() {
  return (
    <FinanceTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.charcoal, borderTopColor: colors.steelDark, height: 52 },
        tabBarActiveTintColor: colors.fireOrange,
        tabBarInactiveTintColor: colors.ash,
        tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
        tabBarLabel: route.name,
      })}
    >
      <FinanceTab.Screen name="Overview" component={InvoicesScreen} />
      <FinanceTab.Screen name="Quote Log" component={QuotesScreen} />
    </FinanceTab.Navigator>
  )
}

// ─── Main bottom tabs ─────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>()

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.navy, borderTopColor: colors.steelDark, height: 64, paddingBottom: 10 },
        tabBarActiveTintColor: colors.fireOrange,
        tabBarInactiveTintColor: colors.ash,
        tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' },
        tabBarIcon: ({ color }) => (
          <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={color} size="small" style={{ display: 'none' }} />
            {/* Icon placeholder — replace with @expo/vector-icons when assets are ready */}
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
          </View>
        ),
        tabBarLabel: route.name,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Operations" component={OperationsNavigator} />
      <Tab.Screen name="Finance" component={FinanceNavigator} />
      <Tab.Screen name="Safety" component={SafetyScreen} />
      <Tab.Screen name="Support" component={SupportScreen} />
    </Tab.Navigator>
  )
}

// ─── Root auth stack ──────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>()

function AppNavigator() {
  const { user, loading } = useAuth()
  const [consentChecked, setConsentChecked] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)

  useEffect(() => {
    hasAcceptedConsent().then((v) => {
      setConsentAccepted(v)
      setConsentChecked(true)
    })
  }, [])

  if (loading || !consentChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.coal, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.fireOrange} size="large" />
      </View>
    )
  }

  if (!consentAccepted) {
    return <ConsentScreen onAccepted={() => setConsentAccepted(true)} />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}

SplashScreen.preventAutoHideAsync()

export default function App() {
  const nativeFontMap: Record<string, number> = Platform.OS === 'web'
    ? {}
    : {
        'BigShouldersDisplay-Regular': require('./assets/fonts/BigShouldersDisplay-Regular.ttf'),
        'BigShouldersDisplay-Bold':    require('./assets/fonts/BigShouldersDisplay-Bold.ttf'),
        'InstrumentSans-Regular':      require('./assets/fonts/InstrumentSans-Regular.ttf'),
        'InstrumentSans-SemiBold':     require('./assets/fonts/InstrumentSans-SemiBold.ttf'),
        'IBMPlexMono-Regular':         require('./assets/fonts/IBMPlexMono-Regular.ttf'),
      }
  const [fontsLoaded, fontError] = useFonts(nativeFontMap)

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return
    }

    document.title = 'BlackFire Umlilo Portal'
    const iconUri = '/assets/?unstable_path=.%2Fassets%2Fblackfire-favicon.png'
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null

    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    link.type = 'image/png'
    link.href = iconUri
  }, [])

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.coal, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.fireOrange} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer
      documentTitle={{
        formatter: () => 'BlackFire Umlilo Portal',
      }}
    >
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </NavigationContainer>
  )
}
