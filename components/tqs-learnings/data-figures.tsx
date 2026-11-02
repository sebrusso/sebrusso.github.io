import { INPUT_LENGTHS } from '../../lib/tqs-learnings-lengths'

/**
 * Data figures for /writing/tqs-learnings: how SWE-bench Verified's annotations were filtered and how TQS uses them
 * (FiltrationFigure), and the distribution of serialized input lengths against the 30,720-token budget
 * (InputLengthFigure). Static SVG; colors from the --tqs-* tokens in app/writing/tqs-learnings/tqs.css.
 * Counts: OpenAI's annotation release (reports/m0_schema.md in sebrusso/tqs) and the leave-repo-out sympy split.
 */

const ink2 = 'var(--tqs-ink2)'
const fmt = (n: number) => n.toLocaleString('en-US')

function Box({ x, y, w, h, title, sub, tone = 'card' }: { x: number; y: number; w: number; h: number; title: string; sub?: string; tone?: 'card' | 'good' | 'bad' | 'brand' }) {
  const fill = tone === 'card' ? 'var(--tqs-card)' : tone === 'brand' ? 'var(--tqs-brand-soft)' : tone === 'good' ? 'var(--tqs-good)' : 'var(--tqs-bad)'
  const stroke = tone === 'brand' ? 'var(--tqs-brand)' : tone === 'card' ? 'var(--tqs-line)' : 'none'
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} fillOpacity={tone === 'good' || tone === 'bad' ? 0.14 : 1} stroke={tone === 'good' || tone === 'bad' ? fill : stroke} strokeWidth={1.2} />
      <text x={x + 12} y={y + (sub ? 22 : h / 2 + 4)} fontSize={12.5} fontWeight={700}>{title}</text>
      {sub && <text x={x + 12} y={y + 40} fontSize={11} fill={ink2}>{sub}</text>}
    </g>
  )
}

function Arrow({ d, id }: { d: string; id: string }) {
  return <path d={d} fill="none" stroke={ink2} strokeWidth={1.3} markerEnd={`url(#${id})`} />
}

