import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ToasterProvider } from '@/components/ui/toaster'
import { ClerkProvider } from '@clerk/nextjs'
import { Header } from '@/components/ui/header'
import { BrandProvider } from '@/components/providers/brand-provider'

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
    <ClerkProvider>
      <html lang="en">
        <body>
          <BrandProvider>
            <ToasterProvider>
              <Header />
              {children}
            </ToasterProvider>
          </BrandProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
