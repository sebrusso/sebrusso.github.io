import type { ReactNode } from 'react'
import { TASK_SCORES } from '../../lib/tqs-learnings-scores'

/**
 * Three static SVG figures for /writing/tqs-learnings: the architecture (A),
 * the pairwise objective (B), and every held-out task by model score (C).
 * Server-rendered, no client JS; tooltips use SVG <title>. Colors come from
 * the --tqs-* tokens in app/writing/tqs-learnings/tqs.css (light + dark).
 */

const ink2 = 'var(--tqs-ink2)'

function Arrowheads({ id }: { id: string }) {
  return (
    <defs>
      <marker id={`${id}-ah`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--tqs-ink2)" />
      </marker>
      <marker id={`${id}-ahb`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--tqs-brand)" />
      </marker>
    </defs>
  )
}

function Frame({ label, children, legend }: { label: string; children: ReactNode; legend?: ReactNode }) {
  return (
    <figure className="tqs-fig flex flex-col gap-3">
      {legend}
      <div className="overflow-x-auto">{children}</div>
      <span className="sr-only">{label}</span>
    </figure>
  )
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map(([color, name]) => (
        <span key={name} className="inline-flex items-center gap-1.5">
          <i className="inline-block h-[11px] w-[11px] rounded-[3px]" style={{ background: color }} aria-hidden />
          {name}
        </span>
      ))}
    </div>
  )
}

/* ── A · architecture ───────────────────────────────────────────────── */