export function FiltrationFigure() {
  const id = 'tqsF-ah'
  // proportional bar of the 1,699 reviewed tasks
  const bx = 300, bw = 620, total = 1699
  const W = (n: number) => (n / total) * bw
  return (
    <figure className="tqs-fig flex flex-col gap-3">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 960 440" className="tqs-svg" role="img" aria-label="SWE-bench test set of 2,294 tasks; 1,699 sampled and reviewed by 3 of 93 annotators each (5,097 annotations); labels max-ensembled; filter drops 1,160 tasks and keeps 539, from which 500 form SWE-bench Verified. TQS keeps all 1,699 as labeled examples, split leave-repo-out into 1,260 train, 141 validation and 298 sympy test tasks.">
          <defs>
            <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--tqs-ink2)" />
            </marker>
          </defs>

          {/* shared trunk */}
          <Box x={10} y={20} w={220} h={54} title="SWE-bench test set" sub="2,294 tasks · 12 Python repos" />
          <Arrow d="M120,74 L120,104" id={id} />
          <Box x={10} y={108} w={220} h={54} title="1,699 sampled for review" sub="3 of 93 developers each" />
          <Arrow d="M120,162 L120,192" id={id} />
          <Box x={10} y={196} w={220} h={54} title="5,097 annotations" sub="underspec · false neg · difficulty · other" />
          <Arrow d="M120,250 L120,280" id={id} />
          <Box x={10} y={284} w={220} h={54} title="Ensembled labels" sub="max of 3 for severity axes" />

          {/* branch 1: SWE-bench Verified */}
          <text x={bx} y={30} fontSize={11} fontWeight={600} fill={ink2} letterSpacing="0.05em">SWE-BENCH VERIFIED (OPENAI)</text>
          <Arrow d={`M230,311 C 262,311 262,62 ${bx - 6},62`} id={id} />
          <rect x={bx} y={44} width={bw} height={36} rx={8} fill="var(--tqs-muted)" />
          <text x={bx + 12} y={67} fontSize={12} className="tqs-mono">drop if underspecified ≥ 2 or false_negative ≥ 2 or other_major_issues</text>
          <Arrow d={`M${bx + bw / 2},80 L${bx + bw / 2},102`} id={id} />
          {/* proportional split */}
          <rect x={bx} y={106} width={W(1160) - 2} height={30} rx={5} fill="var(--tqs-bad)" fillOpacity={0.75}>
            <title>1,160 filtered (68%)</title>
          </rect>
          <rect x={bx + W(1160)} y={106} width={W(539)} height={30} rx={5} fill="var(--tqs-good)" fillOpacity={0.75}>
            <title>539 pass</title>
          </rect>
          <text x={bx + 10} y={126} fontSize={12} fontWeight={700} fill="var(--tqs-on-brand)">1,160 filtered (68%)</text>
          <text x={bx + W(1160) + 10} y={126} fontSize={12} fontWeight={700} fill="var(--tqs-on-brand)">539 pass</text>
          <path d={`M${bx + W(1160) + W(539) / 2},136 L${bx + W(1160) + W(539) / 2},160`} fill="none" stroke={ink2} strokeWidth={1.3} markerEnd={`url(#${id})`} />
          <Box x={bx + W(1160) - 60} y={164} w={W(539) + 60} h={44} title="500 → SWE-bench Verified" tone="good" />
          <text x={bx} y={190} fontSize={11} fill={ink2}>39 passing tasks left out</text>
          <text x={bx} y={204} fontSize={11} fill={ink2}>(environment issues, subsampling)</text>

          {/* branch 2: TQS */}
          <text x={bx} y={262} fontSize={11} fontWeight={600} fill="var(--tqs-brand-ink)" letterSpacing="0.05em">TQS (THIS WORK)</text>
          <Arrow d={`M230,311 L${bx - 6},311`} id={id} />
          <Box x={bx} y={282} w={250} h={58} title="All 1,699 kept as examples" sub="task text in → 3 labels out; no hints" tone="brand" />
          <Arrow d={`M${bx + 250},311 L${bx + 286},311`} id={id} />
          {/* split bar */}
          {(() => {
            const sx = bx + 292, sw = 328, T = 1699
            const parts: [string, number, string][] = [['train', 1260, 'var(--tqs-frozen)'], ['val', 141, 'var(--tqs-ink2)'], ['test · sympy', 298, 'var(--tqs-brand)']]
            let x = sx
            return (
              <g>
                <text x={sx} y={276} fontSize={11} fill={ink2}>leave-repo-out split (fold: sympy)</text>
                {parts.map(([name, n, c]) => {
                  const w = (n / T) * sw
                  const r = (
                    <g key={name}>
                      <rect x={x} y={290} width={w - 2} height={30} rx={4} fill={c}>
                        <title>{`${name}: ${fmt(n)} tasks`}</title>
                      </rect>
                      <text x={x + 2} y={340} fontSize={11} className="tqs-mono" fill={ink2}>{fmt(n)}</text>
                      <text x={x + 2} y={354} fontSize={10.5} fill={ink2}>{name}</text>
                    </g>
                  )
                  x += w
                  return r
                })}
              </g>
            )
          })()}
          <text x={bx} y={392} fontSize={11} fill={ink2}>
            Unlike Verified, TQS trains on filtered and kept tasks alike: the filtered ones are the positive examples of bad tasks.
          </text>
          <text x={bx} y={408} fontSize={11} fill={ink2}>other_major_issues is not a training target (Krippendorff α 0.09); it only enters the filter label.</text>
        </svg>
      </div>
      <figcaption className="text-sm text-muted-foreground">
        Top: how OpenAI went from 1,699 reviewed tasks to the 500 in SWE-bench Verified. Bottom: TQS keeps every
        reviewed task, because the filtered ones carry the signal it learns from, and holds out all of sympy for testing.
      </figcaption>
    </figure>
  )
}

