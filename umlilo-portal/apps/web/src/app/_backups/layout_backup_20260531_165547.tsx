import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Umlilo Portal — BlackFire Solutions',
  description: 'BlackFire Solutions operational management portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased font-body">{children}</body>
    </html>
  )
}
