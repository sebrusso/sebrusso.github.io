/**
 * Results figures for /writing/tqs-learnings, all on the 298 held-out sympy tasks (leave-repo-out):
 *  - ComparisonFigure: each metric's score for the two baselines and both models, plus the human ceiling.
 *  - GainFigure: each model's gain over the surface baseline with 95% paired-bootstrap intervals (2,000 resamples).
 * Values: sebrusso/tqs reports/t4_8b_32k_eval.md (8B), reports/t1_smoke_0p6b_eval.md (0.6B), reports/m1_baselines.md.
 * Human ceiling: Spearman(held-out annotator, mean of the other two) on all 1,699 tasks (reports/m0_data.md).
 */

const ink2 = 'var(--tqs-ink2)'

type Series = 'length' | 'surface' | 'small' | 'big'
const SERIES: { key: Series; name: string; fill: string; stroke: string; r: number }[] = [
  { key: 'length', name: 'Length baseline', fill: 'var(--tqs-card)', stroke: 'var(--tqs-ink2)', r: 5 },
  { key: 'surface', name: 'Surface baseline', fill: 'var(--tqs-ink2)', stroke: 'var(--tqs-card)', r: 5 },
  { key: 'small', name: 'Qwen3-0.6B (8k context)', fill: 'var(--tqs-brand-soft)', stroke: 'var(--tqs-brand)', r: 6 },
  { key: 'big', name: 'Qwen3-8B (32k context)', fill: 'var(--tqs-brand)', stroke: 'var(--tqs-card)', r: 7 },
]

type Row = { name: string; length: number; surface: number; small: number; big: number; ceiling?: number }
const CORR_ROWS: Row[] = [
  { name: 'Underspecified issue (ρ)', length: 0.156, surface: 0.173, small: 0.233, big: 0.358, ceiling: 0.41 },
  { name: 'Tests reject valid fixes (ρ)', length: 0.378, surface: 0.341, small: 0.422, big: 0.48, ceiling: 0.5 },
  { name: 'Difficulty (ρ)', length: 0.618, surface: 0.655, small: 0.651, big: 0.623, ceiling: 0.56 },
  { name: 'Price score vs. severity (τ)', length: 0.264, surface: 0.225, small: 0.291, big: 0.354 },
]
const AUROC_ROW: Row = { name: 'Keep/drop decision (AUROC)', length: 0.705, surface: 0.7, small: 0.724, big: 0.772 }

function Legend({ ceiling = true }: { ceiling?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {SERIES.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden>
            <circle cx="7" cy="7" r={s.r - 1} fill={s.fill} stroke={s.key === 'length' || s.key === 'small' ? s.stroke : 'none'} strokeWidth={1.8} />
          </svg>
          {s.name}
        </span>
      ))}
      {ceiling && (
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-3.5 w-[3px] rounded" style={{ background: 'var(--tqs-ink)' }} aria-hidden />
          Human ceiling
        </span>
      )}
    </div>
  )
}

function DotRows({ rows, lo, hi, ticks, chance, axisLabel }: { rows: Row[]; lo: number; hi: number; ticks: number[]; chance?: number; axisLabel: string }) {
  const W = 960, left = 230, right = 30, rowH = 44, top = 14
  const H = top + rows.length * rowH + 42
  const X = (v: number) => left + ((v - lo) / (hi - lo)) * (W - left - right)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="tqs-svg" role="img" aria-label={rows.map((r) => `${r.name}: length ${r.length}, surface ${r.surface}, 0.6B ${r.small}, 8B ${r.big}${r.ceiling ? `, human ceiling ${r.ceiling}` : ''}`).join('; ')}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={top - 4} y2={H - 34} stroke="var(--tqs-line)" strokeWidth={chance === t ? 1.4 : 0.8} opacity={chance === t ? 1 : 0.6} />
          <text x={X(t)} y={H - 18} fontSize={11} textAnchor="middle" className="tqs-mono" fill={ink2}>{t.toFixed(1)}</text>
        </g>
      ))}
      {chance !== undefined && <text x={X(chance) + 6} y={top + 6} fontSize={10.5} fill={ink2}>chance</text>}
      <text x={X(hi)} y={H - 2} fontSize={11} textAnchor="end" fill={ink2}>{axisLabel}</text>
      {rows.map((r, i) => {
        const y = top + i * rowH + rowH / 2
        const vals = SERIES.map((s) => r[s.key])
        return (
          <g key={r.name}>
            <text x={left - 14} y={y + 4} fontSize={12.5} fontWeight={600} textAnchor="end">{r.name}</text>
            <line x1={X(Math.min(...vals))} x2={X(Math.max(...vals))} y1={y} y2={y} stroke="var(--tqs-line)" strokeWidth={3} strokeLinecap="round" />
            {r.ceiling !== undefined && (
              <line x1={X(r.ceiling)} x2={X(r.ceiling)} y1={y - 13} y2={y + 13} stroke="var(--tqs-ink)" strokeWidth={2.5} strokeLinecap="round">
                <title>{`human ceiling: ${r.ceiling.toFixed(2)}`}</title>
              </line>
            )}
            {SERIES.map((s) => (
              <circle key={s.key} cx={X(r[s.key])} cy={y} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={s.key === 'length' || s.key === 'small' ? 1.8 : 2}>
                <title>{`${s.name}: ${r[s.key].toFixed(3)}`}</title>
              </circle>
            ))}
            <text x={X(r.big)} y={y - 12} fontSize={11} textAnchor="middle" className="tqs-mono" fill="var(--tqs-brand-ink)" fontWeight={600}>
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
      <div className="overflow-x-auto">
        <DotRows rows={CORR_ROWS} lo={0} hi={0.7} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]} axisLabel="correlation with the human label →" />
      </div>
      <div className="overflow-x-auto">
        <DotRows rows={[AUROC_ROW]} lo={0.5} hi={0.8} ticks={[0.5, 0.6, 0.7, 0.8]} chance={0.5} axisLabel="AUROC →" />
      </div>
      <figcaption className="text-sm text-muted-foreground">
        One row per metric; further right is better. The 8B model (filled orange) is the best predictor on every axis
        except difficulty, where all four sit at or above the human ceiling because task length already explains the
        labels. The gap is widest on underspecification, the axis shallow features miss.
      </figcaption>
    </figure>
  )
}

