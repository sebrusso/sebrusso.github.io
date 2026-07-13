import citations from '../data/citations.json'

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1/paper'

type CitationRecord = { count: number; asOf: string }

// Semantic Scholar has the only accurate count for arXiv preprints (OpenAlex
// reports 0 for them), but its unauthenticated pool is shared globally and
// 429s most of the time. So: try to refresh at build time, and fall back to
// the last-known count committed in data/citations.json.
async function fetchCitationCount(arxivId: string): Promise<number | null> {
  const attempts = 4

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 5000 * attempt))
    }

    try {
      const res = await fetch(
        `${SEMANTIC_SCHOLAR_API}/arXiv:${arxivId}?fields=citationCount`,
        { cache: 'no-store' }
      )

      if (res.status === 429) continue
      if (!res.ok) return null

      const data = await res.json()
      return typeof data?.citationCount === 'number' ? data.citationCount : null
    } catch {
      // Network error — try again.
    }
  }

  return null
}

export async function getCitationCount(arxivId: string): Promise<number | null> {
  const fallback = (citations as Record<string, CitationRecord>)[arxivId]

  // Only hit the network during the production build. In dev this runs on every
  // request, and the 429 retry loop would stall the page for ~30s.
  if (process.env.NODE_ENV !== 'production') {
    return fallback?.count ?? null
  }

  const fresh = await fetchCitationCount(arxivId)

  if (fresh !== null) {
    if (fallback && fresh !== fallback.count) {
      console.log(
        `Citation count for arXiv:${arxivId} is now ${fresh} (data/citations.json says ${fallback.count} — worth updating)`
      )
    }
    return fresh
  }

  if (fallback) {
    console.warn(
      `Semantic Scholar unavailable; using committed count for arXiv:${arxivId} (${fallback.count}, as of ${fallback.asOf})`
    )
    return fallback.count
  }

  return null
}
