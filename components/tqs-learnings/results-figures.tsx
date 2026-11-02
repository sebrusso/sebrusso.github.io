/**
 * Results figures for /writing/tqs-learnings, all on the 298 held-out sympy tasks (leave-repo-out):
 *  - ComparisonFigure: (1) the rating axes scored against a single held-out reviewer, next to reviewer agreement;
 *    (2) the rating axes scored against the combined labels; (3) keep/drop AUROC; (4) quality score vs severity (τ).
 *  - GainFigure: each model's gain over the best baseline per metric, with 95% paired-bootstrap intervals (2,000 resamples).
 * Values: sebrusso/tqs reports/t4_8b_32k_eval.md (8B), reports/t1_smoke_0p6b_eval.md (0.6B), reports/m1_baselines.md.
 * Reviewer agreement: Spearman(held-out reviewer, mean of the other two), averaged over 50 draws, same 298 tasks.
 */

import type { ReactNode } from 'react'

const ink2 = 'var(--tqs-ink2)'

type Series = 'length' | 'surface' | 'small' | 'big'
const SERIES: { key: Series; name: string; fill: string; stroke: string; r: number }[] = [
  { key: 'length', name: 'Length baseline', fill: 'var(--tqs-card)', stroke: 'var(--tqs-ink2)', r: 5 },
  { key: 'surface', name: 'Surface baseline', fill: 'var(--tqs-ink2)', stroke: 'var(--tqs-card)', r: 5 },
  { key: 'small', name: 'Qwen3-0.6B (8k context)', fill: 'var(--tqs-brand-soft)', stroke: 'var(--tqs-brand)', r: 6 },
  { key: 'big', name: 'Qwen3-8B (32k context)', fill: 'var(--tqs-brand)', stroke: 'var(--tqs-card)', r: 7 },
]
// Baselines sit above the row line, models below, each series in its own lane, so close values never hide each other.
const LANE: Record<Series, number> = { length: -15, surface: -6, small: 6, big: 15 }
const outlined = (k: Series) => k === 'length' || k === 'small'

type Row = { name: string; length: number; surface: number; small?: number; big: number; ceiling?: number }

/** Against a single held-out reviewer: the same footing as reviewer agreement. */
const SINGLE_ROWS: Row[] = [
  { name: 'Underspecification (ρ)', length: 0.132, surface: 0.123, big: 0.303, ceiling: 0.431 },
  { name: 'False negatives (ρ)', length: 0.326, surface: 0.298, big: 0.404, ceiling: 0.524 },
  { name: 'Difficulty (ρ)', length: 0.568, surface: 0.601, big: 0.557, ceiling: 0.588 },
]
/** Against the combined labels. */
const CORR_ROWS: Row[] = [
  { name: 'Underspecification (ρ)', length: 0.156, surface: 0.173, small: 0.233, big: 0.358 },
  { name: 'False negatives (ρ)', length: 0.378, surface: 0.341, small: 0.422, big: 0.48 },
  { name: 'Difficulty (ρ)', length: 0.618, surface: 0.655, small: 0.651, big: 0.623 },
]
const AUROC_ROW: Row = { name: 'Keep/drop (AUROC)', length: 0.705, surface: 0.7, small: 0.724, big: 0.772 }
const TAU_ROW: Row = { name: 'Quality score vs severity (τ)', length: 0.264, surface: 0.225, small: 0.291, big: 0.354 }

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {SERIES.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden>
            <circle cx="7" cy="7" r={s.r - 1} fill={s.fill} stroke={outlined(s.key) ? s.stroke : 'none'} strokeWidth={1.8} />
          </svg>
          {s.name}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block h-3.5 w-[3px] rounded" style={{ background: 'var(--tqs-ink)' }} aria-hidden />
        Reviewer agreement
      </span>
    </div>
  )
}

