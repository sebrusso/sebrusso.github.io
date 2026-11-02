/**
 * Figure for learning 2: what the shallow baselines are (architecture) and how much room they left below the
 * human ceiling (headroom). Static SVG; colors from the --tqs-* tokens in app/writing/tqs-learnings/tqs.css.
 *
 * Numbers: baselines and the 8B model are scored on the same 298 held-out sympy tasks (leave-repo-out); the
 * human ceiling is Spearman(held-out annotator, mean of the other two) on all 1,699 tasks (reports/m0_data.md).
 * Features and model match src/tqs/baselines/surface.py in sebrusso/tqs.
 */

const ink2 = 'var(--tqs-ink2)'

const LENGTH_FEATS = ['issue tokens', 'gold patch tokens', 'test tokens', 'context tokens']
const SHALLOW_FEATS = [
  'files / hunks / lines in patch',
  'files / hunks / lines in tests',
  '# FAIL_TO_PASS, # PASS_TO_PASS',
  '# context files, issue lines',
  'issue has code block / traceback',
  'issue URLs, says “expected/should”',
  'test asserts on message',
]

const AXES = [
  { name: 'Underspecified issue', surface: 0.173, length: 0.156, ceiling: 0.41, t4: 0.358 },
  { name: 'Tests reject valid fixes', surface: 0.341, length: 0.378, ceiling: 0.5, t4: 0.48 },
  { name: 'Difficulty', surface: 0.655, length: 0.618, ceiling: 0.56, t4: 0.623 },
]

function Arch() {
  return (
    <svg viewBox="0 0 960 300" className="tqs-svg" aria-hidden>
      <defs>
        <marker id="tqsD-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--tqs-ink2)" />
        </marker>
      </defs>

      {/* task (never read as text) */}
      <rect x={16} y={86} width={130} height={110} rx={10} fill="var(--tqs-card)" stroke="var(--tqs-line)" />
      <text x={30} y={110} fontSize={13} fontWeight={700}>One task</text>
      {(['issue', 'patch', 'tests', 'context'] as const).map((k, i) => (
        <rect key={k} x={30} y={122 + i * 15} width={[40, 56, 74, 100][i]} height={9} rx={3} fill={`var(--tqs-${k})`} />
      ))}
      <text x={81} y={222} fontSize={11} textAnchor="middle" fill={ink2}>text is never read</text>

      <line x1={150} y1={141} x2={190} y2={141} stroke={ink2} strokeWidth={1.4} markerEnd="url(#tqsD-ah)" />

      {/* features */}
      <rect x={196} y={20} width={300} height={250} rx={10} fill="var(--tqs-muted)" />
      <text x={212} y={44} fontSize={12} fontWeight={700}>21 hand-built features</text>
      <rect x={212} y={56} width={268} height={70} rx={7} fill="var(--tqs-card)" stroke="var(--tqs-context)" strokeWidth={1.5} />
      <text x={224} y={74} fontSize={11} fontWeight={600}>Length baseline: 4 features</text>
      {LENGTH_FEATS.map((f, i) => (
        <text key={f} x={224 + (i % 2) * 130} y={94 + Math.floor(i / 2) * 18} fontSize={10.5} fill={ink2}>· {f}</text>
      ))}
      <text x={212} y={146} fontSize={11} fontWeight={600}>+ 17 more for the surface baseline</text>
      {SHALLOW_FEATS.map((f, i) => (
        <text key={f} x={212} y={166 + i * 15} fontSize={10.5} fill={ink2}>· {f}</text>
      ))}

      <line x1={500} y1={145} x2={540} y2={145} stroke={ink2} strokeWidth={1.4} markerEnd="url(#tqsD-ah)" />

      {/* preprocessing */}
      <rect x={546} y={112} width={104} height={66} rx={8} fill="var(--tqs-card)" stroke="var(--tqs-line)" />
      <text x={598} y={138} fontSize={11.5} textAnchor="middle" className="tqs-mono">log1p</text>
      <text x={598} y={158} fontSize={11.5} textAnchor="middle" className="tqs-mono">standardize</text>

      {/* models */}
      {[
        ['Ordinal logit', 'underspecified', 30],
        ['Ordinal logit', 'tests reject fixes', 92],
        ['Ordinal logit', 'difficulty', 154],
        ['L2 logistic reg.', 'keep / drop', 216],
      ].map(([m, axis, y]) => (
        <g key={axis as string}>
          <path d={`M650,145 C 680,145 680,${(y as number) + 24} 708,${(y as number) + 24}`} fill="none" stroke={ink2} strokeWidth={1.2} markerEnd="url(#tqsD-ah)" />
          <rect x={714} y={y as number} width={150} height={48} rx={8} fill="var(--tqs-card)" stroke="var(--tqs-line)" />
          <text x={726} y={(y as number) + 20} fontSize={11.5} fontWeight={600}>{m}</text>
          <text x={726} y={(y as number) + 37} fontSize={10.5} fill={ink2}>{axis}</text>
        </g>
      ))}
      <text x={876} y={58} fontSize={10.5} fill={ink2}>expected</text>
      <text x={876} y={72} fontSize={10.5} fill={ink2}>rating 0–3</text>
      <text x={876} y={244} fontSize={10.5} fill={ink2}>drop</text>
      <text x={876} y={258} fontSize={10.5} fill={ink2}>score</text>
      <text x={714} y={292} fontSize={10.5} fill={ink2}>price = −(underspecified + tests)</text>
    </svg>
  )
}

