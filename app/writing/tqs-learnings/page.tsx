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

export const metadata: Metadata = {
  title: POST.title,
  description: POST.description,
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
    children: [
      { id: 'data-filtration-and-preparation', title: 'Data filtration and preparation' },
    ],
  },
  { id: 'input-and-model', title: 'Input and model' },
  {
    id: 'baselines-and-evaluation',
    title: 'Baselines and evaluation',
    children: [
      { id: 'the-human-ceiling', title: 'The human ceiling' },
      { id: 'shallow-feature-baselines', title: 'Shallow-feature baselines' },
      { id: 'the-noise-floor', title: 'The noise floor' },
    ],
  },
  {
    id: 'results',
    title: 'Results',
    children: [
      { id: 'the-model-against-the-baselines', title: 'The model against the baselines' },
      { id: 'discussion', title: 'Discussion' },
      { id: 'significance-and-the-length-check', title: 'Significance and the length check' },
      { id: 'where-it-fails', title: 'Where it fails' },
    ],
  },
  { id: 'limitations-and-next-steps', title: 'Limitations and next steps' },
  { id: 'appendix-input-lengths-and-the-prefill-budget', title: 'Appendix: input lengths and the prefill budget' },
  { id: 'appendix-compute-and-cost', title: 'Appendix: compute and cost' },
]

