'use client'

import { useMemo, useState } from 'react'
import { catVar, formatHours, type TaskSummary } from '../../lib/tb4/data'

const W = 780
const H = 480
const M = { l: 52, r: 18, t: 14, b: 46 }
const PW = W - M.l - M.r
const PH = H - M.t - M.b
const X_MIN = 0.5
const X_MAX = 80
const Y_MAX = 900

const X = (h: number) => M.l + ((Math.log10(h) - Math.log10(X_MIN)) / (Math.log10(X_MAX) - Math.log10(X_MIN))) * PW
const Y = (w: number) => M.t + (1 - Math.min(w, Y_MAX) / Y_MAX) * PH

// Many tasks share an estimate (2 h, 4 h…); a stable per-name nudge keeps
// their dots from stacking into one.
function jitter(name: string): number {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return ((h % 1000) / 1000 - 0.5) * 11
}

const X_TICKS: [number, string][] = [
  [0.75, '45m'],
  [1, '1h'],
  [2, '2h'],
  [4, '4h'],
  [8, '8h'],
  [16, '16h'],
  [32, '32h'],
  [60, '60h'],
]

/**
 * Scatter of every task: expert time (log) against instruction length.
 * Tasks filtered out stay as faint dots so the shape of the whole set holds.
 */
export function Landscape({ tasks, shown, onOpen }: { tasks: TaskSummary[]; shown: TaskSummary[]; onOpen: (n: string) => void }) {
  const [hover, setHover] = useState<string | null>(null)
  const visible = useMemo(() => new Set(shown.map((t) => t.name)), [shown])
  const points = useMemo(
    () => tasks.map((t) => ({ t, x: X(t.expertHours) + jitter(t.name), y: Y(t.instructionWords) })),
    [tasks]
  )
  // Label the outliers: longest and shortest instructions, longest estimates.
  const labelled = useMemo(() => {
    const byWords = [...tasks].sort((a, b) => b.instructionWords - a.instructionWords)
    const byHours = [...tasks].sort((a, b) => b.expertHours - a.expertHours)
    return new Set([byWords[0], byWords[1], byWords.at(-1), byHours[0], byHours[1]].filter(Boolean).map((t) => t!.name))
  }, [tasks])
  const active = points.find((p) => p.t.name === hover)

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="relative rounded-xl border border-border bg-card p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="tb4-plot block h-auto w-full" role="img" aria-label={`Expert time against instruction length for ${tasks.length} tasks`}>
          <g className="grid">
            {[0, 200, 400, 600, 800].map((w) => (
              <line key={`y${w}`} x1={M.l} x2={M.l + PW} y1={Y(w)} y2={Y(w)} />
            ))}
            {X_TICKS.map(([h]) => (
              <line key={`x${h}`} x1={X(h)} x2={X(h)} y1={M.t} y2={M.t + PH} />
            ))}
          </g>
          <g className="axis">
            {[0, 200, 400, 600, 800].map((w) => (
              <text key={`yt${w}`} x={M.l - 10} y={Y(w) + 4} textAnchor="end">
                {w}
              </text>
            ))}
            {X_TICKS.map(([h, label]) => (
              <text key={`xt${h}`} x={X(h)} y={M.t + PH + 18} textAnchor="middle">
                {label}
              </text>
            ))}
          </g>
          <g className="title">
            <text x={M.l + PW / 2} y={H - 8} textAnchor="middle">
              Expert time estimate (log scale)
            </text>
            <text transform={`translate(14 ${M.t + PH / 2}) rotate(-90)`} textAnchor="middle">
              Instruction length (words)
            </text>
          </g>
          {points.map(({ t, x, y }) => {
            const on = visible.has(t.name)
            return (
              <circle
                key={t.name}
                cx={x}
                cy={y}
                r={hover === t.name ? 6.5 : 5}
                fill={catVar(t.category)}
                opacity={on ? 0.9 : 0.12}
                tabIndex={on ? 0 : -1}
                role="link"
                aria-label={`${t.name}: ${formatHours(t.expertHours)}, ${t.instructionWords} words`}
                onMouseEnter={() => setHover(t.name)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(t.name)}
                onBlur={() => setHover(null)}
                onClick={() => onOpen(t.name)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen(t.name)}
              />
            )
          })}
          {points
            .filter((p) => labelled.has(p.t.name) && visible.has(p.t.name) && p.t.name !== hover)
            .map(({ t, x, y }) => {
              const right = x < M.l + PW - 170
              return (
                <text key={`l${t.name}`} className="label" x={right ? x + 9 : x - 9} y={y + 4} textAnchor={right ? 'start' : 'end'} aria-hidden="true">
                  {t.name}
                </text>
              )
            })}
        </svg>
        {active && (
          <div
            className="pointer-events-none absolute z-10 flex w-64 flex-col gap-1 rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-xl"
            style={{
              left: `calc(${(active.x / W) * 100}% + ${active.x > W * 0.62 ? '-16.5rem' : '1rem'})`,
              top: `calc(${(active.y / H) * 100}% - 2rem)`,
            }}
          >
            <span className="tb4-mono text-[0.84rem] font-medium">{active.t.name}</span>
            <span className="inline-flex items-center gap-2">
              <span className="tb4-dot" style={{ background: catVar(active.t.category) }} aria-hidden="true" />
              {active.t.category} / {active.t.subcategory}
            </span>
            <span className="text-muted-foreground">
              {formatHours(active.t.expertHours)} expert · {active.t.instructionWords}-word instruction
            </span>
            <span className="truncate text-muted-foreground">{active.t.authors.join(', ')}</span>
            <span className="font-medium text-primary">Click to open →</span>
          </div>
        )}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        Faded dots are filtered out. Tasks with the same estimate are nudged sideways so they don&apos;t overlap.
      </figcaption>
    </figure>
  )
}
