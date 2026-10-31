import { Suspense } from 'react'
import localFont from 'next/font/local'
import type { Metadata } from 'next'
import { NotebookApp } from '../../components/notebook/notebook-app'
import './notebook.css'

/**
 * /notebook-7f3k9q — the Eval Notebook. Deliberately unlinked: it is not in
 * the nav, sitemap.ts or robots.ts (a Disallow line would advertise the path),
 * and it asks search engines not to index it. Login and the database rules
 * are the real protection; see the design doc.
 */

const mono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-nb-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Eval notebook',
  robots: { index: false, follow: false, nocache: true },
}

export default function NotebookPage() {
  return (
    <div className={mono.variable}>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <NotebookApp />
      </Suspense>
    </div>
  )
}