const f = (v: number | null) => (v == null ? '–' : v.toFixed(2))

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
        <div className="mb-6 rounded-lg border-l-4 border-brand bg-brand-soft/60 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">What TQS does</p>
          <p className="mb-2 text-base">
            RL for coding agents learns from tasks whose tests define the reward, so an underspecified issue or tests
            that reject valid fixes make the reward wrong. TQS (task quality scorer) is a proof of concept: post-train
            Qwen3-8B to predict the quality ratings human reviewers gave each task, plus one quality score a pipeline
            can use to filter or weight tasks before spending rollouts on them.
          </p>
          <p className="text-base">
            <b>What it shows:</b> on a repository it never trained on, the scorer detects underspecified issues and
            unfair tests far better than shallow features do (Spearman ρ 0.36 vs 0.17 on underspecification), so a
            cheap learned pre-screen can catch the defects that corrupt RL reward. It adds nothing on difficulty, which
            task length already predicts.
          </p>
        </div>

        <H2 id="the-data">The data</H2>
        <P>
          The labels are OpenAI&apos;s SWE-bench Verified annotations: three reviewers rated each of 1,699 SWE-bench tasks
          for underspecification (0–3), tests that reject valid fixes (0–3) and difficulty (a time bucket). Reviewers
          agree only moderately (Krippendorff&apos;s α 0.34–0.49), which caps how well any model can match them.
        </P>
        <H3 id="data-filtration-and-preparation">Data filtration and preparation</H3>
        <P>
          Verified keeps a task only if both severity labels (the maximum over the three reviewers) are below 2 and no
          reviewer flagged another major issue. TQS
          keeps all 1,699 tasks, because the filtered ones are the examples of bad tasks it learns from. Later issue
          comments (<Code>hints_text</Code>) are excluded since they can leak the fix.
        </P>

        <Collapsible title="From 2,294 SWE-bench tasks to Verified, and to the TQS training set" meta="OpenAI's filter on top; how TQS uses the same 1,699 reviewed tasks below" open>
          <FiltrationFigure />
        </Collapsible>

        <H2 id="input-and-model">Input and model</H2>
        <P>
          Each task is serialized as the issue, gold patch, tests and the source files the patch touches, within 30,720
          Qwen3 tokens; 13% of tasks overflow and have their code context trimmed (see the appendix).
        </P>

        <Collapsible title="How a task becomes model input" meta="Four real tasks, drawn to scale against the 30,720-token budget" open>
          <InputBudgetDiagram />
        </Collapsible>

        <P>
          The model is Qwen3-8B, frozen in bf16, with LoRA (r=16, α=32) on all attention and MLP projections: 43.7M
          trainable parameters, about 0.5%. Three CORAL ordinal heads predict the ratings and a scalar price head is
          trained with an in-batch Bradley–Terry loss on severity; the loss is their sum.
        </P>

        <Collapsible title="How the model is built" meta="Qwen3-8B + LoRA, final-token pooling, three CORAL heads and a price head" open wide>
          <ArchitectureFigure />
        </Collapsible>

        <Collapsible title="What the pairwise loss sees" meta="One real pair of tasks and the price scores the model gives them" open wide>
          <PairFigure />
        </Collapsible>

        <P>Four tasks from the held-out sympy fold, with the annotator labels and the trained model&apos;s predictions:</P>
        <ExampleCollapsibles />

        <H2 id="baselines-and-evaluation">Baselines and evaluation</H2>
        <P>
          Before training, I fixed three reference points that every result is read against: how well the human
          reviewers agree with each other, how far shallow features get, and how much a score can move by chance.
        </P>

        <H3 id="the-human-ceiling">The human ceiling</H3>
        <P>
          The labels are noisy: on the underspecified task above, the three reviewers gave 1, 3 and 1. So before
          training anything I measured how well reviewers agree with each other, by holding one out and correlating
          their ratings with the mean of the other two. That human ceiling is Spearman ρ 0.41 for underspecification,
          0.50 for tests that reject valid fixes and 0.56 for difficulty. It changes how to read every result below:
        </P>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            <b>It sets the scale.</b> A model can&apos;t be expected to match the labels much better than the reviewers
            match each other, so the 8B model&apos;s 0.36 on underspecification is close to the limit, not weak.
          </li>
          <li>
            <b>It sets a fair comparison.</b> The released labels combine three reviewers, so they are cleaner than any
            one reviewer&apos;s view, and a model scored against them can look better than humans when it isn&apos;t.
            I also score the model against a single held-out reviewer, the same way the ceiling is measured. That is
            where the &quot;70% of human agreement&quot; figure comes from.
          </li>
        </ul>

        <H3 id="shallow-feature-baselines">Shallow-feature baselines</H3>
        <P>
          I fit two ordinal-logistic baselines on hand-built features (below). Length alone
          predicts difficulty better than reviewers agree with each other (ρ 0.66 vs 0.56), while shallow features barely
          detect underspecification (0.17). So underspecification is where a model that reads the text has to prove
          itself.
        </P>

        <Collapsible title="What the baselines see, and the room they left" meta="Feature pipeline, then the best baseline per axis against the human ceiling" open>
          <BaselineFigure />
        </Collapsible>

        <H3 id="the-noise-floor">The noise floor</H3>
        <P>
          One held-out repository gives 298 test tasks. Before the 8B run, I estimated the noise floor with a paired
          bootstrap of surface against length on those tasks. The 95% interval half-width was about ±0.10 on
          underspecified Spearman, so smaller gains are noise.
        </P>
        <P>
          This mattered for the first run. The first run, Qwen3-0.6B with context cut to 8k tokens, beat surface on
          underspecified by 0.06. With the threshold already written down, that was clearly inside the noise.
        </P>

        <H2 id="results">Results</H2>
        <P>
          The main run trains on the leave-repo-out fold that holds out sympy: 1,260 training and 141 validation tasks
          from the other repositories, and sympy&apos;s 298 tasks as test. It trained for 3 epochs (237 AdamW steps, 16
          tasks per step), with the best checkpoint at step 200 by validation mean Spearman.
        </P>

        <H3 id="the-model-against-the-baselines">The model against the baselines</H3>
        <Collapsible title="Scores on the held-out tasks" meta="Both baselines and both models on every metric, with the human ceiling" open wide>
          <ComparisonFigure />
        </Collapsible>
        <Collapsible title="Which gains are real" meta="Gain over the surface baseline with 95% paired-bootstrap intervals" open wide>
          <GainFigure />
        </Collapsible>

        <H3 id="discussion">Discussion</H3>
        <P>
          <b>What the model learned.</b> Two signals that shallow features cannot see. First, whether an issue pins down
          the intended behavior: on underspecification it reaches ρ 0.36, close to the 0.41 at which reviewers agree with
          each other (70% of single-reviewer agreement), and 0.33 of it survives removing everything input length
          predicts, against 0.11 for shallow features. Second, whether the tests would reject valid fixes: ρ 0.48 against
          a 0.50 ceiling (77% of single-reviewer agreement), with 0.32 surviving the length control against 0.04. It
          learned nothing new about difficulty: its 0.62 ties the length baseline, and after the length control it keeps
          less than shallow features do (0.22 vs 0.31). It also picked up one shortcut, reading shorter issues as more
          underspecified, the same −0.14 correlation between issue length and label that exists in the training data.
        </P>
        <P>
          <b>What this means for training scorers like this.</b> Model scale and context matter on the axes that need
          reading: going from Qwen3-0.6B at 8k tokens to Qwen3-8B at 32k added 0.125 on underspecification and 0.058 on
          false negatives. On false negatives the model is already within 0.02 of reviewer agreement, so the labels, not
          the model, are now the limit: further gains need cleaner targets, such as more reviewers per task or training
          on per-reviewer labels instead of their maximum. Shortcuts have to be designed out rather than hoped away: length
          explains difficulty and brevity leaks into underspecification, so future runs should control for length (for
          example with reworded or length-matched issues) and report partial correlations next to raw ones. Difficulty
          needs a different label altogether, such as measured agent solve rates.
        </P>

        <div className="mb-4 overflow-x-auto rounded-lg border">
          <table className="tqs-table w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Held-out sympy tasks (n = 298)</th>
                <th className="px-3 py-2 text-right font-semibold">Qwen3-8B</th>
                <th className="px-3 py-2 text-right font-semibold">Qwen3-0.6B</th>
                <th className="px-3 py-2 text-right font-semibold">Length</th>
                <th className="px-3 py-2 text-right font-semibold">Surface</th>
                <th className="px-3 py-2 text-right font-semibold">Human ceiling</th>
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
                  <td className="px-3 py-2 text-right text-muted-foreground">{f(r.ceiling)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <H3 id="significance-and-the-length-check">Significance and the length check</H3>
        <P>
          On underspecified the 8B model reaches ρ = 0.36 against 0.17 for surface. The paired-bootstrap difference is
          +0.185 [+0.071, +0.298]: the interval excludes zero and the estimate is larger than the ±0.10 noise floor.
          Against single held-out annotators it reaches 70% of the
          human ceiling on that axis, where surface reaches 29%. It also beats surface on false_negative (+0.139), filter
          AUROC (+0.073) and price Kendall τ (+0.129), all with intervals that exclude zero. Difficulty is a tie (−0.032
          [−0.078, +0.010]).
        </P>
        <P>
          To check it wasn&apos;t reading length, I computed partial Spearman correlations controlling for the length
          baseline&apos;s out-of-fold prediction. On underspecified the 8B model keeps 0.33 and surface 0.11. On
          false_negative it keeps 0.32 and surface 0.04. On difficulty surface keeps more (0.31 against 0.22), which fits
          the baseline result above.
        </P>


        <Collapsible title="Every held-out task, by price score" meta="298 sympy tasks, grouped by annotated severity (underspecified + false_negative)" open wide>
          <ScoreSwarmFigure />
        </Collapsible>

        <H3 id="where-it-fails">Where it fails</H3>
        <P>
          The worst misses share a pattern. The task below has a short, clear issue that all three annotators rated 0 on
          underspecified, and the model predicts 2.0. In training, the median issue is 804 characters for label 3 and
          1,413 for label 0, a Spearman ρ of −0.14 between issue length and label, and the model&apos;s predictions show
          the same −0.14. It learned brevity as a proxy for vagueness. An annotator separates terse from vague; this
          model doesn&apos;t yet.
        </P>
        <Collapsible title={`${miss.kind}: ${miss.headline}`} meta={<span className="font-mono">{miss.id}</span>}>
          <TaskDiagram ex={miss} />
        </Collapsible>

        <H2 id="limitations-and-next-steps">Limitations and next steps</H2>
        <P>
          This is one held-out repository and one seed, so it is directional evidence, not a final number. The model also
          learns to agree with these annotators, which is not the same as predicting whether a task is learnable under
          RL. Next I want to run the other five leave-repo-out folds with more seeds, ablate the input (no gold patch,
          issue only), and run a membership probe for pretraining contamination, since Qwen3 may have seen SWE-bench.
          The terse-issue failure also suggests training on reworded issues, so length stops being a shortcut.
        </P>
        <H2 id="appendix-input-lengths-and-the-prefill-budget">Appendix: input lengths and the prefill budget</H2>
        <P>
          Each task is serialized before truncation as issue + gold patch + tests + code context. Most fit easily: the
          median is about 10.9k tokens. The tail is long, though, and 224 of the 1,699 tasks (13.2%) exceed the
          30,720-token budget. All of them are brought under it by trimming code context, almost always only to
          ±200-line windows around the changed hunks.
        </P>
        <Collapsible title="Distribution of input lengths" meta="All 1,699 tasks, log scale, with the overflow region shaded" open>
          <InputLengthFigure />
        </Collapsible>

        <H2 id="appendix-compute-and-cost">Appendix: compute and cost</H2>
        <P>
          The budget was $26 of RunPod credit, and an on-demand H100 80GB cost $3.99 an hour, so everything had to fit
          in about six GPU-hours. A throughput probe showed the 8B run wouldn&apos;t. The pairwise loss needs at least two
          tasks per micro-batch, and padding the shorter one pushed PyTorch SDPA off its fast path: 1,754 real tokens/s
          instead of 4,024 at 32k context, 2.3× slower. At that rate the 8B run would have cost $20–28, more than the
          credit left. Forwarding each task unpadded and combining the two outputs before the backward pass gave the same
          gradients at full speed. The run
          took 187 minutes at about 3,970 tokens/s and 48.7 GB peak memory, and the whole session cost about $16.
        </P>
        <P>
          The memory probe also reported out-of-memory errors that weren&apos;t real: it left the model in eval mode,
          where Hugging Face turns gradient checkpointing off. Every pod also started with a hard deadline that terminates it,
          so a hung job couldn&apos;t drain the credit overnight.
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
