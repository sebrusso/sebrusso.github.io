'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import {
  BUCKETS,
  CATEGORIES,
  catVar,
  formatHours,
  solveRate,
  type PerTask,
  type TaskSummary,
} from '../../lib/tb4/data'
import { Landscape } from './landscape'

export interface Filters {
  q: string
  categories: string[]
  buckets: string[]
  gpuOnly: boolean
}

export const NO_FILTERS: Filters = { q: '', categories: [], buckets: [], gpuOnly: false }

export function applyFilters(tasks: TaskSummary[], f: Filters): TaskSummary[] {
  const q = f.q.trim().toLowerCase()
  return tasks.filter(
    (t) =>
      (!q || [t.name, t.category, t.subcategory, ...t.tags, ...t.authors].some((s) => s?.toLowerCase().includes(q))) &&
      (f.categories.length === 0 || f.categories.includes(t.category)) &&
      (f.buckets.length === 0 || BUCKETS.some((b) => f.buckets.includes(b.id) && b.test(t.expertHours))) &&
      (!f.gpuOnly || t.gpus > 0)
  )
}

type SortKey = 'name' | 'category' | 'expertHours' | 'instructionWords' | 'tests' | 'solve'

export function Browse({
  tasks,
  per,
  view,
  filters,
  setFilters,
  onView,
  onOpen,
}: {
  tasks: TaskSummary[]
  per: PerTask | null
  view: 'table' | 'landscape'
  filters: Filters
  setFilters: (f: Filters) => void
  onView: (v: 'table' | 'landscape') => void
  onOpen: (name: string) => void
}) {
  const shown = useMemo(() => applyFilters(tasks, filters), [tasks, filters])
  const median = useMemo(() => {
    const hs = [...tasks.map((t) => t.expertHours)].sort((a, b) => a - b)
    const m = Math.floor(hs.length / 2)
    return hs.length % 2 ? hs[m] : (hs[m - 1] + hs[m]) / 2
  }, [tasks])

  const stats = [
    { value: String(tasks.length), label: 'tasks' },
    { value: String(new Set(tasks.map((t) => t.category)).size), label: 'categories' },
    { value: String(new Set(tasks.map((t) => t.subcategory)).size), label: 'subcategories' },
    { value: formatHours(median), label: 'median expert time' },
    { value: String(tasks.filter((t) => t.gpus > 0).length), label: 'need a GPU' },
  ]

  return (
    <div className="flex flex-col gap-7 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[680px] flex-col gap-2.5">
          <div className="tb4-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">Terminal-Bench 4.0 · v4.0.0</div>
          <h1 className="text-title text-balance">{view === 'table' ? 'Every task, browsable' : 'Where the effort is'}</h1>
          <p className="text-muted-foreground">
            {view === 'table'
              ? `${tasks.length} hand-written terminal tasks, from Coq proofs to UEFI bootkit forensics. Filter by field, effort and hardware; open any task to read its instruction, tests and reference solution.`
              : 'Each dot is a task: how long an expert would take, against how much the instruction says. Click a dot to open the task.'}
          </p>
        </div>
        <div role="tablist" aria-label="View" className="flex rounded-lg border border-border bg-card p-[3px]">
          {(['table', 'landscape'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => onView(v)}
              className="h-9 rounded-md px-3.5 text-sm font-medium capitalize text-muted-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <section aria-label="At a glance" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 bg-card px-4 py-3">
            <span className="tb4-mono text-2xl font-medium">{s.value}</span>
            <span className="text-[0.8125rem] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-start gap-7">
        <FilterRail tasks={tasks} filters={filters} setFilters={setFilters} />
        <section aria-label="Tasks" className="flex min-w-0 flex-[999_1_560px] flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 text-[0.8125rem] text-muted-foreground">
            <span>
              Showing {shown.length} of {tasks.length} tasks
            </span>
            {filters !== NO_FILTERS && shown.length !== tasks.length && (
              <button onClick={() => setFilters(NO_FILTERS)} className="text-primary hover:underline">
                Clear filters
              </button>
            )}
          </div>
          {view === 'table' ? (
            <TaskTable tasks={shown} per={per} onOpen={onOpen} />
          ) : (
            <Landscape tasks={tasks} shown={shown} onOpen={onOpen} />
          )}
        </section>
      </div>
    </div>
  )
}

function FilterRail({ tasks, filters, setFilters }: { tasks: TaskSummary[]; filters: Filters; setFilters: (f: Filters) => void }) {
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const count = (pred: (t: TaskSummary) => boolean) => tasks.filter(pred).length
  const legend = 'mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground'
  const row = 'flex min-h-[30px] cursor-pointer items-center gap-2.5 text-sm'
  return (
    <aside aria-label="Filters" className="flex w-full flex-col gap-5 sm:w-[230px] sm:flex-none">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tb4-q" className={legend}>
          Search
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
          <Search size={15} className="text-muted-foreground" aria-hidden="true" />
          <input
            id="tb4-q"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Task, tag or author"
            className="h-10 w-full bg-transparent text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
      <fieldset className="flex flex-col">
        <legend className={legend}>Category</legend>
        {CATEGORIES.map((c) => (
          <label key={c} className={row}>
            <input
              type="checkbox"
              checked={filters.categories.includes(c)}
              onChange={() => setFilters({ ...filters, categories: toggle(filters.categories, c) })}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            <span className="tb4-dot" style={{ background: catVar(c) }} aria-hidden="true" />
            <span className="flex-1">{c}</span>
            <span className="tb4-mono text-xs text-muted-foreground">{count((t) => t.category === c)}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="flex flex-col">
        <legend className={legend}>Expert time</legend>
        {BUCKETS.map((b) => (
          <label key={b.id} className={row}>
            <input
              type="checkbox"
              checked={filters.buckets.includes(b.id)}
              onChange={() => setFilters({ ...filters, buckets: toggle(filters.buckets, b.id) })}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            <span className="flex-1">{b.label}</span>
            <span className="tb4-mono text-xs text-muted-foreground">{count((t) => b.test(t.expertHours))}</span>
          </label>
        ))}
      </fieldset>
      <label className={row}>
        <input
          type="checkbox"
          checked={filters.gpuOnly}
          onChange={() => setFilters({ ...filters, gpuOnly: !filters.gpuOnly })}
          className="h-4 w-4 accent-[hsl(var(--primary))]"
        />
        <span className="flex-1">Needs a GPU</span>
        <span className="tb4-mono text-xs text-muted-foreground">{count((t) => t.gpus > 0)}</span>
      </label>
    </aside>
  )
}

function TaskTable({ tasks, per, onOpen }: { tasks: TaskSummary[]; per: PerTask | null; onOpen: (n: string) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 })
  const rows = useMemo(() => {
    const val = (t: TaskSummary): string | number =>
      sort.key === 'solve' ? solveRate(per, t.name) ?? -1 : sort.key === 'category' ? `${t.category}/${t.subcategory}` : t[sort.key]
    return [...tasks].sort((a, b) => {
      const x = val(a)
      const y = val(b)
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir
    })
  }, [tasks, sort, per])

  const maxLog = Math.log10(60 / 0.5)
  const cols: { key: SortKey; label: string; align?: 'right' }[] = [
    { key: 'name', label: 'Task' },
    { key: 'category', label: 'Category' },
    { key: 'expertHours', label: 'Expert time' },
    { key: 'instructionWords', label: 'Instruction', align: 'right' },
    { key: 'tests', label: 'Tests', align: 'right' },
    ...(per ? [{ key: 'solve' as SortKey, label: 'Solve rate', align: 'right' as const }] : []),
  ]

  if (tasks.length === 0)
    return <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">No tasks match these filters.</div>

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40 text-left text-xs text-muted-foreground">
            {cols.map((c) => (
              <th key={c.key} scope="col" aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={`px-4 py-2.5 font-medium ${c.align === 'right' ? 'text-right' : ''}`}>
                <button
                  onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? ((-s.dir) as 1 | -1) : c.key === 'name' || c.key === 'category' ? 1 : -1 }))}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {c.label}
                  {sort.key === c.key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </button>
              </th>
            ))}
            <th scope="col" className="px-4 py-2.5 font-medium">
              Author
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const rate = solveRate(per, t.name)
            return (
              <tr key={t.name} className="border-t border-border/70 hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <button onClick={() => onOpen(t.name)} className="tb4-mono whitespace-nowrap text-left text-[0.84rem] font-medium hover:text-primary">
                    {t.name}
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <span className="tb4-dot" style={{ background: catVar(t.category) }} aria-hidden="true" />
                    {t.category}
                    <span className="text-muted-foreground">/ {t.subcategory}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2.5">
                    <span className="h-1.5 w-[72px] overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <span className="block h-full rounded-full" style={{ width: `${Math.max(4, (Math.log10(t.expertHours / 0.5) / maxLog) * 100)}%`, background: 'hsl(var(--tb4-bar))' }} />
                    </span>
                    <span className="tb4-mono whitespace-nowrap text-[0.8125rem]">{formatHours(t.expertHours)}</span>
                  </span>
                </td>
                <td className="tb4-mono px-4 py-2.5 text-right text-[0.8125rem] text-muted-foreground">{t.instructionWords}</td>
                <td className="tb4-mono px-4 py-2.5 text-right text-[0.8125rem] text-muted-foreground">{t.tests || '—'}</td>
                {per && <td className="tb4-mono px-4 py-2.5 text-right text-[0.8125rem]">{rate == null ? '—' : `${Math.round(rate * 100)}%`}</td>}
                <td className="max-w-[12rem] truncate px-4 py-2.5 text-muted-foreground" title={t.authors.join(', ')}>
                  {t.authors.length > 1 ? `${t.authors[0]} +${t.authors.length - 1}` : t.authors[0]}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