export function ArchitectureFigure() {
  // Token grid: proportions of a typical task, last cell = the final token the model pools.
  const parts: [string, number][] = [['var(--tqs-issue)', 10], ['var(--tqs-patch)', 12], ['var(--tqs-tests)', 22], ['var(--tqs-context)', 83]]
  const cells: { x: number; y: number; fill: string }[] = []
  const cols = 8, cell = 15, x0 = 22, y0 = 52
  let i = 0
  for (const [fill, n] of parts) for (let k = 0; k < n; k++, i++) cells.push({ x: x0 + (i % cols) * (cell + 3), y: y0 + Math.floor(i / cols) * (cell + 3), fill })
  const last = { x: x0 + (i % cols) * (cell + 3), y: y0 + Math.floor(i / cols) * (cell + 3) }

  const lx = 236, lw = 200, lh = 30, gap = 12, ly0 = 52
  const layers = Array.from({ length: 6 }, (_, k) => ({ k, y: ly0 + k * (lh + gap) + (k >= 3 ? 26 : 0) }))
  const vecShades = [0.95, 0.4, 0.7, 0.25, 0.85, 0.55, 0.3, 0.9, 0.45, 0.65, 0.2, 0.75, 0.5, 0.35, 0.8, 0.6]
  const heads: [string, number][] = [['Underspecified', 52], ['Tests reject fixes', 120], ['Difficulty', 188]]

  return (
    <Frame
      label="Architecture: a task's tokens go through Qwen3-8B, whose 36 layers are frozen except for small LoRA adapters. The final token's 4,096-number vector feeds three rating heads and a price head, trained with a rating loss against annotators and a pairwise loss."
      legend={
        <Legend
          items={[
            ['var(--tqs-issue)', 'Issue'], ['var(--tqs-patch)', 'Gold patch'], ['var(--tqs-tests)', 'Tests'],
            ['var(--tqs-context)', 'Code context'], ['var(--tqs-frozen)', 'Frozen'], ['var(--tqs-brand)', 'Trained'],
          ]}
        />
      }
    >
      <svg viewBox="0 0 960 380" className="tqs-svg" aria-hidden>
        <Arrowheads id="tqsA" />
        {cells.map((c, j) => (
          <rect key={j} x={c.x} y={c.y} width={cell} height={cell} rx={3} fill={c.fill} />
        ))}
        <rect x={last.x - 1.5} y={last.y - 1.5} width={cell + 3} height={cell + 3} rx={4} fill="none" stroke="var(--tqs-brand)" strokeWidth={2} />
        <text x={20} y={352} fontSize={13} fontWeight={600}>One task</text>
        <text x={20} y={368} className="tqs-sub">up to 30,720 tokens</text>

        <line x1={178} y1={190} x2={222} y2={190} stroke={ink2} strokeWidth={1.5} markerEnd="url(#tqsA-ah)" />

        {layers.map(({ k, y }) => (
          <g key={k}>
            <rect x={lx} y={y} width={lw} height={lh} rx={6} fill="var(--tqs-frozen)" />
            <text x={lx + 12} y={y + 19} fontSize={11} fill="var(--tqs-frozen-ink)">
              {k === 0 ? 'layer 36' : k === 5 ? 'layer 1' : 'transformer layer'}
            </text>
            <rect x={lx + lw + 6} y={y + 5} width={34} height={lh - 10} rx={4} fill="var(--tqs-brand)" />
            <text x={lx + lw + 23} y={y + 19} fontSize={9.5} textAnchor="middle" fontWeight={600} fill="var(--tqs-on-brand)">LoRA</text>
            {k < 5 && (
              <line x1={lx + lw / 2} y1={y + lh + (k === 2 ? 26 + gap : gap)} x2={lx + lw / 2} y2={y + lh} stroke={ink2} strokeWidth={1.2} markerEnd="url(#tqsA-ah)" />
            )}
          </g>
        ))}
        <text x={lx + lw / 2} y={ly0 + 3 * (lh + gap) + 6} fontSize={18} textAnchor="middle" fill={ink2}>⋮</text>
        <text x={236} y={352} fontSize={13} fontWeight={600}>Qwen3-8B</text>
        <text x={236} y={368} className="tqs-sub">36 layers frozen · LoRA adapters train 0.5%</text>

        <line x1={488} y1={70} x2={532} y2={70} stroke="var(--tqs-brand)" strokeWidth={1.5} markerEnd="url(#tqsA-ahb)" />
        <text x={487} y={58} className="tqs-sub">last token</text>

        {vecShades.map((o, k) => (
          <rect key={k} x={540} y={52 + k * 16.5} width={26} height={14} rx={2} fill="var(--tqs-brand)" opacity={o} />
        ))}
        <text x={540} y={352} fontSize={13} fontWeight={600}>h</text>
        <text x={540} y={368} className="tqs-sub">4,096 numbers</text>

        {heads.map(([name, y]) => (
          <g key={name}>
            <path d={`M570,${y + 4} C 610,${y + 4} 610,${y + 20} 650,${y + 20}`} fill="none" stroke={ink2} strokeWidth={1.2} markerEnd="url(#tqsA-ah)" />
            <rect x={656} y={y} width={132} height={48} rx={8} fill="var(--tqs-brand-soft)" stroke="var(--tqs-brand)" strokeWidth={1.2} />
            <text x={668} y={y + 17} fontSize={11.5} fontWeight={600}>{name}</text>
            {['P>0', 'P>1', 'P>2'].map((p, j) => (
              <g key={p}>
                <rect x={668 + j * 38} y={y + 25} width={34} height={16} rx={3} fill="var(--tqs-card)" stroke="var(--tqs-line)" />
                <text x={685 + j * 38} y={y + 37} fontSize={9.5} textAnchor="middle" className="tqs-mono" fill={ink2}>{p}</text>
              </g>
            ))}
          </g>
        ))}
        <path d="M570,300 C 610,300 610,272 650,272" fill="none" stroke={ink2} strokeWidth={1.2} markerEnd="url(#tqsA-ah)" />
        <rect x={656} y={252} width={132} height={40} rx={8} fill="var(--tqs-brand-soft)" stroke="var(--tqs-brand)" strokeWidth={1.2} />
        <text x={668} y={270} fontSize={11.5} fontWeight={600}>Price</text>
        <text x={668} y={285} fontSize={10.5} fill={ink2}>one score s</text>
        <text x={656} y={352} fontSize={13} fontWeight={600}>4 heads</text>
        <text x={656} y={368} className="tqs-sub">trained from scratch</text>

        {[76, 144, 212].map((y) => (
          <line key={y} x1={790} y1={y} x2={842} y2={144} stroke={ink2} strokeWidth={1.1} />
        ))}
        <circle cx={872} cy={144} r={30} fill="var(--tqs-card)" stroke="var(--tqs-ink)" strokeWidth={1.5} />
        <text x={872} y={141} fontSize={11} textAnchor="middle" fontWeight={600}>rating</text>
        <text x={872} y={155} fontSize={11} textAnchor="middle">loss</text>
        <text x={872} y={192} fontSize={10.5} textAnchor="middle" fill={ink2}>vs 3 annotators</text>
        <line x1={790} y1={272} x2={842} y2={272} stroke={ink2} strokeWidth={1.1} />
        <circle cx={872} cy={272} r={30} fill="var(--tqs-card)" stroke="var(--tqs-ink)" strokeWidth={1.5} />
        <text x={872} y={269} fontSize={11} textAnchor="middle" fontWeight={600}>pair</text>
        <text x={872} y={283} fontSize={11} textAnchor="middle">loss</text>
        <text x={872} y={320} fontSize={10.5} textAnchor="middle" fill={ink2}>better task &gt; worse</text>
      </svg>
    </Frame>
  )
}

