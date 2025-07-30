import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OPSAI Core - Build Your SaaS App in Minutes',
  description: 'Generate complete vertical SaaS applications with AI-powered configuration. From idea to production-ready app.',
  keywords: 'SaaS generator, vertical SaaS, app builder, business application, API integration',
  authors: [{ name: 'OPSAI Team' }],
  viewport: 'width=device-width, initial-scale=1',
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