function Headroom() {
  const left = 190, right = 40, W = 960, rowH = 58, top = 34
  const X = (v: number) => left + (v / 0.8) * (W - left - right)
  const H = top + AXES.length * rowH + 54
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="tqs-svg">
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={top - 8} y2={H - 46} stroke="var(--tqs-line)" strokeWidth={t === 0 ? 1.4 : 0.8} opacity={t === 0 ? 1 : 0.6} />
          <text x={X(t)} y={H - 28} fontSize={11} textAnchor="middle" className="tqs-mono" fill={ink2}>{t.toFixed(1)}</text>
        </g>
      ))}
      <text x={X(0.8)} y={H - 6} fontSize={11} textAnchor="end" fill={ink2}>Spearman ρ with the human label →</text>

      {AXES.map((a, i) => {
        const y = top + i * rowH + 14
        const best = Math.max(a.surface, a.length)
        const bestName = a.surface >= a.length ? 'surface' : 'length'
        const room = a.ceiling - best
        return (
          <g key={a.name}>
            <text x={left - 14} y={y + 5} fontSize={12.5} fontWeight={600} textAnchor="end">{a.name}</text>
            {/* best baseline bar */}
            <rect x={X(0)} y={y - 9} width={X(best) - X(0)} height={18} rx={4} fill="var(--tqs-frozen)">
              <title>{`best shallow baseline (${bestName}): ρ ${best.toFixed(3)}`}</title>
            </rect>
            {/* headroom up to the ceiling */}
            {room > 0 ? (
              <rect x={X(best)} y={y - 9} width={X(a.ceiling) - X(best)} height={18} fill="var(--tqs-brand-soft)" stroke="var(--tqs-brand)" strokeWidth={1.2} strokeDasharray="4 3">
                <title>{`headroom to the human ceiling: ${room.toFixed(2)}`}</title>
              </rect>
            ) : null}
            {/* human ceiling */}
            <line x1={X(a.ceiling)} x2={X(a.ceiling)} y1={y - 16} y2={y + 16} stroke="var(--tqs-ink)" strokeWidth={2.5} strokeLinecap="round">
              <title>{`human ceiling: ρ ${a.ceiling.toFixed(2)}`}</title>
            </line>
            {/* 8B model, from section 4 */}
            <circle cx={X(a.t4)} cy={y} r={6} fill="var(--tqs-card)" stroke="var(--tqs-brand)" strokeWidth={2.5}>
              <title>{`Qwen3-8B (section 4): ρ ${a.t4.toFixed(3)}`}</title>
            </circle>
            {room > 0 ? (
              <text x={X(a.ceiling) + 14} y={y + 4} fontSize={11.5} className="tqs-mono" fill="var(--tqs-brand-ink)">
                {`${room.toFixed(2)} of headroom`}
              </text>
            ) : (
              <text x={X(0) + 10} y={y + 4} fontSize={11} className="tqs-mono" fill="var(--tqs-frozen-ink)">
                {`no headroom: ${bestName} baseline is ${Math.abs(Math.round(room * 1000) / 1000).toFixed(3)} above the human ceiling`}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function BaselineFigure() {
  return (
    <figure className="tqs-fig flex flex-col gap-5">
      <Arch />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[11px] w-5 rounded-[3px]" style={{ background: 'var(--tqs-frozen)' }} aria-hidden />Best shallow baseline</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[11px] w-5 rounded-[3px] border border-dashed" style={{ background: 'var(--tqs-brand-soft)', borderColor: 'var(--tqs-brand)' }} aria-hidden />Headroom to the human ceiling</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-3.5 w-[3px] rounded" style={{ background: 'var(--tqs-ink)' }} aria-hidden />Human ceiling</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-full border-2" style={{ borderColor: 'var(--tqs-brand)' }} aria-hidden />Qwen3-8B, for later</span>
      </div>
      <Headroom />
      <figcaption className="text-sm text-muted-foreground">
        Top: both baselines see only counts and flags extracted from the task, never its text. Bottom: the better of
        the two baselines on each axis, scored on the 298 held-out sympy tasks, against the human ceiling
        (one annotator against the mean of the other two). Underspecification left the most room. On difficulty the
        length features already beat human agreement, so there was nothing left for a text model to win there.
      </figcaption>
    </figure>
  )
}
