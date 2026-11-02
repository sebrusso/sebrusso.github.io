import type { ReactNode } from 'react'
import {
  AXIS_LABEL,
  BUDGET_TOKENS,
  DIFFICULTY_TICKS,
  EXAMPLES,
  type Axis,
  type InputPart,
  type TaskExample,
} from '../../lib/tqs-learnings'

const fmt = (n: number) => n.toLocaleString('en-US')

/** A native <details> disclosure: works in the static export with no JS. */
export function Collapsible({
  title,
  meta,
  open = false,
  wide = false,
  children,
}: {
  title: ReactNode
  meta?: ReactNode
  open?: boolean
  wide?: boolean // break out of the 672px essay measure to the 896px shell on large screens
  children: ReactNode
}) {
  return (
    <details className={`tqs-details group my-6 rounded-lg border bg-card ${wide ? 'lg:-mx-28' : ''}`} open={open}>
      <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="mt-[3px] inline-block text-muted-foreground transition-transform duration-200 group-open:rotate-90"
        >
          ▸
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-semibold leading-snug">{title}</span>
          {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
        </span>
      </summary>
      <div className="border-t px-4 pb-5 pt-4">{children}</div>
    </details>
  )
}

/* ── How a task becomes model input ─────────────────────────────────── */

const PART_ORDER: InputPart['key'][] = ['issue', 'patch', 'tests', 'context']
const PART_NAME: Record<InputPart['key'], string> = {
  issue: 'Issue',
  patch: 'Gold patch',
  tests: 'Tests',
  context: 'Code context',
}

function PartsLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {PART_ORDER.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <i className={`tqs-swatch tqs-part-${k}`} aria-hidden />
          {PART_NAME[k]}
        </span>
      ))}
    </div>
  )
}

