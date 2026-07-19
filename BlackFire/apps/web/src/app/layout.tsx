import type { Metadata } from 'next'
import { Big_Shoulders, Instrument_Sans, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const display = Big_Shoulders({ subsets: ['latin'], variable: '--font-display' })
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'Umlilo Portal — BlackFire Solutions',
  description: 'BlackFire Solutions operational management portal',
  icons: {
    icon: [
      { url: '/favicon-16x16.png?v=blackfire-20260719', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=blackfire-20260719', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-512x512.png?v=blackfire-20260719', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png?v=blackfire-20260719',
    shortcut: '/favicon.ico?v=blackfire-20260719',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${display.variable} ${body.variable} ${mono.variable} ${serif.variable} min-h-full flex flex-col antialiased font-body bg-bone-paper text-ink-text`}>
        {children}
      </body>
    </html>
  )
}
