import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '../components/navigation'
import { CONTENT_PADDING, MAX_CONTENT_WIDTH } from '../lib/constants'
import { Analytics } from '../components/analytics'

const inter = Inter({ subsets: ['latin'] })

const description =
  'Product at Google DeepMind. Studied computer science at Stanford, where I researched how we evaluate machine creativity at the Autonomous Agents Lab.'

export const metadata: Metadata = {
  metadataBase: new URL('https://sebrusso.github.io'),
  title: {
    default: 'Sebastian Russo',
    template: '%s · Sebastian Russo',
  },
  description,
  openGraph: {
    title: 'Sebastian Russo',
    description,
    url: 'https://sebrusso.github.io',
    siteName: 'Sebastian Russo',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Sebastian Russo',
    description,
    creator: '@sebbrusso',
  },
}

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sebastian Russo',
  jobTitle: 'Product Manager',
  worksFor: {
    '@type': 'Organization',
    name: 'Google DeepMind',
  },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Stanford University',
  },
  url: 'https://sebrusso.github.io',
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
    <html lang="en">
      <head>
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