/* ── B · pair comparison ────────────────────────────────────────────── */

function TaskCard({ y, tag, id, flaw, parts }: { y: number; tag: string; id: string; flaw: boolean; parts: [string, number][] }) {
  const total = parts.reduce((s, p) => s + p[1], 0)
  let x = 36
  const bars = parts.map(([fill, w]) => {
    const ww = (w / total) * 158 - 3
    const r = { x, w: ww, fill }
    x += ww + 3
    return r
  })
  const tone = flaw ? 'var(--tqs-bad)' : 'var(--tqs-good)'
  return (
    <g>
      <rect x={20} y={y} width={190} height={110} rx={10} fill="var(--tqs-card)" stroke="var(--tqs-line)" />
      <text x={36} y={y + 26} fontSize={14} fontWeight={700}>Task {tag}</text>
      <text x={194} y={y + 26} fontSize={11} textAnchor="end" className="tqs-mono" fill={ink2}>{id}</text>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={y + 40} width={b.w} height={12} rx={3} fill={b.fill} />
      ))}
      <rect x={36} y={y + 66} width={158} height={28} rx={6} fill={tone} opacity={0.14} />
      <text x={46} y={y + 85} fontSize={11.5} fontWeight={600} fill={tone}>
        {flaw ? '✕ tests reject valid fixes' : '✓ clear issue, fair tests'}
      </text>
    </g>
  )
}

function Encoder({ y }: { y: number }) {
  return (
    <g>
      <line x1={214} y1={y + 55} x2={262} y2={y + 55} stroke={ink2} strokeWidth={1.5} markerEnd="url(#tqsB-ah)" />
      <rect x={268} y={y + 15} width={150} height={80} rx={10} fill="var(--tqs-frozen)" />
      <rect x={268} y={y + 15} width={10} height={80} rx={3} fill="var(--tqs-brand)" />
      <text x={350} y={y + 51} fontSize={13} fontWeight={700} textAnchor="middle" fill="var(--tqs-frozen-ink)">Qwen3-8B</text>
      <text x={350} y={y + 68} fontSize={11} textAnchor="middle" fill="var(--tqs-frozen-ink)">+ LoRA</text>
    </g>
  )
}

function MiniRatings({ x, y, vals }: { x: number; y: number; vals: number[] }) {
  return (
    <g>
      {vals.map((v, i) => (
        <g key={i}>
          <rect x={x} y={y + i * 13} width={60} height={6} rx={3} fill="var(--tqs-muted)" />
          <rect x={x} y={y + i * 13} width={Math.max(3, (v / 3) * 60)} height={6} rx={3} fill="var(--tqs-brand)" />
        </g>
      ))}
      <text x={x + 65} y={y + 6} fontSize={10} fill={ink2}>ratings</text>
    </g>
  )
}

