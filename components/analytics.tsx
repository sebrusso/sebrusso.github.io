'use client'

import Script from 'next/script'
import { Suspense } from 'react'
import { GA_MEASUREMENT_ID } from '../lib/gtag'
import { usePageTracking } from '../hooks/usePageTracking'

function PageTracker() {
  usePageTracking()
  return null
}

export function Analytics() {
  return (
    <>
      <Suspense fallback={null}>
        <PageTracker />
      </Suspense>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
} 