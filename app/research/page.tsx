import { ResearchCard } from '../../components/research-card'
import { getCitationCount } from '../../lib/citations'
import { RESEARCH_ENTRIES } from '../../lib/research'

/**
 * /research
 *
 * A thin map over RESEARCH_ENTRIES (lib/research.ts). This stays a server
 * component so citation counts are resolved once at build time; the collapse
 * behaviour lives in the client ResearchCard.
 */
export default async function ResearchPage() {
  const visible = RESEARCH_ENTRIES.filter((entry) => !entry.hidden)

  // Resolve every citation lookup in parallel so the build isn't serialized on
  // one slow Semantic Scholar response per entry.
  const citations = await Promise.all(
    visible.map((entry) => (entry.arxivId ? getCitationCount(entry.arxivId) : null))
  )

  return (
    <div className="py-6">
      <div className="flex flex-col gap-6">
        {visible.map((entry, i) => (
          <ResearchCard key={entry.id} entry={entry} citations={citations[i]} />
        ))}
      </div>
    </div>
  )
}

export function generateMetadata() {
  return {
    title: 'Research',
    description:
      'LitBench (EACL 2026) and Gemini Embedding 2 — work on evaluating machine creativity and on text and multimodal embedding models.',
  }
}
