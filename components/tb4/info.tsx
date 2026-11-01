'use client'

import { type Index, type PerTask } from '../../lib/tb4/data'

/**
 * Definitions for the table's columns, written to match exactly how
 * scripts/tb4/build_data.py and the results file compute each value.
 */
export function Info({ index, per }: { index: Index; per: PerTask | null }) {
  const repoAt = `${index.repo}/tree/${index.tag}`
  const configs = per?.configs.length ?? 0
  const sample = per ? Object.values(per.results)[0] : undefined
  const trialsPerConfig = sample ? (Object.values(sample)[0]?.trials ?? 0) : 0
  const trialsPerTask = configs * trialsPerConfig

  const terms: { term: string; def: React.ReactNode }[] = [
    {
      term: 'Task',
      def: (
        <>
          The task&apos;s folder name under <Code>tasks/</Code> in the Terminal-Bench repo at {index.tag}. Each task has an
          instruction, a Docker environment, tests and a reference solution.
        </>
      ),
    },
    {
      term: 'Category',
      def: (
        <>
          The field the task belongs to, then its subcategory after the slash (e.g. Security / AppSec). Both come from the
          task author&apos;s <Code>task.toml</Code>.
        </>
      ),
    },
    {
      term: 'Expert time',
      def: (
        <>
          The author&apos;s estimate of how long a domain expert would need to complete the task by hand, from{' '}
          <Code>expert_time_estimate_hours</Code> in <Code>task.toml</Code>. It&apos;s an estimate, not a measured time. The
          bar uses a log scale from 30 minutes to 60 hours.
        </>
      ),
    },
    {
      term: 'Instruction',
      def: (
        <>
          The length of the prompt the agent receives, in words: <Code>instruction.md</Code> split on whitespace, not counting
          the benchmark&apos;s canary comment. Code snippets in the instruction count too.
        </>
      ),
    },
    {
      term: 'Tests',
      def: (
        <>
          The number of test functions in the task&apos;s verifier: functions named <Code>test_…</Code> in Python files under{' '}
          <Code>tests/</Code>. A parametrized test counts once, and tasks whose verifier isn&apos;t written that way show —.
          More tests doesn&apos;t mean a harder task; some verifiers put many checks in one test.
        </>
      ),
    },
    {
      term: 'Solve rate',
      def: per ? (
        <>
          The share of all leaderboard attempts that passed the task: passed trials ÷ total trials, pooled across every
          configuration on the official leaderboard ({configs} model, agent and effort setups × {trialsPerConfig} trials ={' '}
          {trialsPerTask} attempts per task). A trial passes when the verifier gives it full reward; rewards are 0 or 1.
          Source: the{' '}
          <a href={per.source_url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
            Harbor Hub leaderboard
          </a>
          , retrieved {per.retrieved_at}. 0% means no configuration solved it in any trial.
        </>
      ) : (
        'The share of leaderboard attempts that passed the task. Shown when per-trial results are available.'
      ),
    },
    {
      term: 'Author',
      def: (
        <>
          Who wrote the task, from <Code>task.toml</Code>. &ldquo;+2&rdquo; means two more co-authors; hover the name to see
          them all.
        </>
      ),
    },
  ]

  return (
    <section aria-labelledby="tb4-info-h" className="flex max-w-[760px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id="tb4-info-h" className="text-lg font-semibold">
          What the columns mean
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Task data comes from{' '}
          <a href={repoAt} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
            harbor-framework/terminal-bench@{index.tag}
          </a>{' '}
          ({index.commit.slice(0, 7)}); results come from the public leaderboard. Click any column header in the table to sort
          by it.
        </p>
      </div>
      <dl className="divide-y divide-border rounded-xl border border-border bg-card">
        {terms.map((t) => (
          <div key={t.term} className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
            <dt className="font-medium">{t.term}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{t.def}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm leading-relaxed text-muted-foreground">
        In the Landscape view, each dot is a task placed by expert time (across, log scale) and instruction length (up). Tasks
        with the same estimate are nudged sideways so their dots don&apos;t overlap.
      </p>
    </section>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="tb4-mono rounded bg-muted px-1 py-0.5 text-[0.85em] text-foreground">{children}</code>
}