export function InputLengthFigure() {
  const D = INPUT_LENGTHS
  const W = 960, H = 330, left = 56, right = 24, top = 40, bottom = 56
  const lo = 300, hi = 400000
  const X = (v: number) => left + (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) * (W - left - right)
  const ymax = 180
  const Y = (n: number) => top + (1 - n / ymax) * (H - top - bottom)
  const pct = ((D.overflow / D.n) * 100).toFixed(1)
  const trimMax = Math.max(...D.trim.slice(1).map((t) => t[1]))
  return (
    <figure className="tqs-fig flex flex-col gap-4">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="tqs-svg" role="img" aria-label={`Histogram of serialized input lengths for ${fmt(D.n)} tasks on a log scale. Median ${fmt(D.median)} tokens, 90th percentile ${fmt(D.p90)}, maximum ${fmt(D.max)}. ${D.overflow} tasks (${pct}%) exceed the ${fmt(D.budget)}-token budget.`}>
          {/* overflow region */}
          <rect x={X(D.budget)} y={top - 14} width={X(hi) - X(D.budget)} height={H - top - bottom + 14} fill="var(--tqs-brand-soft)" opacity={0.6} />
          {[0, 50, 100, 150].map((t) => (
            <g key={t}>
              <line x1={left} x2={W - right} y1={Y(t)} y2={Y(t)} stroke="var(--tqs-line)" strokeWidth={t === 0 ? 1.4 : 0.8} opacity={t === 0 ? 1 : 0.6} />
              <text x={left - 8} y={Y(t) + 4} fontSize={11} textAnchor="end" className="tqs-mono" fill={ink2}>{t}</text>
            </g>
          ))}
          <text x={left - 8} y={top - 22} fontSize={11} fill={ink2}>tasks</text>
          {D.bins.map((b) =>
            b.n > 0 ? (
              <rect key={b.lo} x={X(b.lo) + 1} y={Y(b.n)} width={Math.max(1, X(b.hi) - X(b.lo) - 2)} height={Y(0) - Y(b.n)} rx={2} fill={b.lo >= D.budget ? 'var(--tqs-brand)' : 'var(--tqs-frozen)'}>
                <title>{`${fmt(b.lo)}–${fmt(b.hi)} tokens: ${b.n} tasks`}</title>
              </rect>
            ) : null
          )}
          {[1000, 3000, 10000, 30000, 100000, 300000].map((t) => (
            <text key={t} x={X(t)} y={H - bottom + 18} fontSize={11} textAnchor="middle" className="tqs-mono" fill={ink2}>
              {t >= 1000 ? `${t / 1000}k` : t}
            </text>
          ))}
          <text x={(left + W - right) / 2} y={H - 12} fontSize={11.5} textAnchor="middle" fill={ink2}>
            serialized input length before truncation (tokens, log scale)
          </text>
          {/* budget + median */}
          <line x1={X(D.budget)} x2={X(D.budget)} y1={top - 14} y2={Y(0)} stroke="var(--tqs-ink)" strokeWidth={2} />
          <text x={X(D.budget) + 8} y={top - 2} fontSize={11.5} fontWeight={600}>{`${fmt(D.budget)}-token budget`}</text>
          <text x={X(D.budget) + 8} y={top + 13} fontSize={11.5} fill="var(--tqs-brand-ink)" fontWeight={600}>{`${D.overflow} tasks (${pct}%) overflow`}</text>
          <line x1={X(D.median)} x2={X(D.median)} y1={top + 24} y2={Y(0)} stroke="var(--tqs-ink)" strokeWidth={1.2} strokeDasharray="4 3" />
          <text x={X(D.median) - 6} y={top + 20} fontSize={11} textAnchor="end" fill={ink2}>{`median ${fmt(D.median)}`}</text>
        </svg>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-3 text-xs md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold">How far code context was cut ({fmt(D.n)} tasks)</span>
          {D.trim.map(([name, n], i) => (
            <div key={name} className="grid grid-cols-[8.5rem_minmax(0,1fr)_3rem] items-center gap-2">
              <span className="text-muted-foreground">{name}</span>
              <span className="h-2.5 rounded-sm" style={{ width: i === 0 ? '100%' : `${Math.max(2, (n / trimMax) * 60)}%`, background: i === 0 ? 'var(--tqs-frozen)' : 'var(--tqs-brand)' }} />
              <span className="text-right font-mono">{fmt(n)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 text-muted-foreground">
          <span className="font-semibold text-foreground">What overflowed</span>
          <span>Code context absorbs nearly all of it: {D.overflow} tasks had context trimmed, most only to ±200-line windows around the changed hunks.</span>
          <span>After context, the tests were cut in {D.testsCut} tasks and the gold patch in {D.patchCut}. No issue text was ever cut ({D.issueCut}).</span>
          <span>{`90th percentile ${fmt(D.p90)} tokens; longest task ${fmt(D.max)}.`}</span>
        </div>
      </div>
      <figcaption className="text-sm text-muted-foreground">
        Every annotated task, by the length of its four serialized parts before truncation. Tasks to the right of the
        line exceed the prefill budget and are trimmed, code context first. The bar for &quot;whole files fit&quot; is
        not to scale with the others.
      </figcaption>
    </figure>
  )
}
