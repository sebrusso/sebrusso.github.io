'use client'

import { useMemo, useState } from 'react'
import type { ModelResult } from '../../lib/notebook/types'
import { labKey, labToken } from './labs'

type Variant = 'card' | 'full'

const GEOMETRY = {
  full: { w: 720, h: 420, l: 56, r: 28, t: 20, b: 52, font: 11.5, maxXTicks: 8 },
  card: { w: 360, h: 190, l: 34, r: 12, t: 10, b: 26, font: 10.5, maxXTicks: 4 },
} as const

interface Point extends ModelResult {
  cost: number
  x: number
  y: number
  frontier: boolean
}

interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
}

const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

function formatCost(v: number): string {
  if (v >= 1) return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`
  if (v >= 0.1) return `$${v.toFixed(2)}`
  return `$${v.toPrecision(1)}`
}

function logTicks(lo: number, hi: number, max: number): number[] {
  const all: number[] = []
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++)
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** e
      if (v >= lo && v <= hi) all.push(v)
    }
  if (all.length <= max) return all
  const decades = all.filter((v) => Math.abs(Math.log10(v) - Math.round(Math.log10(v))) < 1e-9)
  return decades.length >= 2 ? decades : all.filter((_, i) => i % 2 === 0)
}

/**
 * Cost-vs-score Pareto plot. Frontier = models no other model beats on both
 * cost and score; it is drawn as a step line (score holds until a pricier
 * model does better) and labelled with collision-free placement.
 */
export function ParetoPlot({
  results,
  variant = 'full',
  costUnit = 'per task',
}: {
  results: ModelResult[]
  variant?: Variant
  costUnit?: string
}) {
  const g = GEOMETRY[variant]
  const [hover, setHover] = useState<Point | null>(null)

  const plot = useMemo(() => {
    const usable = results.filter((r) => r.costPerTask != null && r.costPerTask > 0)
    if (usable.length === 0) return null

    const costs = usable.map((r) => r.costPerTask as number)
    const scores = usable.map((r) => r.score)
    const xLo = Math.min(...costs) / 1.6
    const xHi = Math.max(...costs) * 1.6
    const yLo = Math.max(0, Math.floor((Math.min(...scores) - 4) / 10) * 10)
    const yHi = Math.min(100, Math.ceil((Math.max(...scores) + 4) / 10) * 10)

    const pw = g.w - g.l - g.r
    const ph = g.h - g.t - g.b
    const X = (c: number) => g.l + ((Math.log10(c) - Math.log10(xLo)) / (Math.log10(xHi) - Math.log10(xLo))) * pw
    const Y = (s: number) => g.t + (1 - (s - yLo) / (yHi - yLo)) * ph

    const sorted = [...usable].sort((a, b) => (a.costPerTask as number) - (b.costPerTask as number) || b.score - a.score)
    let best = -Infinity
    const points: Point[] = sorted.map((r) => {
      const frontier = r.score > best
      if (frontier) best = r.score
      const cost = r.costPerTask as number
      return { ...r, cost, x: X(cost), y: Y(r.score), frontier }
    })
    const frontier = points.filter((p) => p.frontier)

    let step = ''
    frontier.forEach((p, i) => {
      step += i === 0 ? `M${p.x} ${p.y}` : `H${p.x}V${p.y}`
    })
    const last = frontier[frontier.length - 1]
    const area = `${step}H${g.l + pw}V${g.t + ph}H${frontier[0].x}Z`
    step += `H${g.l + pw}`

    const yTicks: number[] = []
    const yStep = yHi - yLo > 50 ? 20 : 10
    for (let s = yLo; s <= yHi; s += yStep) yTicks.push(s)
    const xTicks = logTicks(xLo, xHi, g.maxXTicks)

    // Greedy label placement: frontier first (cheapest to priciest), then the
    // next-best scorers. A label never crosses a frontier point, the frontier
    // line or another label (hard). It prefers to clear the faded points too
    // (soft), and only covers them, behind a halo, when nothing else fits.
    const labels: { p: Point; x: number; y: number; anchor: 'start' | 'middle' | 'end' }[] = []
    if (variant === 'full') {
      const dot = (p: Point): Box => ({ x0: p.x - 6, y0: p.y - 6, x1: p.x + 6, y1: p.y + 6 })
      const hard: Box[] = frontier.map(dot)
      const soft: Box[] = points.filter((p) => !p.frontier).map(dot)
      frontier.forEach((p, i) => {
        const prev = frontier[i - 1]
        if (prev) {
          hard.push({ x0: prev.x, y0: prev.y - 2, x1: p.x, y1: prev.y + 2 })
          hard.push({ x0: p.x - 2, y0: p.y, x1: p.x + 2, y1: prev.y })
        }
      })
      hard.push({ x0: last.x, y0: last.y - 2, x1: g.l + pw, y1: last.y + 2 })
      const extras = points
        .filter((p) => !p.frontier)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
      for (const p of [...frontier, ...extras]) {
        const w = p.model.length * g.font * 0.56
        const h = g.font + 2
        const candidates: [number, number, 'start' | 'middle' | 'end'][] = [
          [p.x + 9, p.y + 4, 'start'],
          [p.x - 9, p.y + 4, 'end'],
          [p.x, p.y - 11, 'middle'],
          [p.x, p.y + 19, 'middle'],
          [p.x + 8, p.y - 9, 'start'],
          [p.x - 8, p.y - 9, 'end'],
          [p.x + 8, p.y + 17, 'start'],
          [p.x - 8, p.y + 17, 'end'],
        ]
        const own = dot(p)
        const fits = (strict: boolean) =>
          candidates.find(([lx, ly, anchor]) => {
            const x0 = anchor === 'start' ? lx : anchor === 'end' ? lx - w : lx - w / 2
            const box = { x0, y0: ly - h + 3, x1: x0 + w, y1: ly + 3 }
            const inside = box.x0 >= g.l + 2 && box.x1 <= g.w - 4 && box.y0 >= g.t && box.y1 <= g.t + ph
            const clear = (b: Box) => (b.x0 === own.x0 && b.y0 === own.y0) || !overlaps(box, b)
            return inside && hard.every(clear) && (!strict || soft.every(clear))
          })
        // Extras (non-frontier) only get a label where it covers nothing.
        const spot = fits(true) ?? (p.frontier ? fits(false) : undefined)
        if (spot) {
          const [lx, ly, anchor] = spot
          const x0 = anchor === 'start' ? lx : anchor === 'end' ? lx - w : lx - w / 2
          hard.push({ x0, y0: ly - h + 3, x1: x0 + w, y1: ly + 3 })
          labels.push({ p, x: lx, y: ly, anchor })
        }
      }
    }

    // Labs without their own hue share one gray swatch in the legend.
    const named = Array.from(new Set(points.filter((p) => labKey(p.lab) !== 'other').map((p) => p.lab)))
    const labs = points.some((p) => labKey(p.lab) === 'other') ? [...named, 'Other labs'] : named
    return { points, step, area, last, yTicks, xTicks, X, Y, pw, ph, labels, labs, skipped: results.length - usable.length }
  }, [results, g, variant])

  if (!plot) {
    return (
      <div className="nb-plot-empty" style={{ aspectRatio: `${g.w} / ${g.h}` }}>
        No cost data yet
      </div>
    )
  }

  const { points, step, area, yTicks, xTicks, X, Y, pw, ph, labels, labs, skipped } = plot
  const full = variant === 'full'

  return (
    <figure className="nb-plot">
      <div className="relative">
        <svg
          viewBox={`0 0 ${g.w} ${g.h}`}
          role="img"
          aria-label={`Score versus cost for ${points.length} models; ${points.filter((p) => p.frontier).length} on the Pareto frontier`}
          className="block w-full h-auto"
          fontSize={g.font}
        >
          <g className="nb-grid">
            {yTicks.map((s) => (
              <line key={`y${s}`} x1={g.l} x2={g.l + pw} y1={Y(s)} y2={Y(s)} />
            ))}
            {xTicks.map((c) => (
              <line key={`x${c}`} x1={X(c)} x2={X(c)} y1={g.t} y2={g.t + ph} />
            ))}
          </g>
          <g className="nb-axis-text">
            {yTicks.map((s) => (
              <text key={`yt${s}`} x={g.l - 8} y={Y(s) + 4} textAnchor="end">
                {s}
                {full ? '%' : ''}
              </text>
            ))}
            {xTicks.map((c) => (
              <text key={`xt${c}`} x={X(c)} y={g.t + ph + (full ? 18 : 15)} textAnchor="middle">
                {formatCost(c)}
              </text>
            ))}
          </g>
          {full && (
            <g className="nb-axis-title">
              <text x={g.l + pw / 2} y={g.h - 8} textAnchor="middle">
                Cost {costUnit} (USD, log scale)
              </text>
              <text transform={`translate(14 ${g.t + ph / 2}) rotate(-90)`} textAnchor="middle">
                Score
              </text>
            </g>
          )}
          <path d={area} className="nb-frontier-area" />
          <path d={step} className="nb-frontier" strokeWidth={full ? 2 : 1.5} fill="none" />
          {points
            .slice()
            .sort((a, b) => Number(a.frontier) - Number(b.frontier))
            .map((p) => (
              <circle
                key={p.model}
                cx={p.x}
                cy={p.y}
                r={full ? (p.frontier ? 5.5 : 4.5) : p.frontier ? 3.6 : 2.8}
                fill={labToken(p.lab)}
                fillOpacity={p.frontier ? 1 : 0.5}
                className="nb-point"
                strokeWidth={p.frontier ? 1.5 : 0}
                onMouseEnter={() => setHover(p)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p)}
                onBlur={() => setHover(null)}
                tabIndex={full ? 0 : -1}
                aria-label={`${p.model}: ${p.score}% at ${formatCost(p.cost)}`}
              />
            ))}
          {labels.map(({ p, x, y, anchor }) => (
            <text key={`l${p.model}`} x={x} y={y} textAnchor={anchor} className={p.frontier ? 'nb-label' : 'nb-label-quiet'}>
              {p.model}
            </text>
          ))}
        </svg>
        {hover && full && (
          <div
            className="nb-tooltip"
            style={{
              left: `${(hover.x / g.w) * 100}%`,
              top: `${(hover.y / g.h) * 100}%`,
              transform: hover.x > g.w * 0.6 ? 'translate(calc(-100% - 12px), -50%)' : 'translate(12px, -50%)',
            }}
          >
            <div className="font-medium">{hover.model}</div>
            <div className="nb-mono text-muted-foreground">
              {hover.lab} · {hover.score.toFixed(1)}% · {formatCost(hover.cost)}
            </div>
            {hover.scaffold && <div className="text-muted-foreground">{hover.scaffold}</div>}
            {hover.frontier && <div className="nb-frontier-tag">On the frontier</div>}
          </div>
        )}
      </div>
      {full && (
        <figcaption className="nb-legend">
          {labs.map((lab) => (
            <span key={lab} className="inline-flex items-center gap-1.5">
              <span className="nb-swatch" style={{ background: labToken(lab) }} />
              {lab}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="nb-frontier-key" />
            Pareto frontier
          </span>
          {skipped > 0 && <span className="text-muted-foreground">{skipped} without cost data not shown</span>}
        </figcaption>
      )}
    </figure>
  )
}
