'use client'

import { Suspense } from 'react'
import Link from 'next/link'

function NotFoundContent() {
  return (
    <div className="container mx-auto max-w-2xl pt-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        Sorry, the page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="text-primary hover:text-primary/80 transition-colors"
      >
        Go back home
      </Link>
    </div>
  )
}

export default function NotFound() {
  return (
    <Suspense fallback={<NotFoundContent />}>
      <NotFoundContent />
    </Suspense>
  )
} 