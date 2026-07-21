import { Linking, Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

function bytesToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

export async function openAuthenticatedPdf(url: string, token: string | null, filename: string, title: string) {
  if (Platform.OS === 'web') {
    await Linking.openURL(url)
    return
  }
  if (!token) throw new Error('Authentication required')
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'X-Requested-With': 'XMLHttpRequest' },
  })
  if (!response.ok) throw new Error(`PDF request failed (${response.status})`)
  const safeName = filename.replace(/[^A-Za-z0-9_.-]/g, '_')
  const fileUri = `${FileSystem.cacheDirectory}${safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`}`
  await FileSystem.writeAsStringAsync(fileUri, bytesToBase64(await response.arrayBuffer()), {
    encoding: FileSystem.EncodingType.Base64,
  })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: title, UTI: 'com.adobe.pdf' })
    return
  }
  await Linking.openURL(fileUri)
}
