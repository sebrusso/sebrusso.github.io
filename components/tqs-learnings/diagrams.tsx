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
  wide = true,
  children,
}: {
  title: ReactNode
  meta?: ReactNode
  open?: boolean
  /** Break out of the 672px essay measure to the 896px shell on large screens. Every panel on the
   *  page holds a diagram, so this defaults to true; pass wide={false} for a text-only panel. */
  wide?: boolean
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

/* ── One task, drawn as input → ratings ─────────────────────────────── */

const CODE_PARTS = new Set<InputPart['key']>(['patch', 'tests'])

function InputBlock({ part, max }: { part: InputPart; max: number }) {
  const cut = part.keptTokens < part.tokens
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold">
          <i className={`tqs-swatch tqs-part-${part.key}`} aria-hidden />
          {part.label}
        </span>
        <span className="ml-auto whitespace-nowrap font-mono text-[11px] text-muted-foreground">
          {fmt(part.keptTokens)} tok{cut && ` (of ${fmt(part.tokens)})`}
        </span>
      </div>
      <div className="tqs-minibar" aria-hidden>
        <span className={`tqs-part-${part.key}`} style={{ width: `${Math.max(1.5, (part.keptTokens / max) * 100)}%` }} />
      </div>
      {/* Diffs and test files keep their lines (scroll sideways); issue and context text may wrap. */}
      <pre className={`tqs-pre ${CODE_PARTS.has(part.key) ? 'tqs-pre-code' : ''}`}>{part.excerpt}</pre>
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
      {/* Name and values on separate lines so the three scales line up side by side. */}
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="whitespace-nowrap font-semibold">{AXIS_LABEL[axis]}</span>
        <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
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

function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <span className="flex min-h-6 flex-wrap items-center gap-x-1.5 gap-y-1 whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  )
}

/** A nested disclosure inside a task panel. Uses a named group so its chevron ignores the outer panel's state. */
function SubSection({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  return (
    <details className="tqs-sub group/sub rounded-md border" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-muted-foreground transition-transform duration-200 group-open/sub:rotate-90">
          ▸
        </span>
        <ColumnHeading>{heading}</ColumnHeading>
      </summary>
      <div className="border-t px-3 pb-4 pt-4">{children}</div>
    </details>
  )
}

export function TaskDiagram({ ex }: { ex: TaskExample }) {
  const max = Math.max(...ex.inputs.map((p) => p.keptTokens))
  const total = ex.inputs.reduce((s, p) => s + p.keptTokens, 0)
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{ex.takeaway}</p>

      <SubSection
        heading={
          <>
            What the model reads
            <span className="font-mono normal-case tracking-normal">· {fmt(total)} tokens</span>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
          {PART_ORDER.map((k) => {
            const p = ex.inputs.find((x) => x.key === k)!
            return <InputBlock key={k} part={p} max={max} />
          })}
        </div>
      </SubSection>

      <SubSection
        heading={
          <>
            <span
              className="inline-block rounded-full border bg-background px-2 py-0.5 font-mono text-[10.5px] normal-case tracking-normal"
              title="The model: Qwen3-8B with LoRA adapters"
            >
              Qwen3-8B + LoRA
            </span>
            <span aria-hidden>→</span>
            Ratings, 0 to 3
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <ScaleLegend />
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-3">
            {(['underspecified', 'false_negative', 'difficulty'] as Axis[]).map((a) => (
              <Scale key={a} axis={a} ex={ex} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 border-t pt-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold">Keep or drop from SWE-bench Verified</span>
              <span className="text-muted-foreground">
                Humans: <b className="font-medium text-foreground">{ex.keptInVerified ? 'kept' : 'dropped'}</b> · model
                drop score <b className="font-mono font-medium text-foreground">{ex.filterScore.toFixed(2)}</b>
              </span>
            </div>
            <blockquote className="border-l-2 border-brand pl-3 text-xs italic text-muted-foreground">
              “{ex.note.text}”
              <span className="mt-1 block not-italic">Annotator note on {AXIS_LABEL[ex.note.axis].toLowerCase()}</span>
            </blockquote>
          </div>
        </div>
      </SubSection>
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
