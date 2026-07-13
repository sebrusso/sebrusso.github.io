import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { getCitationCount } from '../../lib/citations'

const LITBENCH_ARXIV_ID = '2507.00769'

const litbenchLinks = [
  { label: 'arXiv', href: 'https://arxiv.org/abs/2507.00769' },
  { label: 'ACL Anthology', href: 'https://aclanthology.org/2026.eacl-long.362/' },
  { label: 'HuggingFace', href: 'https://huggingface.co/SAA-Lab' },
  { label: 'Arena', href: 'https://litbench.vercel.app' },
  { label: 'GitHub', href: 'https://github.com/drfein/LitBench' },
]

export default async function ResearchPage() {
  const citationCount = await getCitationCount(LITBENCH_ARXIV_ID)

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
                {citationCount ? ` · ${citationCount} citations` : ''}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                Daniel Fein, Sebastian Russo, Violet Xiang, Kabir Jolly, Rafael Rafailov, Nick Haber
              </p>
              <p className="text-sm leading-relaxed">
                How do you evaluate whether one story is better than another? LitBench is a benchmark
                for exactly that: 2,480 human-labeled story comparisons plus a training corpus of
                ~43,000 preference pairs. We benchmarked LLMs as zero-shot judges of creative writing
                and trained dedicated reward models — the trained models reach 78% agreement with
                human preferences, beating the best off-the-shelf judge (73%), and we validated the
                results with human studies on newly generated stories.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {litbenchLinks.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:text-primary/80 underline underline-offset-4"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">lm-as-writing-judge</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm leading-relaxed">
                The precursor to LitBench: a framework for comparing creative writing with language
                models as judges, supporting multiple LLM providers with a pipeline for judging pairs
                of creative responses. Built with Violet Xiang, Daniel Fein, and Kabir Jolly.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link
                  href="https://github.com/sebrusso/lm-as-writing-judge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-primary/80 underline underline-offset-4"
                >
                  GitHub
                </Link>
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
    description: 'My research on evaluating machine creativity.',
  }
}
