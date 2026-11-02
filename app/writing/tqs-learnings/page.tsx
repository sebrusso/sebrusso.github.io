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
import { ArchitectureFigure, PairFigure, ScoreSwarmFigure } from '../../../components/tqs-learnings/figures'
import { ComparisonFigure, GainFigure } from '../../../components/tqs-learnings/results-figures'
import { TLDR } from '../../../components/tqs-learnings/tldr'
import { TableOfContents, type TocSection } from '../../../components/tqs-learnings/toc'
import { FiltrationFigure, InputLengthFigure } from '../../../components/tqs-learnings/data-figures'
import { BaselineFigure } from '../../../components/tqs-learnings/baseline-figure'
import './tqs.css'

/**
 * /writing/tqs-learnings — a TSX essay rather than a markdown post, because it
 * needs collapsible diagrams that react-markdown can't render. Listed in the
 * writing index via PAGE_POSTS (lib/posts.ts). Static route, so it takes
 * precedence over /writing/[id]; [id]'s generateStaticParams only covers
 * content/posts/*.md, so the two never collide in the export.
 */

const POST = PAGE_POSTS.find((p) => p.id === 'tqs-learnings')!

const OG_IMAGE = { url: '/images/tqs-learnings-og.png', width: 1200, height: 630, alt: POST.image?.alt ?? POST.title }

export const metadata: Metadata = {
  title: POST.title,
  description: POST.description,
  alternates: { canonical: '/writing/tqs-learnings' },
  openGraph: {
    title: POST.title,
    description: POST.description,
    url: '/writing/tqs-learnings',
    siteName: 'Sebastian Russo',
    type: 'article',
    publishedTime: POST.date,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: POST.title,
    description: POST.description,
    creator: '@sebbrusso',
    images: [OG_IMAGE.url],
  },
}

const linkClass =
  'font-medium text-primary underline decoration-brand decoration-2 underline-offset-4 hover:text-primary/80'

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-3 mt-10 scroll-mt-6 text-xl font-bold">
      {children}
    </h2>
  )
}
function H3({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mb-2 mt-8 scroll-mt-6 text-lg font-semibold">
      {children}
    </h3>
  )
}
function P({ children }: { children: ReactNode }) {
  return <p className="mb-4">{children}</p>
}
function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{children}</code>
}

const OUTLINE: TocSection[] = [
  {
    id: 'the-data',
    title: 'The data',
    children: [{ id: 'which-tasks-verified-dropped', title: 'Which tasks Verified dropped, and why TQS keeps them' }],
  },
  { id: 'what-the-model-reads-and-predicts', title: 'What the model reads and predicts' },
  {
    id: 'reference-points',
    title: 'Three reference points, fixed before training',
    children: [
      { id: 'reviewer-agreement', title: 'Reviewer agreement' },
      { id: 'shallow-feature-baselines', title: 'Shallow-feature baselines' },
      { id: 'what-counts-as-a-real-gain', title: 'What counts as a real gain' },
    ],
  },
  {
    id: 'results',
    title: 'Results',
    children: [
      { id: 'the-model-against-the-baselines', title: 'The model against the baselines' },
      { id: 'are-the-gains-real', title: 'Are the gains real?' },
      { id: 'is-it-just-reading-length', title: 'Is it just reading length?' },
      { id: 'examples', title: 'What the numbers look like on real tasks' },
      { id: 'where-it-fails', title: 'Where it fails: short issues read as vague' },
    ],
  },
  { id: 'discussion', title: 'Discussion' },
  { id: 'limitations-and-next-steps', title: 'Limitations and next steps' },
  { id: 'appendix-input-lengths', title: 'Appendix: input lengths and the token limit' },
  { id: 'appendix-compute-and-cost', title: 'Appendix: compute and cost' },
]

const f = (v: number | null) => (v == null ? '–' : v.toFixed(2))

/** Scored against a single held-out reviewer (the fair comparison); 298 held-out sympy tasks. */
const SINGLE_REVIEWER = [
  { axis: 'Underspecification', agreement: 0.431, big: 0.303, small: 0.169, length: 0.132, surface: 0.123 },
  { axis: 'False negatives', agreement: 0.524, big: 0.404, small: 0.361, length: 0.326, surface: 0.298 },
  { axis: 'Difficulty', agreement: 0.588, big: 0.557, small: 0.598, length: 0.568, surface: 0.601 },
]