function PanelTitle({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</span>
}

function DotRows({
  rows, lo, hi, ticks, decimals = 1, chance, axisLabel,
}: { rows: Row[]; lo: number; hi: number; ticks: number[]; decimals?: number; chance?: number; axisLabel: string }) {
  const W = 960, left = 230, right = 30, rowH = 70, top = 22
  const H = top + rows.length * rowH + 40
  const X = (v: number) => left + ((v - lo) / (hi - lo)) * (W - left - right)
  const series = (r: Row) => SERIES.filter((s) => r[s.key] !== undefined)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="tqs-svg"
      role="img"
      aria-label={rows
        .map((r) => `${r.name}: ${series(r).map((s) => `${s.name} ${r[s.key]}`).join(', ')}${r.ceiling !== undefined ? `, reviewer agreement ${r.ceiling}` : ''}`)
        .join('; ')}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={top - 4} y2={H - 34} stroke="var(--tqs-line)" strokeWidth={chance === t ? 1.4 : 0.8} opacity={chance === t ? 1 : 0.6} />
          <text x={X(t)} y={H - 18} fontSize={11} textAnchor="middle" className="tqs-mono" fill={ink2}>{t.toFixed(decimals)}</text>
        </g>
      ))}
      {chance !== undefined && <text x={X(chance) + 6} y={top + 2} fontSize={10.5} fill={ink2}>chance</text>}
      <text x={X(hi)} y={H - 2} fontSize={11} textAnchor="end" fill={ink2}>{axisLabel}</text>
      {rows.map((r, i) => {
        const y = top + i * rowH + rowH / 2 - 4
        const ss = series(r)
        const vals = ss.map((s) => r[s.key] as number)
        return (
          <g key={r.name}>
            <text x={left - 14} y={y + 4} fontSize={12.5} fontWeight={600} textAnchor="end">{r.name}</text>
            <line x1={X(Math.min(...vals))} x2={X(Math.max(...vals))} y1={y} y2={y} stroke="var(--tqs-line)" strokeWidth={3} strokeLinecap="round" />
            {r.ceiling !== undefined && (
              <g>
                <line x1={X(r.ceiling)} x2={X(r.ceiling)} y1={y - 22} y2={y + 22} stroke="var(--tqs-ink)" strokeWidth={2.5} strokeLinecap="round">
                  <title>{`reviewer agreement: ${r.ceiling.toFixed(3)}`}</title>
                </line>
                <text x={X(r.ceiling)} y={y - 27} fontSize={10.5} textAnchor="middle" className="tqs-mono" fill={ink2}>{r.ceiling.toFixed(2)}</text>
              </g>
            )}
            {ss.map((s) => (
              <circle key={s.key} cx={X(r[s.key] as number)} cy={y + LANE[s.key]} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={outlined(s.key) ? 1.8 : 2}>
                <title>{`${s.name}: ${(r[s.key] as number).toFixed(3)}`}</title>
              </circle>
            ))}
            <text x={X(r.big)} y={y + LANE.big + 19} fontSize={11} textAnchor="middle" className="tqs-mono" fill="var(--tqs-brand-ink)" fontWeight={600}>
              {r.big.toFixed(2)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function ComparisonFigure() {
  return (
    <figure className="tqs-fig flex flex-col gap-3">
      <Legend />
      <PanelTitle>Scored against a single reviewer, the same footing as reviewer agreement</PanelTitle>
      <div className="overflow-x-auto">
        <DotRows rows={SINGLE_ROWS} lo={0} hi={0.7} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]} axisLabel="Spearman ρ with one held-out reviewer →" />
      </div>
      <PanelTitle>Scored against the combined labels</PanelTitle>
      <div className="overflow-x-auto">
        <DotRows rows={CORR_ROWS} lo={0} hi={0.7} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]} axisLabel="Spearman ρ with the combined label →" />
      </div>
      <div className="overflow-x-auto">
        <DotRows rows={[AUROC_ROW]} lo={0.5} hi={0.8} ticks={[0.5, 0.6, 0.7, 0.8]} chance={0.5} axisLabel="keep/drop AUROC →" />
      </div>
      <div className="overflow-x-auto">
        <DotRows rows={[TAU_ROW]} lo={0.2} hi={0.4} ticks={[0.2, 0.25, 0.3, 0.35, 0.4]} decimals={2} axisLabel="Kendall τ, quality score vs −severity →" />
      </div>
      <figcaption className="text-sm text-muted-foreground">
        One row per metric; further right is better. Baselines sit above each row&apos;s line, models below.
        Top: scored against one held-out reviewer, the fair comparison with reviewer agreement (the vertical tick), the
        8B model (the filled accent dot) reaches 70% of it on underspecification and 77% on false negatives. On
        difficulty every predictor is close to it and the baselines score higher than the model. Below: against the
        combined labels, the 8B model is the best predictor on every metric except difficulty.
      </figcaption>
    </figure>
  )
}

type Gain = { name: string; vs: string; big: [number, number, number]; small: [number, number, number] } // [diff, lo, hi]
const GAINS: Gain[] = [
  { name: 'Underspecification (ρ)', vs: 'vs surface (0.173)', big: [0.185, 0.071, 0.298], small: [0.06, -0.058, 0.166] },
  { name: 'False negatives (ρ)', vs: 'vs length (0.378)', big: [0.102, 0.026, 0.182], small: [0.044, 0.005, 0.083] },
  { name: 'Difficulty (ρ)', vs: 'vs surface (0.655)', big: [-0.032, -0.078, 0.01], small: [-0.004, -0.034, 0.026] },
  { name: 'Keep/drop (AUROC)', vs: 'vs length (0.705)', big: [0.067, 0.013, 0.122], small: [0.018, -0.007, 0.046] },
  { name: 'Quality score vs severity (τ)', vs: 'vs length (0.264)', big: [0.09, 0.018, 0.169], small: [0.028, -0.01, 0.067] },
]
const isReal = (g: [number, number, number]) => g[1] > 0 // interval excludes zero; none lies entirely below

export function GainFigure() {
  const W = 960, left = 230, right = 120, rowH = 56, top = 16
  const H = top + GAINS.length * rowH + 52
  const lo = -0.1, hi = 0.35
  const X = (v: number) => left + ((v - lo) / (hi - lo)) * (W - left - right)
  const sgn = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(3)
  const ci = (g: [number, number, number]) => `${sgn(g[0])} [${sgn(g[1])}, ${sgn(g[2])}]`
  return (
    <figure className="tqs-fig flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="12" aria-hidden><line x1="1" x2="21" y1="6" y2="6" stroke="var(--tqs-brand)" strokeWidth="2.5" /><circle cx="11" cy="6" r="4.5" fill="var(--tqs-brand)" /></svg>
          Qwen3-8B
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="12" aria-hidden><line x1="1" x2="21" y1="6" y2="6" stroke="var(--tqs-ink2)" strokeWidth="2" /><circle cx="11" cy="6" r="4" fill="var(--tqs-card)" stroke="var(--tqs-ink2)" strokeWidth="1.8" /></svg>
          Qwen3-0.6B
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="12" aria-hidden><line x1="1" x2="21" y1="6" y2="6" stroke="var(--tqs-ink2)" strokeWidth="2" /><circle cx="11" cy="6" r="4" fill="var(--tqs-ink2)" stroke="var(--tqs-ink2)" strokeWidth="1.8" /></svg>
          Qwen3-0.6B, interval excludes zero
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="tqs-svg" role="img" aria-label={GAINS.map((g) => `${g.name}, ${g.vs}: 8B ${ci(g.big)}, 0.6B ${ci(g.small)}`).join('; ')}>
          {[-0.1, 0, 0.1, 0.2, 0.3].map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={top - 4} y2={H - 42} stroke={t === 0 ? 'var(--tqs-ink)' : 'var(--tqs-line)'} strokeWidth={t === 0 ? 1.5 : 0.8} opacity={t === 0 ? 1 : 0.6} />
              <text x={X(t)} y={H - 26} fontSize={11} textAnchor="middle" className="tqs-mono" fill={ink2}>{t === 0 ? '0' : sgn(t).replace(/0+$/, '')}</text>
            </g>
          ))}
          <text x={X(hi)} y={H - 6} fontSize={11} textAnchor="end" fill={ink2}>gain over the best baseline →</text>
          {GAINS.map((g, i) => {
            const y = top + i * rowH + rowH / 2
            const realBig = isReal(g.big)
            const realSmall = isReal(g.small)
            return (
              <g key={g.name}>
                <text x={left - 14} y={y - 2} fontSize={12.5} fontWeight={600} textAnchor="end">{g.name}</text>
                <text x={left - 14} y={y + 13} fontSize={11} textAnchor="end" fill={ink2}>{g.vs}</text>
                {/* 0.6B */}
                <line x1={X(g.small[1])} x2={X(g.small[2])} y1={y + 9} y2={y + 9} stroke="var(--tqs-ink2)" strokeWidth={2} strokeLinecap="round" />
                <circle cx={X(g.small[0])} cy={y + 9} r={4} fill={realSmall ? 'var(--tqs-ink2)' : 'var(--tqs-card)'} stroke="var(--tqs-ink2)" strokeWidth={1.8}>
                  <title>{`Qwen3-0.6B: ${ci(g.small)}`}</title>
                </circle>
                {/* 8B */}
                <line x1={X(g.big[1])} x2={X(g.big[2])} y1={y - 7} y2={y - 7} stroke="var(--tqs-brand)" strokeWidth={2.5} strokeLinecap="round" />
                <circle cx={X(g.big[0])} cy={y - 7} r={5} fill="var(--tqs-brand)" stroke="var(--tqs-card)" strokeWidth={1.5}>
                  <title>{`Qwen3-8B: ${ci(g.big)}`}</title>
                </circle>
                <text x={W - right + 12} y={y - 3} fontSize={11} className="tqs-mono" fill={realBig ? 'var(--tqs-brand-ink)' : ink2} fontWeight={realBig ? 600 : 400}>
                  {realBig ? '8B real' : 'no gain'}
                </text>
                {realSmall && (
                  <text x={W - right + 12} y={y + 12} fontSize={10} className="tqs-mono" fill={ink2}>
                    0.6B real
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <figcaption className="text-sm text-muted-foreground">
        Each model minus the best baseline on that metric (named under each row), on the same 298 tasks, with 95%
        paired-bootstrap intervals from 2,000 resamples. A gain is real when its interval excludes zero. The 8B
        model&apos;s gain is real on four of five metrics, all but difficulty; the 0.6B model&apos;s only on false
        negatives (+0.044 [+0.005, +0.083]).
      </figcaption>
    </figure>
  )
}
