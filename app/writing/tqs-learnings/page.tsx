import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { formatPostDate } from '../../../lib/dates'
import { PROSE_WIDTH } from '../../../lib/constants'
import { PAGE_POSTS } from '../../../lib/posts'
import {
  Collapsible,
  ExampleCollapsibles,
  InputBudgetDiagram,
  TaskDiagram,
} from '../../../components/tqs-learnings/diagrams'
import { EXAMPLES, RESULTS } from '../../../lib/tqs-learnings'
import './tqs.css'

/**
 * /writing/tqs-learnings — a TSX essay rather than a markdown post, because it
 * needs collapsible diagrams that react-markdown can't render. Listed in the
 * writing index via PAGE_POSTS (lib/posts.ts). Static route, so it takes
 * precedence over /writing/[id]; [id]'s generateStaticParams only covers
 * content/posts/*.md, so the two never collide in the export.
 */

const POST = PAGE_POSTS.find((p) => p.id === 'tqs-learnings')!

export const metadata: Metadata = {
  title: POST.title,
  description: POST.description,
}

const linkClass =
  'font-medium text-primary underline decoration-brand decoration-2 underline-offset-4 hover:text-primary/80'

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 mt-10 text-xl font-bold">{children}</h2>
}
function P({ children }: { children: ReactNode }) {
  return <p className="mb-4">{children}</p>
}
function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{children}</code>
}

const f = (v: number | null) => (v == null ? '–' : v.toFixed(2))

