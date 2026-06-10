import type { Metadata } from 'next'
import './globals.css'
import crypto from 'crypto'

export const metadata: Metadata = {
  title: 'Umlilo Portal — BlackFire Solutions',
  description: 'BlackFire Solutions operational management portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = crypto.randomBytes(16).toString('base64')
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;900&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/portal.css" />
        <meta name="csp-nonce" content={nonce} />
      </head>
      <body className="min-h-full flex flex-col antialiased font-body">
        {children}
        <script src="/portal.js" defer nonce={nonce}></script>
      </body>
    </html>
  )
}