/** One stacked bar per example task, drawn to scale against the 30,720-token budget. */
export function InputBudgetDiagram() {
  return (
    <figure className="flex flex-col gap-4">
      <PartsLegend />
      <div className="flex flex-col gap-3">
        {EXAMPLES.map((ex) => {
          const kept = ex.inputs.reduce((s, p) => s + p.keptTokens, 0)
          const ctx = ex.inputs.find((p) => p.key === 'context')!
          return (
            <div key={ex.id} className="grid grid-cols-1 gap-1 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:items-center sm:gap-3">
              <span className="font-mono text-xs text-muted-foreground">{ex.id.replace('sympy__', '')}</span>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="tqs-track" role="img" aria-label={`${ex.id}: ${fmt(kept)} of ${fmt(BUDGET_TOKENS)} tokens used`}>
                  {ex.inputs.map((p) =>
                    p.keptTokens > 0 ? (
                      <span
                        key={p.key}
                        className={`tqs-seg tqs-part-${p.key}`}
                        style={{ width: `${(p.keptTokens / BUDGET_TOKENS) * 100}%` }}
                        title={`${PART_NAME[p.key]}: ${fmt(p.keptTokens)} tokens${p.keptTokens < p.tokens ? ` (cut from ${fmt(p.tokens)})` : ''}`}
                      />
                    ) : null
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {fmt(kept)} tokens
                  {ctx.keptTokens < ctx.tokens && ` · code context cut from ${fmt(ctx.tokens)} to ${fmt(ctx.keptTokens)}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-3">
        <span />
        <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>0</span>
          <span>15,360</span>
          <span>30,720 token budget</span>
        </div>
      </div>
      <figcaption className="text-sm text-muted-foreground">
        Bars are to scale. Code context is almost always the largest part, so it is the first thing cut when a task
        does not fit: whole files, then windows of 200, 100, 50 and 20 lines around each change, then a hard cut.
        Hints from the issue thread are never included, because later comments can give the fix away.
      </figcaption>
    </figure>
  )
}

/* ── The training objective ─────────────────────────────────────────── */

const OBJ_A = EXAMPLES[0] // sympy-23534, clean
const OBJ_B = EXAMPLES[2] // sympy-13806, tests reject valid fixes
const PRICE = { a: 4.7, b: -0.47 } // T4 price-head outputs for these two tasks
const severity = (ex: TaskExample) => ex.label.underspecified + ex.label.false_negative
const coral = (label: number) => [0, 1, 2].map((k) => (label > k ? 1 : 0))

function TaskChip({ ex, tag, price }: { ex: TaskExample; tag: string; price: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md border bg-background p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold">Task {tag}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{ex.id.replace('sympy__', '')}</span>
      </div>
      <div className="flex gap-[2px]" aria-hidden>
        {PART_ORDER.map((k) => {
          const p = ex.inputs.find((x) => x.key === k)!
          return <span key={k} className={`tqs-part-${k} h-2.5 rounded-sm`} style={{ flexGrow: Math.max(0.6, Math.log10(p.keptTokens)) }} />
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
        <span>labels {ex.label.underspecified}/{ex.label.false_negative}/{ex.label.difficulty}</span>
        <span>severity {severity(ex)}</span>
      </div>
      <span className="sr-only">Price score {price}</span>
    </div>
  )
}

function Bits({ bits }: { bits: number[] }) {
  return (
    <span className="inline-flex gap-[3px]" aria-label={`targets ${bits.join(', ')}`}>
      {bits.map((b, i) => (
        <span
          key={i}
          className={`inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[11px] ${
            b ? 'bg-foreground text-background' : 'border text-muted-foreground'
          }`}
        >
          {b}
        </span>
      ))}
    </span>
  )
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-1 text-muted-foreground lg:py-0" aria-hidden>
      <span className="tqs-flow">{label && <span className="font-mono text-[10.5px]">{label}</span>}</span>
    </div>
  )
}

/** Inputs → shared encoder → four heads → two losses, illustrated with a real pair of tasks. */
export function ObjectiveDiagram() {
  const diff = PRICE.a - PRICE.b
  const sig = 1 / (1 + Math.exp(-diff))
  const axes: { key: Axis; name: string }[] = [
    { key: 'underspecified', name: 'Underspecified issue' },
    { key: 'false_negative', name: 'Tests reject valid fixes' },
    { key: 'difficulty', name: 'Difficulty' },
  ]
  return (
    <figure className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_2rem_minmax(0,0.9fr)_2rem_minmax(0,1.35fr)] lg:items-stretch">
        {/* 1. inputs */}
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">1 · Two tasks in a batch</span>
          <TaskChip ex={OBJ_A} tag="A" price={PRICE.a} />
          <TaskChip ex={OBJ_B} tag="B" price={PRICE.b} />
          <PartsLegend />
        </div>
        <Arrow />
        {/* 2. encoder */}
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">2 · Shared encoder</span>
          <div className="flex flex-1 flex-col justify-center">
          <div className="flex flex-col gap-2 rounded-md border bg-background p-3 text-sm">
            <span className="font-semibold">Qwen3-8B</span>
            <span className="text-xs text-muted-foreground">Base weights frozen. LoRA adapters train 43.7M parameters (0.5% of the model).</span>
            <span className="mt-1 rounded bg-muted px-2 py-1 font-mono text-[11px]">last token → 4,096 numbers</span>
            <span className="text-xs text-muted-foreground">Each task is read separately; the vector at its final token summarizes it.</span>
          </div>
          </div>
        </div>
        <Arrow />
        {/* 3. heads + losses */}
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">3 · Four heads, two losses</span>
          <div className="flex flex-col gap-2 rounded-md border bg-background p-3">
            <span className="text-xs font-semibold">Rating heads, one per axis</span>
            <span className="text-xs text-muted-foreground">
              Each predicts P(rating &gt; 0), P(&gt; 1), P(&gt; 2). The label becomes three yes/no targets, scored with
              cross-entropy. Task B:
            </span>
            {axes.map((a) => (
              <div key={a.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                <span className="min-w-0">{a.name}</span>
                <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                  label {OBJ_B.label[a.key]} → <Bits bits={coral(OBJ_B.label[a.key])} />
                </span>
              </div>
            ))}
            <span className="text-[11px] text-muted-foreground">
              Predicted rating = sum of the three probabilities, so it lands anywhere from 0 to 3.
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-md border bg-background p-3">
            <span className="text-xs font-semibold">Price head: one score per task</span>
            <span className="text-xs text-muted-foreground">
              Within a batch, the task with lower severity (underspecified + tests) should score higher. Loss =
              −log σ(s<sub>A</sub> − s<sub>B</sub>).
            </span>
            <div className="tqs-pricebar" role="img" aria-label={`Task A scores ${PRICE.a}, task B scores ${PRICE.b}`}>
              <span className="tqs-price-zero" style={{ left: `${((0 + 2) / 8) * 100}%` }} />
              <span className="tqs-price-dot" style={{ left: `${((PRICE.b + 2) / 8) * 100}%` }}><b>B</b></span>
              <span className="tqs-price-dot" style={{ left: `${((PRICE.a + 2) / 8) * 100}%` }}><b>A</b></span>
            </div>
            <div className="flex justify-between px-1 font-mono text-[10.5px] text-muted-foreground" aria-hidden>
              <span>← worse task</span>
              <span>better task →</span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              s<sub>A</sub> = {PRICE.a.toFixed(2)}, s<sub>B</sub> = {PRICE.b.toFixed(2)} → σ({diff.toFixed(2)}) ={' '}
              {sig.toFixed(3)} → loss {(-Math.log(sig)).toFixed(3)}
            </span>
          </div>
          <div className="rounded-md bg-muted px-3 py-2 font-mono text-[11px]">
            total loss = rating losses (3 axes) + pairwise price loss
          </div>
        </div>
      </div>
      <figcaption className="text-sm text-muted-foreground">
        The objective, shown with two held-out tasks and the scores the trained model gives them. A is the clean task
        (severity 0); B has tests that reject valid fixes (severity 4). The model already ranks A well above B, so this
        pair would add almost nothing to the loss. Pairs it orders wrongly add a lot. At inference only one task is
        needed: the price score ranks a whole dataset in one pass.
      </figcaption>
    </figure>
  )
}

/* ── One task, drawn as input → ratings ─────────────────────────────── */

function InputBlock({ part, max }: { part: InputPart; max: number }) {
  const cut = part.keptTokens < part.tokens
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <i className={`tqs-swatch tqs-part-${part.key}`} aria-hidden />
          {part.label}
        </span>
        <span className="font-mono text-muted-foreground">
          {fmt(part.keptTokens)} tok{cut && ` (of ${fmt(part.tokens)})`}
        </span>
      </div>
      <div className="tqs-minibar" aria-hidden>
        <span className={`tqs-part-${part.key}`} style={{ width: `${Math.max(1.5, (part.keptTokens / max) * 100)}%` }} />
      </div>
      <pre className="tqs-pre">{part.excerpt}</pre>
      {part.trimmed && <span className="text-[11px] text-muted-foreground">Shortened here; the model sees the full text.</span>}
    </div>
  )
}

function Scale({ axis, ex }: { axis: Axis; ex: TaskExample }) {
  const pos = (v: number) => `${(v / 3) * 100}%`
  const ann = ex.annotators[axis]
  // Stack annotators who gave the same score so every vote is visible.
  const seen: Record<number, number> = {}
  const dots = ann.map((v) => {
    const k = (seen[v] = (seen[v] ?? 0) + 1)
    return { v, row: k - 1 }
  })
  const ticks = axis === 'difficulty' ? DIFFICULTY_TICKS : ['0', '1', '2', '3']
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold">{AXIS_LABEL[axis]}</span>
        <span className="font-mono text-muted-foreground">
          label {ex.label[axis]} · model {ex.predicted[axis].toFixed(1)}
        </span>
      </div>
      <div
        className="tqs-scale"
        role="img"
        aria-label={`${AXIS_LABEL[axis]}: annotators ${ann.join(', ')}, released label ${ex.label[axis]}, model ${ex.predicted[axis].toFixed(2)}`}
      >
        <span className="tqs-scale-line" />
        {[0, 1, 2, 3].map((t) => (
          <span key={t} className="tqs-scale-tick" style={{ left: pos(t) }} />
        ))}
        {dots.map((d, i) => (
          <span key={i} className="tqs-ann" style={{ left: pos(d.v), top: `${16 - d.row * 8}px` }} />
        ))}
        <span className="tqs-label" style={{ left: pos(ex.label[axis]) }} />
        <span className="tqs-model" style={{ left: pos(ex.predicted[axis]) }} />
      </div>
      <div className="relative h-4 font-mono text-[10.5px] text-muted-foreground">
        {ticks.map((t, i) => (
          <span
            key={t}
            className="absolute whitespace-nowrap"
            style={{ left: pos(i), transform: i === 0 ? 'none' : i === 3 ? 'translateX(-100%)' : 'translateX(-50%)' }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ScaleLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><i className="tqs-ann tqs-ann-key" aria-hidden />One annotator</span>
      <span className="inline-flex items-center gap-1.5"><i className="tqs-label tqs-label-key" aria-hidden />Released label</span>
      <span className="inline-flex items-center gap-1.5"><i className="tqs-model tqs-model-key" aria-hidden />Model prediction</span>
    </div>
  )
}

export function TaskDiagram({ ex }: { ex: TaskExample }) {
  const max = Math.max(...ex.inputs.map((p) => p.keptTokens))
  const total = ex.inputs.reduce((s, p) => s + p.keptTokens, 0)
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm">{ex.takeaway}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,1fr)] md:gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">What the model reads · {fmt(total)} tokens</span>
          {PART_ORDER.map((k) => {
            const p = ex.inputs.find((x) => x.key === k)!
            return <InputBlock key={k} part={p} max={max} />
          })}
        </div>
        <div className="flex items-center justify-center md:flex-col" aria-hidden>
          <span className="tqs-arrow">
            <span className="whitespace-nowrap rounded-full border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
              Qwen3-8B + LoRA
            </span>
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Ratings, 0 to 3</span>
          <ScaleLegend />
          {(['underspecified', 'false_negative', 'difficulty'] as Axis[]).map((a) => (
            <Scale key={a} axis={a} ex={ex} />
          ))}
          <div className="flex flex-col gap-1 border-t pt-3 text-xs">
            <span className="font-semibold">Keep or drop from SWE-bench Verified</span>
            <span className="text-muted-foreground">
              Humans: <b className="font-medium text-foreground">{ex.keptInVerified ? 'kept' : 'dropped'}</b> · model drop score{' '}
              <b className="font-mono font-medium text-foreground">{ex.filterScore.toFixed(2)}</b>
            </span>
          </div>
          <blockquote className="border-l-2 border-brand pl-3 text-xs italic text-muted-foreground">
            “{ex.note.text}”
            <span className="mt-1 block not-italic">Annotator note on {AXIS_LABEL[ex.note.axis].toLowerCase()}</span>
          </blockquote>
        </div>
      </div>
    </div>
  )
}

export function ExampleCollapsibles() {
  return (
    <>
      {EXAMPLES.map((ex) => (
        <Collapsible
          key={ex.id}
          title={`${ex.kind}: ${ex.headline}`}
          meta={<span className="font-mono">{ex.id}</span>}
        >
          <TaskDiagram ex={ex} />
        </Collapsible>
      ))}
    </>
  )
}