export default function TQSLearningsPage() {
  const miss = EXAMPLES[EXAMPLES.length - 1]
  return (
    <article className={`mx-auto py-6 ${PROSE_WIDTH}`}>
      <h1 className="text-balance text-3xl font-bold tracking-tight">{POST.title}</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        <time dateTime={POST.date}>{formatPostDate(POST.date)}</time>
      </p>

      <div className="text-base leading-relaxed">
        <P>
          Reinforcement learning for coding agents runs on tasks: an issue, a repository, and tests that decide whether a
          fix worked. When the issue is too vague to act on, or the tests reject a correct fix, the agent is punished for
          doing the right thing and the compute spent on that task is wasted. SWE-bench Verified exists because a
          careful human review of 1,699 SWE-bench tasks found this problem was common.
        </P>
        <P>
          Human review does not scale to the next hundred thousand tasks. So I tried to train a model to do the review:
          read a task the way an annotator does and predict the ratings they would give. I call it TQS, for task quality
          scorer. This is what I learned building it on a $26 GPU budget.
        </P>

        <H2>The data</H2>
        <P>
          Each training example is one SWE-bench task paired with the ratings from that review. Three annotators rated
          every task on three scales from 0 to 3: how underspecified the issue is, how likely the tests are to reject a
          valid fix, and how long a good engineer would take. Tasks scoring 2 or more on either of the first two, or
          flagged for some other serious problem, were dropped from Verified.
        </P>
        <P>
          The model reads four things: the issue, the fix that was actually merged (the gold patch), the tests, and the
          source files the fix touches. Everything has to fit in 30,720 tokens.
        </P>

        <Collapsible title="How a task becomes model input" meta="Four real tasks, drawn to scale" open>
          <InputBudgetDiagram />
        </Collapsible>

        <P>Here are four tasks from the held-out set, with what annotators said and what the trained model predicted.</P>
        <ExampleCollapsibles />

        <H2>1. Humans disagree, so measure the ceiling first</H2>
        <P>
          On the underspecified task above, the three annotators gave 1, 3 and 1. The released label takes the maximum,
          so it is a 3. Disagreement like that is normal. When I held out one annotator and correlated them with the
          average of the other two, the Spearman correlation was 0.41 for underspecification, 0.50 for test problems and
          0.56 for difficulty.
        </P>
        <P>
          Those numbers set the ceiling. A model that reaches ρ = 0.35 on underspecification sounds weak until you know
          that a trained human only reaches 0.41 against their peers. I also learned to score the model the same way the
          ceiling is computed, against a single held-out annotator. Otherwise the model is graded against a cleaner
          three-person average than any human faces, and it can appear to beat people when it doesn&apos;t.
        </P>

        <H2>2. Run the dumb baselines before the smart model</H2>
        <P>
          Before training anything, I fit two simple baselines. One sees only four numbers: the token lengths of the
          issue, patch, tests and context. The other adds 17 shallow features like test counts and whether the issue
          has a traceback.
        </P>
        <P>
          The length-only baseline predicts difficulty with ρ = 0.66, higher than humans agree with each other.
          Annotators estimated difficulty largely from the size of the gold patch, so a model can match them by
          counting lines. Underspecification is the opposite: shallow features reach only 0.17. That made it the axis
          where a model reading the text has something to prove, and it kept me from celebrating a good difficulty
          score that measured nothing.
        </P>

        <H2>3. Decide what counts as a win before you look</H2>
        <P>
          One held-out repository gives 298 test tasks. Before running the big model, I compared the two baselines to
          each other on those tasks with a paired bootstrap, to see how much the scores move by chance. The answer was
          about ±0.10 for underspecification. Any gain smaller than that is noise.
        </P>
        <P>
          This mattered almost immediately. A small 0.6B model beat the baseline on underspecification by 0.06, which
          looked like progress. With the threshold already written down, it was easy to see it wasn&apos;t enough.
        </P>

        <H2>4. The 8B model learned something shallow features can&apos;t</H2>
        <P>
          The real run used Qwen3-8B with LoRA adapters and 32k tokens of context, trained on every repository except
          sympy and tested on sympy&apos;s 298 tasks.
        </P>
        <div className="mb-4 overflow-x-auto rounded-lg border">
          <table className="tqs-table w-full min-w-[560px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Held-out sympy tasks</th>
                <th className="px-3 py-2 text-right font-semibold">8B model</th>
                <th className="px-3 py-2 text-right font-semibold">0.6B model</th>
                <th className="px-3 py-2 text-right font-semibold">Shallow features</th>
                <th className="px-3 py-2 text-right font-semibold">Humans</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((r) => (
                <tr key={r.metric} className="border-t">
                  <td className="px-3 py-2">{r.metric}</td>
                  <td className={`px-3 py-2 text-right ${r.better ? 'font-semibold' : ''}`}>{f(r.t4)}</td>
                  <td className="px-3 py-2 text-right">{f(r.t1)}</td>
                  <td className="px-3 py-2 text-right">{f(r.surface)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{f(r.ceiling)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          On underspecification it doubles the shallow baseline, 0.36 against 0.17, and the gain clears the ±0.10 bar.
          Scored against single annotators, it reaches 70% of human agreement on that axis; the baseline reaches 29%.
          It also wins on test problems, on predicting which tasks Verified dropped, and on a single quality score that
          could rank tasks for training.
        </P>
        <P>
          To check it wasn&apos;t just measuring length, I removed everything the length baseline predicts and
          correlated what was left. On test problems the shallow baseline keeps almost nothing (0.04); the 8B model
          keeps 0.32. Difficulty stays a tie, which matches lesson 2.
        </P>

        <H2>5. It fails in a way you can name</H2>
        <P>
          The model&apos;s worst mistakes have a pattern. The task below has a short, clear issue that all three
          annotators rated 0, and the model predicts 2.0. In training, issues rated 3 for underspecification have a
          median of 804 characters against 1,413 for issues rated 0, and the model learned that brevity alone is a
          warning sign. A reviewer would see the difference between terse and vague; this model doesn&apos;t yet.
        </P>
        <Collapsible title={`${miss.kind}: ${miss.headline}`} meta={<span className="font-mono">{miss.id}</span>}>
          <TaskDiagram ex={miss} />
        </Collapsible>

        <H2>6. Most of the work was making it cheap enough to run</H2>
        <P>
          I had $26 of GPU credit. At $4 an hour for an H100, the first estimate for the 8B run didn&apos;t fit.
          Measuring before training showed why: the loss compares pairs of tasks, so tasks went through the model two
          at a time, and padding the shorter one forced the attention kernel onto a path 2.3 times slower. Running
          each task alone and combining the two results before the backward pass gave the same gradients at full speed.
          The run took 187 minutes and the whole session about $16.
        </P>
        <P>
          A memory probe also failed with out-of-memory errors that weren&apos;t real: the probe left the model in
          evaluation mode, where gradient checkpointing switches off. I also set up kill timers on the machine before
          starting anything long, so a hung job couldn&apos;t drain the credit overnight.
        </P>

        <H2>7. The bugs that matter are the quiet ones</H2>
        <P>
          Two bugs would have changed results without raising an error. The first was in a baseline that always
          predicts the most common label. It can&apos;t rank anything, but its first report showed a correlation of
          −0.118, because each test fold&apos;s constant was slightly different and pooling the folds created ranks out
          of nothing. The second was a config override: <Code>lr=2e-4</Code> is read by YAML as the text
          &quot;2e-4&quot;, not a number, which would have broken every learning-rate sweep. Both were found by tests
          written to check behavior that seemed too obvious to test.
        </P>

        <H2>What&apos;s next</H2>
        <P>
          This is one held-out repository and one training seed, so it shows a real signal rather than a final number.
          Next I want to run the other five repository splits with more seeds, test what each part of the input
          contributes (does the model need the gold patch?), and check whether the model saw these tasks during
          pretraining. The terse-issue failure also suggests training on reworded issues, so length stops being a
          shortcut.
        </P>
        <p className="text-sm text-muted-foreground">
          Labels come from OpenAI&apos;s public SWE-bench Verified annotation release. Example tasks are quoted
          verbatim, shortened where marked. Intervals are 95% paired-bootstrap intervals over the 298 held-out tasks.
        </p>
      </div>

      <p className="mt-10 border-t pt-6 text-sm">
        <Link href="/writing" className={linkClass}>
          ← All essays
        </Link>
      </p>
    </article>
  )
}