export function PairFigure() {
  const sx = (s: number) => 560 + ((s + 2) / 8) * 320 // axis −2..6, x 560..880
  const sA = 4.7, sB = -0.47
  return (
    <Frame label="Two tasks go through the same model and each gets one score. Task A, the clean one, scores 4.70; task B, whose tests reject valid fixes, scores −0.47. Training pushes the scores apart; this pair's loss is about 0.006 because they are already in the right order.">
      <svg viewBox="0 0 960 400" className="tqs-svg" aria-hidden>
        <Arrowheads id="tqsB" />
        <TaskCard y={30} tag="A" id="sympy-23534" flaw={false} parts={[['var(--tqs-issue)', 2], ['var(--tqs-patch)', 2], ['var(--tqs-tests)', 2], ['var(--tqs-context)', 6]]} />
        <TaskCard y={250} tag="B" id="sympy-13806" flaw parts={[['var(--tqs-issue)', 1], ['var(--tqs-patch)', 3], ['var(--tqs-tests)', 3], ['var(--tqs-context)', 7]]} />
        <Encoder y={30} />
        <Encoder y={250} />
        <line x1={343} y1={128} x2={343} y2={262} stroke="var(--tqs-brand)" strokeWidth={1.5} strokeDasharray="4 4" />
        <rect x={292} y={182} width={102} height={22} rx={11} fill="var(--tqs-card)" stroke="var(--tqs-brand)" />
        <text x={343} y={197} fontSize={11} textAnchor="middle" fontWeight={600} fill="var(--tqs-brand-ink)">same weights</text>

        {/* A's curve drops onto its dot from above, B's rises from below, so neither crosses the axis. */}
        <path d={`M422,85 C ${sx(sA) - 40},85 ${sx(sA)},110 ${sx(sA)},180`} fill="none" stroke={ink2} strokeWidth={1.3} markerEnd="url(#tqsB-ah)" />
        <path d={`M422,305 C ${sx(sB) - 30},305 ${sx(sB)},290 ${sx(sB)},220`} fill="none" stroke={ink2} strokeWidth={1.3} markerEnd="url(#tqsB-ah)" />
        {([[85, 'A', sA, -8], [305, 'B', sB, 18]] as const).map(([y, tag, s, dy]) => (
          <g key={tag}>
            <text x={438} y={y + dy} fontSize={12} className="tqs-mono">
              s<tspan fontSize={9} dy={3}>{tag}</tspan>
              <tspan dy={-3}> = {s.toFixed(2)}</tspan>
            </text>
          </g>
        ))}
        <MiniRatings x={438} y={100} vals={[0.55, 0.31, 0.2]} />
        <MiniRatings x={438} y={334} vals={[2.01, 2.78, 1.99]} />

        <line x1={560} y1={200} x2={880} y2={200} stroke="var(--tqs-line)" strokeWidth={2} />
        {[-2, 0, 2, 4, 6].map((t) => (
          <g key={t}>
            <line x1={sx(t)} y1={194} x2={sx(t)} y2={206} stroke="var(--tqs-line)" strokeWidth={1.5} />
            <text x={sx(t)} y={226} fontSize={11} textAnchor="middle" className="tqs-mono" fill={ink2}>{String(t).replace('-', '−')}</text>
          </g>
        ))}
        {/* Symmetric end labels, level with the axis at each end. */}
        <text x={548} y={204} fontSize={11.5} textAnchor="end" fill={ink2}>← worse</text>
        <text x={892} y={204} fontSize={11.5} textAnchor="start" fill={ink2}>better →</text>
        <line x1={sx(sB) - 4} y1={172} x2={sx(sB) - 46} y2={172} stroke="var(--tqs-brand)" strokeWidth={2} markerEnd="url(#tqsB-ahb)" />
        <line x1={sx(sA) + 4} y1={172} x2={sx(sA) + 46} y2={172} stroke="var(--tqs-brand)" strokeWidth={2} markerEnd="url(#tqsB-ahb)" />
        {([[sA, 'A'], [sB, 'B']] as const).map(([s, t]) => (
          <g key={t}>
            <circle cx={sx(s)} cy={200} r={14} fill="var(--tqs-brand)" stroke="var(--tqs-card)" strokeWidth={3} />
            <text x={sx(s)} y={204.5} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--tqs-on-brand)">{t}</text>
          </g>
        ))}
        <text x={(sx(sA) + sx(sB)) / 2} y={150} fontSize={12} textAnchor="middle" fontWeight={600} fill="var(--tqs-brand-ink)">
          training pushes these apart
        </text>

        <rect x={610} y={288} width={240} height={64} rx={10} fill="var(--tqs-muted)" />
        <text x={730} y={313} fontSize={13} textAnchor="middle" className="tqs-mono">loss = −log σ(sA − sB)</text>
        <text x={730} y={335} fontSize={11} textAnchor="middle" fill={ink2}>≈ 0.006 here: already in the right order</text>
      </svg>
    </Frame>
  )
}

