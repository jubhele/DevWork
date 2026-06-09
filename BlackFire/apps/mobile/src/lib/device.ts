import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const DEVICE_ID_KEY = 'bf_device_id'

export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY)
  if (!id) {
    id = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id)
  }
  return id
}

export function getDeviceName(): string {
  return `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Device`
}
