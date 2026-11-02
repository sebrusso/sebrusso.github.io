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
import { TLDR } from '../../../components/tqs-learnings/tldr'
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

      <TLDR />

      <div className="text-base leading-relaxed">
        <P>
          RL for coding agents rewards a policy when a task&apos;s FAIL_TO_PASS tests pass and its PASS_TO_PASS tests
          still do. Two task defects corrupt that reward: an issue too underspecified to pin down the intended behavior,
          and FAIL_TO_PASS tests with false negatives, which reject valid fixes. Both penalize correct behavior and waste
          the rollouts spent on the task. Human review catches them, but it costs hours per task and does not scale to
          the 10<sup>5</sup>+ mined or synthetic tasks that RL pipelines now generate.
        </P>
        <P>
          TQS (task quality scorer) is a model that predicts the SWE-bench Verified review labels from the task alone,
          so a pipeline can filter or weight tasks before training on them. I post-trained Qwen3-8B for it on a $26 GPU
          budget. These are the notes.
        </P>

        <H2>Where the labels come from</H2>
        <P>
          In August 2024 OpenAI released SWE-bench Verified along with the annotations it was built from. They sampled
          1,699 tasks from the SWE-bench test set (2,294 tasks from 12 Python repositories), and 93 professional software
          developers reviewed them, three per task: 5,097 annotations, 2 to 178 tasks per annotator (median 45). Each
          annotation has four fields, each with free-text notes:
        </P>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li>
            <Code>underspecified</Code>, 0–3: is the issue specified well enough to know what a correct fix does?
          </li>
          <li>
            <Code>false_negative</Code>, 0–3: would the tests reject valid solutions?
          </li>
          <li>
            <Code>difficulty</Code>, a time bucket: &lt;15 min, 15 min–1 h, 1–4 h, &gt;4 h.
          </li>
          <li>
            <Code>other_major_issues</Code>, binary.
          </li>
        </ul>
        <P>
          For the two severity axes the released label is the maximum over the three annotators; difficulty uses a
          majority/median rule. A task is filtered out if <Code>underspecified ≥ 2</Code>, <Code>false_negative ≥ 2</Code>,
          or <Code>other_major_issues</Code> is set. That removes 1,160 of the 1,699 tasks (68%) and leaves 539, and all
          500 tasks in SWE-bench Verified come from those 539. The labels are noisy. Krippendorff&apos;s α is 0.34 for
          underspecified, 0.42 for false_negative and 0.49 for difficulty, and a single random annotator flags 45% of
          tasks where the max-ensemble flags 68%.
        </P>
        <P>
          I use all 1,699 annotated tasks, kept or filtered, as supervised examples: task text in, three labels out. The
          task text comes from <Code>princeton-nlp/SWE-bench</Code> at a pinned revision. I exclude{' '}
          <Code>hints_text</Code> (later issue comments) because it can leak the fix. I don&apos;t train on{' '}
          <Code>other_major_issues</Code> (α 0.09); it only enters the filter target.
        </P>

        <H2>Input and model</H2>
        <P>
          Each task is serialized from four parts: the issue, the gold patch, the test patch with the FAIL_TO_PASS and
          PASS_TO_PASS test names, and the files the gold patch touches, read at the base commit. The budget is 30,720
          tokens under the Qwen3 tokenizer. On overflow, code context is cut first (whole files, then ±200/100/50/20-line
          windows around the hunks, then a tail cut), followed by the tests, the gold patch and the issue. The instance
          id and repository name never appear in the input.
        </P>

        <Collapsible title="How a task becomes model input" meta="Four real tasks, drawn to scale against the 30,720-token budget" open>
          <InputBudgetDiagram />
        </Collapsible>

        <P>
          The base model is Qwen3-8B, frozen in bf16, with LoRA (r=16, α=32) on every attention and MLP projection. The
          hidden state of an appended final token (4,096-d) feeds four fp32 heads trained from scratch. Three are CORAL
          ordinal heads, one per axis: a shared weight vector and three ordered biases give logits for P(y&gt;k), k = 0,
          1, 2, trained with binary cross-entropy against [y&gt;0, y&gt;1, y&gt;2]. The predicted rating is the sum of
          the three sigmoids. The fourth is a scalar price head trained with an in-batch Bradley–Terry loss: for each pair
          where task A has lower severity (underspecified + false_negative) than task B, the loss is −log σ(s<sub>A</sub>{' '}
          − s<sub>B</sub>), and ties are skipped. The total loss is the sum of the three CORAL losses and the
          Bradley–Terry loss. 43.7M parameters train, about 0.5% of the model.
        </P>

        <Collapsible title="How the model is built" meta="Qwen3-8B + LoRA, final-token pooling, three CORAL heads and a price head" open wide>
          <ArchitectureFigure />
        </Collapsible>

        <Collapsible title="What the pairwise loss sees" meta="One real pair of tasks and the price scores the model gives them" open wide>
          <PairFigure />
        </Collapsible>

        <P>Four tasks from the held-out sympy fold, with the annotator labels and the trained model&apos;s predictions:</P>
        <ExampleCollapsibles />

        <H2>1. Humans disagree, so measure the ceiling first</H2>
        <P>
          On the underspecified task above, the three annotators gave 1, 3 and 1, and the max-ensemble makes the label 3.
          That spread is typical. I define the human ceiling as the Spearman ρ between one held-out annotator and the mean
          of the other two: 0.41 for underspecified, 0.50 for false_negative and 0.56 for difficulty.
        </P>
        <P>
          A model at ρ = 0.35 on underspecified sounds weak until you see that one annotator reaches 0.41 against the
          other two. The comparison also has to be like for like. Scored against the three-annotator ensemble, a model
          faces cleaner labels than any single human does and can appear to beat the ceiling when it doesn&apos;t, so I
          also score it against single held-out annotators, using the same draws as the ceiling.
        </P>

        <H2>2. Run the dumb baselines before the smart model</H2>
        <P>
          Before training anything I fit two ordinal logistic regressions. <em>Length</em> sees four token counts: issue,
          gold patch, tests and code context. <em>Surface</em> sees 21 shallow features: those lengths plus patch and
          test hunk and line counts, FAIL_TO_PASS and PASS_TO_PASS counts, and whether the issue contains a traceback, a
          code block or URLs.
        </P>
        <P>
          Under pooled leave-repo-out evaluation, length alone predicts difficulty at ρ = 0.66, above the 0.56 human
          ceiling. The difficulty labels are mostly a function of task size. Underspecified is the opposite case, with
          surface at 0.17 on the sympy fold. That made it the axis where reading the text had to show up, and it kept me
          from crediting the model for a difficulty score that token counts already explain.
        </P>

        <Collapsible title="What the baselines see, and the room they left" meta="Feature pipeline, then the best baseline per axis against the human ceiling" open>
          <BaselineFigure />
        </Collapsible>

        <H2>3. Decide what counts as a win before you look</H2>
        <P>
          One held-out repository gives 298 test tasks. Before the 8B run, I estimated the noise floor with a paired
          bootstrap of surface against length on those tasks. The 95% interval half-width was about ±0.10 on
          underspecified Spearman, so smaller gains are noise.
        </P>
        <P>
          This paid off immediately. The first run, Qwen3-0.6B with context cut to 8k tokens, beat surface on
          underspecified by 0.06. With the threshold already written down, that was clearly inside the noise.
        </P>

        <H2>4. The 8B model learned something shallow features can&apos;t</H2>
        <P>
          The main run uses the setup above with the leave-repo-out fold that holds out sympy: 1,260 training and 141
          validation tasks from the other repositories, and sympy&apos;s 298 tasks as test. It trained for 3 epochs (237
          AdamW steps, 16 tasks per step), with the best checkpoint at step 200 by validation mean Spearman.
        </P>
        <div className="mb-4 overflow-x-auto rounded-lg border">
          <table className="tqs-table w-full min-w-[560px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Held-out sympy tasks (n = 298)</th>
                <th className="px-3 py-2 text-right font-semibold">Qwen3-8B</th>
                <th className="px-3 py-2 text-right font-semibold">Qwen3-0.6B</th>
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
                  <td className="px-3 py-2 text-right">{f(r.surface)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{f(r.ceiling)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Collapsible title="Every held-out task, by price score" meta="298 sympy tasks, grouped by annotated severity (underspecified + false_negative)" open wide>
          <ScoreSwarmFigure />
        </Collapsible>
        <P>
          On underspecified the 8B model reaches ρ = 0.36 against 0.17 for surface. The paired-bootstrap difference is
          +0.185 [+0.071, +0.298], clear of the ±0.10 floor. Against single held-out annotators it reaches 70% of the
          human ceiling on that axis, where surface reaches 29%. It also beats surface on false_negative (+0.139), filter
          AUROC (+0.073) and price Kendall τ (+0.129), all with intervals that exclude zero. Difficulty is a tie (−0.032
          [−0.078, +0.010]).
        </P>
        <P>
          To check it wasn&apos;t reading length, I computed partial Spearman correlations controlling for the length
          baseline&apos;s out-of-fold prediction. On underspecified the 8B model keeps 0.33 and surface 0.11. On
          false_negative it keeps 0.32 and surface 0.04. On difficulty surface keeps more (0.31 against 0.22), which fits
          lesson 2.
        </P>

        <H2>5. It fails in a way you can name</H2>
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

        <H2>6. Most of the work was making it cheap enough to run</H2>
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

        <H2>7. The bugs that matter are the quiet ones</H2>
        <P>
          Two bugs would have changed results without raising an error. The first was in the majority baseline, which
          predicts a constant and cannot rank anything. Its first report showed a pooled Spearman ρ of −0.118, because
          each leave-repo-out fold had a slightly different constant and pooling the folds manufactured ranks. The second
          was a CLI override: in <Code>optim.lr_lora=2e-4</Code>, YAML 1.1 reads <Code>2e-4</Code> as a string because
          it has no decimal point, so every learning-rate sweep would have handed AdamW a string. Both were caught by
          tests of behavior that seemed too obvious to test.
        </P>

        <H2>What&apos;s next</H2>
        <P>
          This is one held-out repository and one seed, so it is directional evidence, not a final number. The model also
          learns to agree with these annotators, which is not the same as predicting whether a task is learnable under
          RL. Next I want to run the other five leave-repo-out folds with more seeds, ablate the input (no gold patch,
          issue only), and run a membership probe for pretraining contamination, since Qwen3 may have seen SWE-bench.
          The terse-issue failure also suggests training on reworded issues, so length stops being a shortcut.
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