/* ── C · every held-out task by model score ─────────────────────────── */

export function ScoreSwarmFigure() {
  const W = 960, H = 400, left = 70, right = 30, top = 34, bottom = 60
  const X = (sev: number) => left + ((sev + 0.5) / 7) * (W - left - right)
  const Y = (s: number) => top + (1 - (s + 1.5) / 7) * (H - top - bottom) // −1.5..5.5
  const groups = Array.from({ length: 7 }, (_, sev) => TASK_SCORES.filter((d) => d.sev === sev).sort((a, b) => a.s - b.s))
  return (
    <Frame label="All 298 held-out tasks plotted by the model's quality score, grouped by human-rated severity from 0 (clean) to 6 (flawed). Median scores fall from 2.36 at severity 0 to 0.27 at severity 5. Tasks human reviewers kept cluster at higher scores than tasks they dropped.">
      <svg viewBox={`0 0 ${W} ${H}`} className="tqs-svg">
        {[-1, 0, 1, 2, 3, 4, 5].map((t) => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={Y(t)} y2={Y(t)} stroke="var(--tqs-line)" strokeWidth={t === 0 ? 1.4 : 0.8} opacity={t === 0 ? 1 : 0.6} />
            <text x={left - 10} y={Y(t) + 4} fontSize={11} textAnchor="end" className="tqs-mono" fill={ink2}>{String(t).replace('-', '−')}</text>
          </g>
        ))}
        <text x={left - 10} y={top - 14} fontSize={11.5} fill={ink2}>↑ model&apos;s quality score</text>
        {groups.map((_, s) => (
          <text key={s} x={X(s)} y={H - 34} fontSize={12} textAnchor="middle" className="tqs-mono">{s}</text>
        ))}
        <text x={X(0) - 20} y={H - 12} fontSize={11.5} fontWeight={600} fill="var(--tqs-good)">← clean</text>
        <text x={X(3)} y={H - 12} fontSize={11.5} textAnchor="middle" fill={ink2}>human-rated severity (underspecified + test problems)</text>
        <text x={X(6) + 20} y={H - 12} fontSize={11.5} textAnchor="end" fontWeight={600} fill="var(--tqs-bad)">flawed →</text>

        {groups.map((g, s) =>
          g.map((d, i) => {
            const j = ((i * 37) % 23) / 22 - 0.5 // deterministic spread within the column
            return (
              <circle key={d.id} cx={X(s) + j * 70} cy={Y(d.s)} r={4} fill={d.drop ? 'var(--tqs-bad)' : 'var(--tqs-good)'} opacity={0.78} stroke="var(--tqs-card)" strokeWidth={1}>
                <title>{`sympy-${d.id} · score ${d.s} · severity ${d.sev} · ${d.drop ? 'dropped' : 'kept'} by reviewers`}</title>
              </circle>
            )
          })
        )}
        {groups.map((g, s) => {
          if (!g.length) return null
          const m = g.length % 2 ? g[(g.length - 1) / 2].s : (g[g.length / 2 - 1].s + g[g.length / 2].s) / 2
          return (
            <line key={s} x1={X(s) - 40} x2={X(s) + 40} y1={Y(m)} y2={Y(m)} stroke="var(--tqs-ink)" strokeWidth={2.5} strokeLinecap="round">
              <title>{`severity ${s}: median score ${m.toFixed(2)} (${g.length} tasks)`}</title>
            </line>
          )
        })}
        <circle cx={W - 250} cy={top + 6} r={5} fill="var(--tqs-good)" />
        <text x={W - 238} y={top + 10} fontSize={11.5} fill={ink2}>kept by human reviewers</text>
        <circle cx={W - 250} cy={top + 24} r={5} fill="var(--tqs-bad)" />
        <text x={W - 238} y={top + 28} fontSize={11.5} fill={ink2}>dropped by human reviewers</text>
        <line x1={W - 256} x2={W - 244} y1={top + 42} y2={top + 42} stroke="var(--tqs-ink)" strokeWidth={2.5} />
        <text x={W - 238} y={top + 46} fontSize={11.5} fill={ink2}>median score</text>
      </svg>
    </Frame>
  )
}
