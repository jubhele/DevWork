import * as SecureStore from 'expo-secure-store'

const KEY = 'bf_consent_v1'

export async function hasAcceptedConsent(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(KEY)
  return v === 'accepted'
}

export async function acceptConsent(): Promise<void> {
  await SecureStore.setItemAsync(KEY, 'accepted')
}