type Gain = { name: string; big: [number, number, number]; small: [number, number, number] } // [diff, lo, hi]
const GAINS: Gain[] = [
  { name: 'Underspecified issue (ρ)', big: [0.185, 0.071, 0.298], small: [0.06, -0.058, 0.166] },
  { name: 'Tests reject valid fixes (ρ)', big: [0.139, 0.057, 0.223], small: [0.081, 0.02, 0.142] },
  { name: 'Difficulty (ρ)', big: [-0.032, -0.078, 0.01], small: [-0.004, -0.034, 0.026] },
  { name: 'Keep/drop decision (AUROC)', big: [0.073, 0.014, 0.133], small: [0.024, -0.019, 0.065] },
  { name: 'Price score vs. severity (τ)', big: [0.129, 0.049, 0.207], small: [0.066, 0.012, 0.12] },
]

export function GainFigure() {
  const W = 960, left = 230, right = 120, rowH = 52, top = 16
  const H = top + GAINS.length * rowH + 52
  const lo = -0.15, hi = 0.35
  const X = (v: number) => left + ((v - lo) / (hi - lo)) * (W - left - right)
  const sgn = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(3)
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
          <i className="inline-block h-3 w-5 rounded-sm" style={{ background: 'var(--tqs-muted)' }} aria-hidden />
          ±0.10 noise floor (underspecification, measured beforehand)
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="tqs-svg" role="img" aria-label={GAINS.map((g) => `${g.name}: 8B ${sgn(g.big[0])} [${sgn(g.big[1])}, ${sgn(g.big[2])}], 0.6B ${sgn(g.small[0])} [${sgn(g.small[1])}, ${sgn(g.small[2])}]`).join('; ')}>
          {/* noise floor band on the underspecification row */}
          <rect x={X(-0.1)} y={top + 2} width={X(0.1) - X(-0.1)} height={rowH - 4} rx={4} fill="var(--tqs-muted)" />
          {[-0.1, 0, 0.1, 0.2, 0.3].map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={top - 4} y2={H - 42} stroke={t === 0 ? 'var(--tqs-ink)' : 'var(--tqs-line)'} strokeWidth={t === 0 ? 1.5 : 0.8} opacity={t === 0 ? 1 : 0.6} />
              <text x={X(t)} y={H - 26} fontSize={11} textAnchor="middle" className="tqs-mono" fill={ink2}>{t === 0 ? '0' : sgn(t).replace(/0+$/, '')}</text>
            </g>
          ))}
          <text x={X(hi)} y={H - 6} fontSize={11} textAnchor="end" fill={ink2}>gain over the surface baseline →</text>
          {GAINS.map((g, i) => {
            const y = top + i * rowH + rowH / 2
            const real = g.big[1] > 0
            return (
              <g key={g.name}>
                <text x={left - 14} y={y + 4} fontSize={12.5} fontWeight={600} textAnchor="end">{g.name}</text>
                {/* 0.6B */}
                <line x1={X(g.small[1])} x2={X(g.small[2])} y1={y + 9} y2={y + 9} stroke="var(--tqs-ink2)" strokeWidth={2} strokeLinecap="round" />
                <circle cx={X(g.small[0])} cy={y + 9} r={4} fill="var(--tqs-card)" stroke="var(--tqs-ink2)" strokeWidth={1.8}>
                  <title>{`Qwen3-0.6B: ${sgn(g.small[0])} [${sgn(g.small[1])}, ${sgn(g.small[2])}]`}</title>
                </circle>
                {/* 8B */}
                <line x1={X(g.big[1])} x2={X(g.big[2])} y1={y - 7} y2={y - 7} stroke="var(--tqs-brand)" strokeWidth={2.5} strokeLinecap="round" />
                <circle cx={X(g.big[0])} cy={y - 7} r={5} fill="var(--tqs-brand)" stroke="var(--tqs-card)" strokeWidth={1.5}>
                  <title>{`Qwen3-8B: ${sgn(g.big[0])} [${sgn(g.big[1])}, ${sgn(g.big[2])}]`}</title>
                </circle>
                <text x={W - right + 12} y={y - 3} fontSize={11} className="tqs-mono" fill={real ? 'var(--tqs-brand-ink)' : ink2} fontWeight={real ? 600 : 400}>
                  {real ? 'real gain' : 'no gain'}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <figcaption className="text-sm text-muted-foreground">
        Each model minus the surface baseline on the same 298 tasks, with 95% paired-bootstrap intervals. A gain is
        real when its interval stays right of zero. The 8B model clears zero on four of five metrics. On
        underspecification its gain (+0.19) is also larger than the ±0.10 noise floor set before the run, though the
        low end of its interval (+0.07) falls inside it; the 0.6B model&apos;s gain (+0.06) is within the floor.
      </figcaption>
    </figure>
  )
}
