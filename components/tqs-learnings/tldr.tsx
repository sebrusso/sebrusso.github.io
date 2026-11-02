import type { ReactNode } from 'react'

const N = ({ children }: { children: ReactNode }) => <span className="font-mono">{children}</span>

const ITEMS: { label: string; body: ReactNode; chips?: string[] }[] = [
  {
    label: 'Motivation',
    body: (
      <>
        RL for coding agents rewards a policy for passing a task&apos;s tests, so an underspecified issue or tests that
        reject valid fixes make the reward wrong. Human review catches this but takes hours per task and does not scale to
        the <N>10⁵+</N> tasks RL pipelines generate.
      </>
    ),
  },
  {
    label: 'Data',
    body: (
      <>
        OpenAI&apos;s SWE-bench Verified release rates <N>1,699</N> SWE-bench tasks, each by <N>3</N> of <N>93</N>{' '}
        professional developers, for underspecification (<N>0–3</N>), false negatives (<N>0–3</N>) and difficulty. A task
        is filtered if either rating is <N>≥ 2</N> or another major issue is flagged. I train on <N>1,260</N> tasks from
        the other repos and validate on <N>141</N>.
      </>
    ),
  },
  {
    label: 'Model & objective',
    body: (
      <>
        Qwen3-8B with LoRA <N>r=16</N> and last-token pooling feeds three CORAL ordinal heads trained with BCE, plus a
        scalar price head trained with an in-batch Bradley–Terry loss on severity. The total loss is their sum. The split
        is leave-repo-out, with all sympy tasks held out.
      </>
    ),
  },
  {
    label: 'Results',
    body: (
      <>
        On <N>298</N> held-out sympy tasks, underspecification Spearman ρ is <N>0.36</N> vs <N>0.17</N> for a
        shallow-feature baseline (<N>+0.19</N>, 95% CI <N>[+0.07, +0.30]</N>). Filter AUROC is <N>0.77</N> vs{' '}
        <N>0.70</N>, and price Kendall τ is <N>0.35</N> vs <N>0.23</N>. Scored against single annotators, the model
        reaches <N>70%</N> of human agreement on underspecification. Difficulty is a tie, because length alone explains it.
      </>
    ),
    chips: ['ρ 0.36 vs 0.17', 'AUROC 0.77 vs 0.70', '70% of human agreement'],
  },
  {
    label: 'Implication',
    body: (
      <>
        A LoRA on an 8B model, trained in about three hours on one H100, recovers much of the human review signal on the
        hardest axis, and the price score gives one number for filtering or weighting RL tasks. This is one fold and one
        seed, so the evidence is directional.
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
