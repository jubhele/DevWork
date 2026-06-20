import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '@astute/ui-tokens'
import type { BriefItem } from './data'
import { HomeScreen } from './screens/HomeScreen'
import { BriefListScreen } from './screens/BriefListScreen'
import { BriefDetailScreen } from './screens/BriefDetailScreen'
import { AlertsScreen } from './screens/AlertsScreen'

export type Tab = 'home' | 'briefs' | 'alerts'

type BriefRoute =
  | { name: 'BriefList' }
  | { name: 'BriefDetail'; params: BriefItem }

type NavContextType = {
  push: (route: BriefRoute) => void
  goBack: () => void
}

const NavContext = createContext<NavContextType>({} as NavContextType)
export const useNav = () => useContext(NavContext)

const TABS: { key: Tab; label: string }[] = [
  { key: 'home',   label: 'Home'   },
  { key: 'briefs', label: 'Briefs' },
  { key: 'alerts', label: 'Alerts' },
]

function TabBar({ active, onPress }: { active: Tab; onPress: (t: Tab) => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <Pressable key={key} style={styles.tab} onPress={() => onPress(key)}>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
            {isActive && <View style={styles.tabDot} />}
          </Pressable>
        )
      })}
    </View>
  )
}

function Navigator() {
  const [tab, setTab] = useState<Tab>('home')
  const [briefStack, setBriefStack] = useState<BriefRoute[]>([{ name: 'BriefList' }])

  const push = useCallback((route: BriefRoute) => {
    setBriefStack(s => [...s, route])
  }, [])

  const goBack = useCallback(() => {
    setBriefStack(s => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])

  const handleTabPress = useCallback((key: Tab) => {
    if (key === 'briefs') setBriefStack([{ name: 'BriefList' }])
    setTab(key)
  }, [])

  const ctx = useMemo(() => ({ push, goBack }), [push, goBack])
  const topRoute = briefStack[briefStack.length - 1]

  return (
    <NavContext.Provider value={ctx}>
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === 'home' && <HomeScreen />}
          {tab === 'briefs' && topRoute.name === 'BriefList' && <BriefListScreen />}
          {tab === 'briefs' && topRoute.name === 'BriefDetail' && (
            <BriefDetailScreen brief={topRoute.params} />
          )}
          {tab === 'alerts' && <AlertsScreen />}
        </View>
        <TabBar active={tab} onPress={handleTabPress} />
      </View>
    </NavContext.Provider>
  )
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <Navigator />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.midnight },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.harbor,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10, gap: 5 },
  tabLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.ash,
  },
  tabLabelActive: { color: colors.aurum },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.aurum },
})
