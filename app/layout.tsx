import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ToasterProvider } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Store Locator',
  description: 'Next.js + MongoDB + Google Maps',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToasterProvider>{children}</ToasterProvider>
      </body>
    </html>
  )
}
