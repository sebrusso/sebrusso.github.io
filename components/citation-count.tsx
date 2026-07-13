'use client'

import { useEffect, useState } from 'react'

interface CitationCountProps {
  arxivId: string
}

export function CitationCount({ arxivId }: CitationCountProps) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=citationCount`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (typeof data?.citationCount === 'number' && data.citationCount > 0) {
          setCount(data.citationCount)
        }
      })
      .catch(() => {})
  }, [arxivId])

  if (count === null) return null

  return <span> · {count} citation{count === 1 ? '' : 's'}</span>
}
