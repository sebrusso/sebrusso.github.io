import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '../components/navigation'
import { CONTENT_PADDING, MAX_CONTENT_WIDTH } from '../lib/constants'
import { Analytics } from '../components/analytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sebastian Russo',
  description: 'Personal website and portfolio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Analytics />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className={`container mx-auto ${CONTENT_PADDING} ${MAX_CONTENT_WIDTH}`}>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}

