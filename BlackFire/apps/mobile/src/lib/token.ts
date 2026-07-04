import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const KEY = 'bf_auth_token'

function readWebStorage(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(KEY)
}

function writeWebStorage(value: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, value)
}

function clearWebStorage(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(KEY)
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    writeWebStorage(token)
    return
  }
  await SecureStore.setItemAsync(KEY, token)
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return readWebStorage()
  }
  return SecureStore.getItemAsync(KEY)
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    clearWebStorage()
    return
  }
  await SecureStore.deleteItemAsync(KEY)
}
