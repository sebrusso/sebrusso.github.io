import type { ReactNode } from 'react'

const N = ({ children }: { children: ReactNode }) => <span className="font-mono">{children}</span>

const ITEMS: { label: string; body: ReactNode; chips?: string[] }[] = [
  {
    label: 'Motivation',
    body: (
      <>
        RL for coding agents is rewarded by a task&apos;s tests, so a vague issue or tests that reject a correct fix give
        the wrong reward. TQS (task quality scorer) is a proof of concept: can a model learn task quality from human
        review labels, so a pipeline can screen tasks before training on them?
      </>
    ),
  },
  {
    label: 'Data',
    body: (
      <>
        <N>1,699</N> SWE-bench tasks that OpenAI had three reviewers rate when building SWE-bench Verified. All{' '}
        <N>298</N> tasks from one repository (sympy) are held out for testing.
      </>
    ),
  },
  {
    label: 'Model',
    body: <>Qwen3-8B, fine-tuned with LoRA to predict the reviewers&apos; ratings plus one quality score per task.</>,
  },
  {
    label: 'Implication',
    body: (
      <>
        On the held-out repository the model spots vague issues and tests that reject correct fixes clearly better than
        shallow features, reaching <N>70–77%</N> of the agreement between reviewers. A learned scorer could pre-screen
        tasks before rollouts are spent, though whether that improves RL training is untested. It adds nothing on
        difficulty, which task length already predicts. One repository, one seed: directional.
      </>
    ),
  },
]

export function TLDR() {
  return (
    <aside aria-label="TL;DR" className="my-8 rounded-lg border bg-card px-4 py-4 sm:px-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">TL;DR</p>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm leading-relaxed sm:grid-cols-[8.5rem_minmax(0,1fr)]">
        {ITEMS.map((item) => (
          <div key={item.label} className="contents">
            <dt className="pt-[3px] text-xs uppercase tracking-wider text-muted-foreground">{item.label}</dt>
            <dd className="-mt-2 min-w-0 sm:mt-0">
              {item.body}
              {item.chips && (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {item.chips.map((c) => (
                    <span key={c} className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs">
                      {c}
                    </span>
                  ))}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
