'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { TEMPLATE_SECTIONS, TOP_CRITERIA } from '../../lib/notebook/build'
import { useNotebook } from '../../lib/notebook/store'
import type { EvalEntry } from '../../lib/notebook/types'
import { PEOPLE } from '../../lib/notebook/people'
import { ParetoPlot } from './pareto'
import { WhoBadge, relativeTime } from './bits'
import { AnswerView } from './answer'
import { fieldAttr } from './comments'
import { ResizableTable, type Column } from './resizable-table'

const field = (e: EvalEntry, key: string) => e.fields.find((f) => f.key === key && !f.deletedAt)
const plain = (v: string | undefined) => (v ?? '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
const LABELS = Object.fromEntries(TEMPLATE_SECTIONS.flatMap((s) => s.fields.map((f) => [f.key, f.label])))

export function SummaryView({ base, onOpen, onCompare }: { base: string; onOpen: (slug: string) => void; onCompare: () => void }) {
  const { evals, addEval } = useNotebook()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const activity = useMemo(
    () =>
      evals
        .flatMap((e) => e.fields.filter((f) => f.updatedAt && f.author).map((f) => ({ e, f })))
        .sort((a, b) => (b.f.updatedAt as string).localeCompare(a.f.updatedAt as string))
        .slice(0, 8),
    [evals]
  )

  const columns: Column[] = [
    { id: 'benchmark', label: 'Benchmark', width: 180, min: 120 },
    ...TOP_CRITERIA.map((k) => ({ id: k, label: LABELS[k] ?? k, width: k === 'publisher' || k === 'tasktype' ? 180 : 130 })),
  ]

  return (
    <div className="flex flex-col gap-12 py-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-title text-balance">Frontier agentic-coding benchmarks</h1>
        <p className="max-w-[62ch] text-muted-foreground">
          Seb and Daniel&apos;s profiles of the benchmarks labs cite. Claude fills the searchable facts with sources; we check
          them and write our own read.
        </p>
      </header>

      <section aria-label="Evals" className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
        {evals.map((e) => {
          const live = e.fields.filter((f) => !f.deletedAt)
          const filled = live.filter((f) => f.value).length
          const vetted = live.filter((f) => f.value && (f.author !== 'ai' || f.checkedBy)).length
          const signal = field(e, 'signal')?.value
          const sotaModel = plain(field(e, 'sota_model')?.value) || e.summary.sotaModel
          const sotaScore = field(e, 'sota_score')?.value || e.summary.sotaScore
          return (
            <Link
              key={e.slug}
              href={`${base}?e=${e.slug}`}
              onClick={(ev) => {
                ev.preventDefault()
                onOpen(e.slug)
              }}
              className="group flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/25"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold leading-tight group-hover:text-primary">{e.name}</h2>
                  <div className="mt-1 truncate text-sm text-muted-foreground">
                    {[plain(field(e, 'publisher')?.value), field(e, 'released')?.value].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span className="nb-chip shrink-0">{signal ? `Signal: ${signal}` : 'Not rated yet'}</span>
              </div>
              <ParetoPlot results={e.results} variant="card" />
              <div className="flex flex-col gap-2">
                {sotaModel && (
                  <div className="nb-mono truncate text-sm">
                    <span className="text-muted-foreground">SOTA </span>
                    {sotaScore}% · {sotaModel}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className="h-full bg-primary/70" style={{ width: `${(filled / Math.max(1, live.length)) * 100}%` }} />
                  </div>
                  <span className="nb-mono">
                    {filled}/{live.length} filled · {vetted} human-vetted
                  </span>
                </div>
              </div>
            </Link>
          )
        })}

        <div className="flex min-h-48 flex-col justify-center gap-3 rounded-xl border border-dashed border-border p-5">
          {adding ? (
            <form
              className="flex flex-col gap-2"
              onSubmit={(ev) => {
                ev.preventDefault()
                if (!name.trim()) return
                const created = addEval(name.trim())
                setName('')
                setAdding(false)
                onOpen(created.slug)
              }}
            >
              <label htmlFor="nb-new-eval" className="text-sm font-medium">
                Benchmark name
              </label>
              <input
                id="nb-new-eval"
                autoFocus
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="e.g. SWE-bench Pro"
                className="h-10 rounded-md border border-input bg-background px-3"
              />
              <div className="flex gap-2">
                <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                  Create from template
                </button>
                <button type="button" onClick={() => setAdding(false)} className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAdding(true)} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
              <Plus size={16} /> Add eval
            </button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Or from a terminal: <span className="nb-mono">sagent evalnb add &quot;Name&quot;</span>
          </p>
        </div>
      </section>

      {evals.length > 0 && (
        <section aria-labelledby="compare-h" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="compare-h" className="text-lg font-semibold">
              Side by side
            </h2>
            <button onClick={onCompare} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Pick criteria in Compare <ArrowRight size={14} />
            </button>
          </div>
          <ResizableTable
            id="summary"
            columns={columns}
            rows={evals.map((e) => ({
              kind: 'row' as const,
              key: e.slug,
              cells: [
                <button key="name" onClick={() => onOpen(e.slug)} className="text-left font-medium hover:text-primary">
                  {e.name}
                </button>,
                ...TOP_CRITERIA.map((k) => {
                  const f = field(e, k)
                  return f ? (
                    <div key={k} {...fieldAttr(e.slug, f.id)}>
                      <AnswerView field={f} size="sm" />
                    </div>
                  ) : (
                    <span key={k} className="text-muted-foreground/60">—</span>
                  )
                }),
              ],
            }))}
          />
          <p className="text-xs text-muted-foreground">Drag a column edge to resize it; double-click the edge to reset.</p>
        </section>
      )}

      {activity.length > 0 && (
        <section aria-labelledby="activity-h" className="flex flex-col gap-3">
          <h2 id="activity-h" className="text-lg font-semibold">
            Recent edits
          </h2>
          <ul className="flex flex-col divide-y divide-border">
            {activity.map(({ e, f }) => (
              <li key={`${e.slug}-${f.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <WhoBadge who={f.author!} />
                <span className="min-w-0">
                  {PEOPLE[f.author!].short} edited <span className="font-medium">{f.label}</span> on{' '}
                  <button onClick={() => onOpen(e.slug)} className="hover:text-primary">
                    {e.name}
                  </button>
                </span>
                <span className="nb-mono ml-auto text-xs text-muted-foreground">{relativeTime(f.updatedAt!)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
