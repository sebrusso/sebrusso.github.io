import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '../components/navigation'
import { CONTENT_PADDING, MAX_CONTENT_WIDTH } from '../lib/constants'
import { Analytics } from '../components/analytics'
import { ThemeScript } from '../components/theme-script'
import { SITE_URL } from '../lib/constants'

const inter = Inter({ subsets: ['latin'] })

const description =
  'Research PM at Google DeepMind: code post-training for Gemini, lead PM for EmbeddingGemma. Studied computer science at Stanford and researched machine creativity at the Autonomous Agents Lab, which produced LitBench.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sebastian Russo',
    template: '%s · Sebastian Russo',
  },
  description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sebastian Russo',
    description,
    url: SITE_URL,
    siteName: 'Sebastian Russo',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Sebastian Russo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sebastian Russo',
    description,
    creator: '@sebbrusso',
    images: ['/og.png'],
  },
}

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sebastian Russo',
  jobTitle: 'Research Product Manager',
  worksFor: {
    '@type': 'Organization',
    name: 'Google DeepMind',
  },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Stanford University',
  },
  homeLocation: {
    '@type': 'Place',
    name: 'San Francisco, CA',
  },
  url: SITE_URL,
  sameAs: [
    'https://www.linkedin.com/in/sebasrusso/',
    'https://x.com/sebbrusso',
    'https://github.com/sebrusso',
    'https://sebrusso.substack.com',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
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
