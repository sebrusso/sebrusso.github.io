'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { TEMPLATE_SECTIONS } from '../../lib/notebook/build'
import { useNotebook } from '../../lib/notebook/store'
import type { EvalEntry, FieldRow as Field } from '../../lib/notebook/types'
import { FieldRow } from './field-row'
import { ParetoPlot } from './pareto'
import { hostOf } from './bits'

type Filter = 'all' | 'empty' | 'unchecked' | 'week'
const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['empty', 'Empty'],
  ['unchecked', 'AI, unchecked'],
  ['week', 'Edited this week'],
]

function matches(f: Field, filter: Filter) {
  if (filter === 'empty') return !f.value
  if (filter === 'unchecked') return f.author === 'ai' && !f.checkedBy && !!f.value
  if (filter === 'week') return !!f.updatedAt && Date.now() - new Date(f.updatedAt).getTime() < 7 * 864e5
  return true
}

export function EvalView({ entry, base }: { entry: EvalEntry; base: string }) {
  const { restoreField, addField } = useNotebook()
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState<string | null>(null)

  const live = entry.fields.filter((f) => !f.deletedAt)
  const filled = live.filter((f) => f.value).length
  const sections = useMemo(
    () =>
      TEMPLATE_SECTIONS.map((s) => ({
        ...s,
        all: entry.fields.filter((f) => f.section === s.id).sort((a, b) => a.position - b.position),
      })),
    [entry.fields]
  )

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-3">
        <Link href={base} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> All evals
        </Link>
        <h1 className="text-title text-balance">{entry.name}</h1>
        <div className="nb-mono flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {entry.summary.released && <span>Released {entry.summary.released}</span>}
          {entry.summary.tasks != null && <span>{entry.summary.tasks.toLocaleString('en-US')} tasks</span>}
          {entry.summary.repos != null && <span>{entry.summary.repos} repos</span>}
          <span>
            {filled}/{live.length} fields filled
          </span>
        </div>
      </header>

      <section aria-labelledby="results-h" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="results-h" className="text-lg font-semibold">
            Score vs. cost
          </h2>
          {entry.results.length > 0 && (
            <span className="nb-mono text-sm text-muted-foreground">{entry.results.length} models</span>
          )}
        </div>
        <ParetoPlot results={entry.results} costUnit={entry.costUnit} />
        {entry.results.length > 0 && <ResultsTable entry={entry} />}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <nav aria-label="Sections" className="lg:sticky lg:top-6 lg:self-start">
          <ul className="flex gap-x-4 gap-y-1 overflow-x-auto pb-2 text-sm lg:flex-col lg:overflow-visible lg:pb-0">
            {sections.map((s) => {
              const rows = s.all.filter((f) => !f.deletedAt)
              const done = rows.filter((f) => f.value).length
              return (
                <li key={s.id} className="shrink-0">
                  <a href={`#s-${s.id}`} className="flex items-baseline justify-between gap-3 py-0.5 text-muted-foreground hover:text-foreground">
                    <span>{s.title}</span>
                    <span className="nb-mono text-xs">
                      {done}/{rows.length}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-10">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter fields">
            {FILTERS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className="h-8 rounded-full border border-border px-3 text-sm text-muted-foreground hover:text-foreground aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
              >
                {label}
              </button>
            ))}
          </div>

          {sections.map((s) => {
            const rows = s.all.filter((f) => !f.deletedAt && matches(f, filter))
            const deleted = s.all.filter((f) => f.deletedAt)
            if (filter !== 'all' && rows.length === 0) return null
            return (
              <section key={s.id} id={`s-${s.id}`} aria-labelledby={`h-${s.id}`} className="scroll-mt-6">
                <h2 id={`h-${s.id}`} className="nb-mono mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {s.title}
                </h2>
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {rows.map((f) => (
                    <FieldRow key={f.id} slug={entry.slug} field={f} />
                  ))}
                  {filter === 'all' && (
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      {adding === s.id ? (
                        <AddFieldForm
                          onCancel={() => setAdding(null)}
                          onAdd={(label, guidance) => {
                            addField(entry.slug, s.id, label, guidance)
                            setAdding(null)
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setAdding(s.id)}
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <Plus size={14} /> Add field
                        </button>
                      )}
                      {deleted.length > 0 && adding !== s.id && (
                        <details className="ml-auto text-sm text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">{deleted.length} deleted</summary>
                          <ul className="mt-2 flex flex-col gap-1">
                            {deleted.map((f) => (
                              <li key={f.id} className="flex items-center gap-3">
                                <span>{f.label}</span>
                                <button onClick={() => restoreField(entry.slug, f.id)} className="text-primary hover:underline">
                                  Restore
                                </button>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AddFieldForm({ onAdd, onCancel }: { onAdd: (label: string, guidance: string) => void; onCancel: () => void }) {
  const [label, setLabel] = useState('')
  const [guidance, setGuidance] = useState('')
  return (
    <form
      className="flex w-full flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault()
        if (label.trim()) onAdd(label.trim(), guidance.trim())
      }}
    >
      <input
        id="nb-new-field-label"
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Field name"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm sm:w-56"
      />
      <input
        id="nb-new-field-guidance"
        value={guidance}
        onChange={(e) => setGuidance(e.target.value)}
        placeholder="What the notes should hold (optional)"
        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
      />
      <div className="flex gap-2">
        <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
          Add
        </button>
        <button type="button" onClick={onCancel} className="h-9 rounded-md px-3 text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
    </form>
  )
}

function ResultsTable({ entry }: { entry: EvalEntry }) {
  const rows = [...entry.results].sort((a, b) => b.score - a.score)
  return (
    <details className="rounded-lg border border-border">
      <summary className="cursor-pointer px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
        All {rows.length} model results
      </summary>
      <div className="overflow-x-auto border-t border-border">
        <table className="nb-mono w-full min-w-[34rem] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Model</th>
              <th className="px-4 py-2 font-medium">Lab</th>
              <th className="px-4 py-2 text-right font-medium">Score</th>
              <th className="px-4 py-2 text-right font-medium">Cost {entry.costUnit ?? 'per task'}</th>
              <th className="px-4 py-2 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.model} className="border-t border-border">
                <td className="px-4 py-1.5 font-sans">{r.model}</td>
                <td className="px-4 py-1.5 font-sans text-muted-foreground">{r.lab}</td>
                <td className="px-4 py-1.5 text-right">{r.score.toFixed(1)}%</td>
                <td className="px-4 py-1.5 text-right">{r.costPerTask != null ? `$${r.costPerTask.toFixed(2)}` : '—'}</td>
                <td className="px-4 py-1.5">
                  {r.sourceUrl && (
                    <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground">
                      {hostOf(r.sourceUrl)}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
