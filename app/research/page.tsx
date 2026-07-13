import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { getCitationCount } from '../../lib/citations'

const LITBENCH_ARXIV_ID = '2507.00769'
const GEMINI_EMBEDDING_ARXIV_ID = '2605.27295'

const litbenchLinks = [
  { label: 'arXiv', href: 'https://arxiv.org/abs/2507.00769' },
  { label: 'ACL Anthology', href: 'https://aclanthology.org/2026.eacl-long.362/' },
  { label: 'HuggingFace', href: 'https://huggingface.co/SAA-Lab' },
  { label: 'Arena', href: 'https://litbench.vercel.app' },
  { label: 'GitHub', href: 'https://github.com/drfein/LitBench' },
]

const geminiEmbeddingLinks = [
  { label: 'arXiv', href: 'https://arxiv.org/abs/2605.27295' },
  { label: 'Blog', href: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/' },
]

const linkClass = 'font-medium text-primary hover:text-primary/80 underline underline-offset-4'

export default async function ResearchPage() {
  const [litbenchCitations, geminiEmbeddingCitations] = await Promise.all([
    getCitationCount(LITBENCH_ARXIV_ID),
    getCitationCount(GEMINI_EMBEDDING_ARXIV_ID),
  ])

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="pl-6">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                LitBench: A Benchmark and Dataset for Reliable Evaluation of Creative Writing
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                EACL 2026 · Stanford Autonomous Agents Lab
                {litbenchCitations ? ` · ${litbenchCitations} citations` : ''}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                Daniel Fein, Sebastian Russo, Violet Xiang, Kabir Jolly, Rafael Rafailov, Nick Haber
              </p>
              <p className="text-sm leading-relaxed">
                Do machines have the same quality preferences for creative writing as humans? LitBench
                is a benchmark for finding out: 2,480 human-labeled story comparisons plus a training
                corpus of ~43,000 preference pairs. We benchmarked LLMs as zero-shot judges of creative
                writing and trained dedicated reward models — the trained models reach 78% agreement
                with human preferences, beating the best off-the-shelf judge (73%), and we validated
                the results with human studies on newly generated stories.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {litbenchLinks.map(({ label, href }) => (
                  <Link key={label} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Gemini Embedding 2: A Native Multimodal Embedding Model from Gemini
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Google DeepMind · May 2026
                {geminiEmbeddingCitations ? ` · ${geminiEmbeddingCitations} citations` : ''}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm leading-relaxed">
                Gemini Embedding 2 embeds video, audio, image, and text into a single shared
                representation space, so arbitrary interleaved combinations of those modalities can be
                compared directly. Trained with large-scale contrastive learning in a multi-task,
                multi-stage setup, it reaches state-of-the-art results on unimodal, cross-modal, and
                multimodal retrieval benchmarks.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {geminiEmbeddingLinks.map(({ label, href }) => (
                  <Link key={label} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function generateMetadata() {
  return {
    title: 'Research',
    description: 'My research on evaluating machine creativity and multimodal embeddings.',
  }
}
