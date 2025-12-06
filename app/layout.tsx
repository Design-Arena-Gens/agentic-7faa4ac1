import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Diet Tracker Agent',
  description: 'AI-powered daily diet habit tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
