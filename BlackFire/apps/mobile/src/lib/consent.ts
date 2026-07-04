import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const KEY = 'bf_consent_v1'

export async function hasAcceptedConsent(): Promise<boolean> {
  const v =
    Platform.OS === 'web'
      ? (typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY))
      : await SecureStore.getItemAsync(KEY)
  return v === 'accepted'
}

export async function acceptConsent(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, 'accepted')
    }
    return
  }
  await SecureStore.setItemAsync(KEY, 'accepted')
}
