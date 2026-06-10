import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { colors } from '@blackfire/ui-tokens'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import CalloutsScreen from './src/screens/CalloutsScreen'
import CalloutDetailScreen from './src/screens/CalloutDetailScreen'

export type RootStackParamList = {
  Dashboard: undefined
  Callouts:  undefined
  CalloutDetail: { id: number; ref_id: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

const screenOptions = {
  headerStyle:      { backgroundColor: colors.navy },
  headerTintColor:  colors.bonePaper,
  headerTitleStyle: { fontFamily: 'Big Shoulders Display', letterSpacing: 2 },
  contentStyle:     { backgroundColor: colors.coal },
}

function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.coal, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.fireOrange} />
      </View>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <NavigationContainer>
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

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={colors.coal} />
      <AppNavigator />
    </AuthProvider>
  )
}