export default function TQSLearningsPage() {
  const miss = EXAMPLES[EXAMPLES.length - 1]
  return (
    <article className={`mx-auto py-6 ${PROSE_WIDTH}`}>
      <h1 className="text-balance text-3xl font-bold tracking-tight">{POST.title}</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        <time dateTime={POST.date}>{formatPostDate(POST.date)}</time>
      </p>

      <TLDR />
      <TableOfContents sections={OUTLINE} />

      <div className="text-base leading-relaxed">
        <H2 id="the-data">The data</H2>
        <P>
          The labels come from OpenAI&apos;s release behind SWE-bench Verified: three reviewers rated each of 1,699
          SWE-bench tasks (a GitHub issue, the merged fix and the tests that check it). This essay uses one name for each
          rating:
        </P>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li>
            <b>Underspecification</b> (<Code>underspecified</Code>, 0–3): is the issue clear enough to know what a correct
            fix does?
          </li>
          <li>
            <b>False negatives</b> (<Code>false_negative</Code>, 0–3): would the tests reject a correct fix?
          </li>
          <li>
            <b>Difficulty</b> (0–3): how long an experienced engineer would take, from under 15 minutes to over 4 hours.
          </li>
        </ul>
        <P>
          Each task&apos;s <b>combined label</b> is the maximum of the three reviewers&apos; ratings for underspecification
          and false negatives, and the majority or median for difficulty. <b>Severity</b> is underspecification plus false
          negatives, from 0 to 6.
        </P>

        <H3 id="which-tasks-verified-dropped">Which tasks Verified dropped, and why TQS keeps them</H3>
        <P>
          SWE-bench Verified drops a task if its combined label is 2 or higher for underspecification or false negatives,
          or a reviewer flagged another major problem. TQS keeps all 1,699 tasks, because the dropped ones are its
          examples of bad tasks. Later comments on the issue are excluded from the input, since they can give away the
          fix.
        </P>
        <Collapsible title="From 2,294 SWE-bench tasks to Verified, and to the TQS training set" meta="OpenAI's filter on top; how TQS uses the same 1,699 reviewed tasks below" open>
          <FiltrationFigure />
        </Collapsible>

        <H2 id="what-the-model-reads-and-predicts">What the model reads and predicts</H2>
        <P>
          The model reads one task at a time: the issue, the gold patch (the fix that was merged), the tests, and the
          source files the patch touches, up to a 30,720-token input limit. Tasks over the limit (13%) have their code
          context trimmed; the appendix shows how much.
        </P>
        <Collapsible title="How a task becomes model input" meta="Four real tasks, drawn to scale against the 30,720-token input limit" open>
          <InputBudgetDiagram />
        </Collapsible>
        <P>
          The model is Qwen3-8B, frozen, with LoRA adapters (r=16) on its attention and MLP layers, so 43.7M parameters
          (about 0.5%) train. Its last hidden state feeds four small heads:
        </P>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            <b>Three rating heads</b>, one per rating. Each is a CORAL ordinal head that predicts the probability the
            rating is above 0, above 1 and above 2. Their sum is the <b>expected rating</b>, between 0 and 3, which is the
            prediction shown throughout.
          </li>
          <li>
            <b>A quality-score head.</b> The <b>quality score</b> is one number per task, where higher means a better task
            to train on. It has no fixed scale and is learned only from comparisons: for every pair of tasks in a batch
            with different severity, the lower-severity task should score higher, and a Bradley–Terry loss penalizes the
            model when it doesn&apos;t. A pipeline can rank, filter or weight tasks by it, and it could serve as a proxy for
            a task&apos;s price: what the task is worth to train on.
          </li>
        </ul>
        <P>
          The training loss is the sum of the three rating losses and the pairwise loss. To compare against
          Verified&apos;s own decision, I also derive a <b>keep/drop score</b> from two of the rating heads: the
          probability that underspecification or false negatives is 2 or higher.
        </P>
        <Collapsible title="How the model is built" meta="Qwen3-8B + LoRA, three rating heads and a quality-score head" open wide>
          <ArchitectureFigure />
        </Collapsible>
        <Collapsible title="What the pairwise loss sees" meta="One real pair of tasks and the quality scores the model gives them" open wide>
          <PairFigure />
        </Collapsible>

        <H2 id="reference-points">Three reference points, fixed before training</H2>
        <P>
          Every result below is read against three things I measured first: how well reviewers agree with each other,
          how far shallow features get, and how large a gain has to be before it counts.
        </P>

        <H3 id="reviewer-agreement">Reviewer agreement</H3>
        <P>
          Reviewers often disagree; one task in the examples below got 1, 3 and 1. To measure agreement, I hold out one
          reviewer and correlate their ratings with the mean of the other two (Spearman ρ, a rank correlation from −1 to
          1), averaged over 50 random draws on the 298 test tasks: 0.43 for underspecification, 0.52 for false negatives
          and 0.59 for difficulty.
        </P>
        <P>
          A model compared to that number has to be scored the same way, against one held-out reviewer. Scored against
          the combined label instead, it faces less noise than any single reviewer and can look better than people when
          it isn&apos;t. So I report both, and the single-reviewer score is the one to compare with reviewer agreement.
        </P>

        <H3 id="shallow-feature-baselines">Shallow-feature baselines</H3>
        <P>
          Two baselines never read the text. The <b>length baseline</b> sees four token counts: issue, gold patch, tests
          and code context. The <b>surface baseline</b> adds 17 counts and flags, such as how many lines and files the
          patch and tests change and whether the issue contains a traceback. Each fits one ordinal logistic regression per
          rating. Against the combined labels on the test tasks, the surface baseline predicts difficulty at ρ 0.66 and the length baseline at 0.62,
          while neither gets past 0.18 on underspecification. Underspecification is where a model that reads the text has
          to prove itself.
        </P>
        <Collapsible title="What the baselines see, and the room they left" meta="The feature pipeline, then each rating's best baseline against reviewer agreement" open>
          <BaselineFigure />
        </Collapsible>

        <H3 id="what-counts-as-a-real-gain">What counts as a real gain</H3>
        <P>
          With 298 test tasks, scores move by chance. Before the 8B run I compared the two baselines with a paired
          bootstrap and found 95% intervals about ±0.10 wide on underspecification, so smaller differences can&apos;t be
          trusted. A gain counts as real only if its 95% interval excludes zero. That rule mattered right away: the first
          run, Qwen3-0.6B with an 8k-token context, beat the surface baseline on underspecification by 0.06, inside the
          noise.
        </P>

        <H2 id="results">Results</H2>
        <P>
          The main run trains on every repository except sympy (1,260 training and 141 validation tasks) and tests on
          sympy&apos;s 298 tasks, which it never saw. It trained for 3 epochs (237 steps of 16 tasks), keeping the
          checkpoint with the best validation score (step 200).
        </P>

        <H3 id="the-model-against-the-baselines">The model against the baselines</H3>
        <P>
          Qwen3-8B scores highest on every metric except difficulty. Against the combined labels:
        </P>
        <div className="mb-4 overflow-x-auto rounded-lg border">
          <table className="tqs-table w-full min-w-[620px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Combined labels (n = 298)</th>
                <th className="px-3 py-2 text-right font-semibold">Qwen3-8B</th>
                <th className="px-3 py-2 text-right font-semibold">Qwen3-0.6B</th>
                <th className="px-3 py-2 text-right font-semibold">Length</th>
                <th className="px-3 py-2 text-right font-semibold">Surface</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((r) => (
                <tr key={r.metric} className="border-t">
                  <td className="px-3 py-2">{r.metric}</td>
                  <td className={`px-3 py-2 text-right ${r.better ? 'font-semibold' : ''}`}>{f(r.t4)}</td>
                  <td className="px-3 py-2 text-right">{f(r.t1)}</td>
                  <td className="px-3 py-2 text-right">{f(r.length)}</td>
                  <td className="px-3 py-2 text-right">{f(r.surface)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          Keep/drop AUROC measures how well the keep/drop score separates the tasks Verified dropped from the ones it kept
          (0.5 is chance, 1 is perfect). Kendall τ measures how well the quality score orders tasks by severity. Scored
          the fair way, against a single held-out reviewer, the model reaches 70% of reviewer agreement on
          underspecification and 77% on false negatives:
        </P>
        <div className="mb-4 overflow-x-auto rounded-lg border">
          <table className="tqs-table w-full min-w-[620px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Single reviewer (Spearman ρ)</th>
                <th className="px-3 py-2 text-right font-semibold">Reviewer agreement</th>
                <th className="px-3 py-2 text-right font-semibold">Qwen3-8B</th>
                <th className="px-3 py-2 text-right font-semibold">Qwen3-0.6B</th>
                <th className="px-3 py-2 text-right font-semibold">Length</th>
                <th className="px-3 py-2 text-right font-semibold">Surface</th>
              </tr>
            </thead>
            <tbody>
              {SINGLE_REVIEWER.map((r) => (
                <tr key={r.axis} className="border-t">
                  <td className="px-3 py-2">{r.axis}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{f(r.agreement)}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {f(r.big)} <span className="font-normal text-muted-foreground">({Math.round((r.big / r.agreement) * 100)}%)</span>
                  </td>
                  <td className="px-3 py-2 text-right">{f(r.small)}</td>
                  <td className="px-3 py-2 text-right">{f(r.length)}</td>
                  <td className="px-3 py-2 text-right">{f(r.surface)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          On difficulty every predictor comes close to or beats reviewer agreement, and both baselines score higher than the
          model: task size already explains the difficulty labels.
        </P>
        <Collapsible title="8B leads on every metric except difficulty" meta="Both baselines and both models, against the combined labels and against a single reviewer" open wide>
          <ComparisonFigure />
        </Collapsible>

        <H3 id="are-the-gains-real">Are the gains real?</H3>
        <P>
          Each gain below is measured against the better of the two baselines on that metric, with a 95% paired-bootstrap
          interval. The 8B model&apos;s gains are real on four of five: +0.19 on underspecification [+0.07, +0.30], +0.10 on
          false negatives [+0.03, +0.18], +0.07 keep/drop AUROC [+0.01, +0.12] and +0.09 quality-score τ [+0.02, +0.17].
          Difficulty shows no gain. The 0.6B model&apos;s only real gain is a small one on false negatives.
        </P>
        <Collapsible title="Gains over the best baseline: 4 of 5 are real for 8B" meta="Gain over each metric's best baseline, with 95% paired-bootstrap intervals" open wide>
          <GainFigure />
        </Collapsible>

        <H3 id="is-it-just-reading-length">Is it just reading length?</H3>
        <P>
          Longer issues and bigger patches correlate with every rating, so a model could score well by measuring size. To
          check, I removed what the length baseline predicts from both the predictions and the labels, then correlated
          what was left (a partial Spearman correlation). On underspecification the 8B model keeps 0.33 and the surface
          baseline 0.11; on false negatives 0.32 against 0.04. On difficulty the surface baseline keeps more (0.31 against
          0.22). So the model&apos;s advantage on the first two ratings does not come from size.
        </P>
        <P>
          This check controls for the total size of all four parts. The shortcut described under &quot;Where it
          fails&quot; is narrower: it is about the length of the issue alone, so the two findings don&apos;t conflict.
        </P>
        <Collapsible title="The quality score falls as severity rises, then flattens" meta="All 298 held-out tasks by quality score, grouped by summed severity" open wide>
          <ScoreSwarmFigure />
        </Collapsible>

        <H3 id="examples">What the numbers look like on real tasks</H3>
        <P>Three held-out tasks, with each reviewer&apos;s ratings, the combined label and the model&apos;s expected rating:</P>
        <ExampleCollapsibles />

        <H3 id="where-it-fails">Where it fails: short issues read as vague</H3>
        <P>
          The worst misses share a pattern. The task below has a short, clear issue that all three reviewers rated 0 for
          underspecification, and the model predicts 2.0. In the training data, shorter issues get worse labels: the
          median issue is 1,413 characters at label 0 and 804 at label 3, a correlation of −0.14. The model&apos;s
          predictions reproduce that −0.14 exactly. It learned brevity as a sign of vagueness, which a reviewer
          wouldn&apos;t. The correctly flagged underspecified example above is also very short, so some of its correct
          answers may rest on the same shortcut.
        </P>
        <Collapsible title={`${miss.kind}: ${miss.headline}`} meta={<span className="font-mono">{miss.id}</span>}>
          <TaskDiagram ex={miss} />
        </Collapsible>

        <H2 id="discussion">Discussion</H2>
        <p className="mb-2">
          <b>What the model learned:</b>
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            <b>Underspecification: learned, with real headroom left.</b> The clearest gain over shallow features, and not
            explained by size, but at 70% of reviewer agreement.
          </li>
          <li>
            <b>False negatives: learned, a smaller step.</b> A real but modest gain over the best baseline, at 77% of
            reviewer agreement.
          </li>
          <li>
            <b>Difficulty: nothing beyond length.</b> Task size already explains these labels.
          </li>
          <li>
            <b>A shortcut: brevity read as vagueness.</b> Some of its underspecification signal is issue length.
          </li>
        </ul>
        <p className="mb-2">
          <b>What this means for training scorers like this:</b>
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            <b>Bigger and longer-context models seem to help on the ratings that need reading.</b> Moving from Qwen3-0.6B
            at 8k tokens to Qwen3-8B at 32k added 0.13 on underspecification, but size and context changed together, so
            this one comparison can&apos;t say which mattered.
          </li>
          <li>
            <b>There is room before the labels become the limit.</b> The model is at 70–77% of reviewer agreement. Better
            targets, such as training on each reviewer&apos;s rating rather than the maximum, are worth testing alongside
            bigger models.
          </li>
          <li>
            <b>Shortcuts have to be designed out.</b> Control for length (for example with reworded or length-matched
            issues) and report partial correlations next to raw ones.
          </li>
          <li>
            <b>Difficulty needs a different label,</b> such as measured agent solve rates.
          </li>
        </ul>

        <H2 id="limitations-and-next-steps">Limitations and next steps</H2>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            <b>One held-out repository and one training seed.</b> The results are directional, not a final number.
          </li>
          <li>
            <b>The test set was used twice.</b> The 0.6B run was scored on the same sympy tasks before I chose the 8B
            setup.
          </li>
          <li>
            <b>Size and context are confounded,</b> as noted above.
          </li>
          <li>
            <b>Possible contamination.</b> Qwen3 was released after SWE-bench Verified, so it may have seen the tasks, their
            fixes, or even which tasks made it into Verified.
          </li>
          <li>
            <b>Untested downstream.</b> The model learns to agree with these reviewers. Whether filtering by its quality
            score actually improves RL training, and at what cost per task, hasn&apos;t been measured.
          </li>
        </ul>
        <P>
          Next: run the other five leave-repo-out folds with more seeds; ablate the input (no gold patch, issue only);
          test a membership probe for contamination; train on reworded issues so length stops being a shortcut; and
          filter a real RL task pool by quality score to see whether training improves.
        </P>

        <H2 id="appendix-input-lengths">Appendix: input lengths and the token limit</H2>
        <P>
          Before trimming, the median task is about 10.9k tokens, but the tail is long: 224 of the 1,699 tasks (13.2%)
          exceed the 30,720-token input limit.
        </P>
        <Collapsible title="13% of tasks exceed the input limit" meta="All 1,699 tasks by total length, log scale, with the overflow region shaded" open>
          <InputLengthFigure />
        </Collapsible>

        <H2 id="appendix-compute-and-cost">Appendix: compute and cost</H2>
        <P>
          The run used one H100 80GB on RunPod at $3.99 an hour, with $26 of credit. It took 187 minutes at about 3,970
          tokens per second and 48.7 GB peak memory; the whole session cost about $16.
        </P>
        <P>
          It only fit after one fix. The pairwise loss needs two tasks per micro-batch, and padding the shorter one knocked
          PyTorch&apos;s attention kernel (SDPA) off its fast path: 1,754 real tokens per second instead of 4,024 at 32k
          context, which would have cost $20–28. Running each task through the model separately, without padding, and
          computing the pair loss on both outputs before the backward pass gave identical gradients at full speed.
        </P>
        <P>
          Two other lessons: a memory probe reported out-of-memory errors that weren&apos;t real, because it left the
          model in evaluation mode, where gradient checkpointing is off; and every pod started with a hard deadline that
          terminates it, so a hung job couldn&apos;t drain the credit.
        </P>

        <p className="text-sm text-muted-foreground">
          Labels come from OpenAI&apos;s public SWE-bench Verified annotation release; task text from{' '}
          <Code>princeton-nlp/SWE-bench</Code>. Example tasks are quoted verbatim, shortened where marked. Intervals are
          95% paired-bootstrap intervals (2,000 resamples) over the 298 held-out tasks.
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
