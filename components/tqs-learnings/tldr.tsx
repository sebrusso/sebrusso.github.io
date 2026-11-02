import type { ReactNode } from 'react'

const N = ({ children }: { children: ReactNode }) => <span className="font-mono">{children}</span>

const ITEMS: { label: string; body: ReactNode; chips?: string[] }[] = [
  {
    label: 'Motivation',
    body: (
      <>
        A proof of concept: can a model learn task quality from human review labels, so RL pipelines can screen out
        tasks whose tests give the wrong reward before training on them?
      </>
    ),
  },
  {
    label: 'Data',
    body: (
      <>
        <N>1,699</N> SWE-bench tasks, each rated by three human reviewers for SWE-bench Verified. All tasks from one
        repository (sympy, <N>298</N>) are held out for testing.
      </>
    ),
  },
  {
    label: 'Model',
    body: <>Qwen3-8B, fine-tuned with LoRA to predict the reviewers&apos; ratings plus a single quality score.</>,
  },
  {
    label: 'Implication',
    body: (
      <>
        On the held-out repository the model spots underspecified issues about twice as well as shallow features (ρ{' '}
        <N>0.36</N> vs <N>0.17</N>), close to how well reviewers agree with each other, so a learned scorer can
        pre-screen tasks before rollouts are spent. It adds nothing on difficulty, which task length already predicts.
        One repository, one seed: directional.
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
