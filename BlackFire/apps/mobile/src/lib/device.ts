import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const DEVICE_ID_KEY = 'bf_device_id'

export async function getDeviceId(): Promise<string> {
  let id =
    Platform.OS === 'web'
      ? (typeof localStorage === 'undefined' ? null : localStorage.getItem(DEVICE_ID_KEY))
      : await SecureStore.getItemAsync(DEVICE_ID_KEY)

  if (!id) {
    id = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DEVICE_ID_KEY, id)
      }
    } else {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id)
    }
  }
  return id
}

export function getDeviceName(): string {
  return `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Device`
}
