'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { TEMPLATE_SECTIONS, TOP_CRITERIA } from '../../lib/notebook/build'
import { load, save, useNotebook } from '../../lib/notebook/store'
import type { EvalEntry } from '../../lib/notebook/types'
import { AnswerView } from './answer'
import { Markdown } from './bits'
import { CommentButton, fieldAttr } from './comments'
import { ResizableTable, type Column, type TableRow } from './resizable-table'

const PREFS_KEY = 'evalnb-compare'
const ALL_KEYS = TEMPLATE_SECTIONS.flatMap((s) => s.fields.map((f) => f.key))

interface Prefs {
  keys: string[]
  slugs: string[] | null // null = every eval
}

export function CompareView({ onOpen }: { onOpen: (slug: string) => void }) {
  const { evals } = useNotebook()
  const [prefs, setPrefs] = useState<Prefs>({ keys: TOP_CRITERIA, slugs: null })

  useEffect(() => {
    const stored = load<Prefs>(PREFS_KEY)
    if (stored) setPrefs(stored)
  }, [])
  const update = (next: Prefs) => {
    setPrefs(next)
    save(PREFS_KEY, next)
  }

  const shown = evals.filter((e) => !prefs.slugs || prefs.slugs.includes(e.slug))
  const selected = new Set(prefs.keys)

  const columns: Column[] = [
    { id: 'criterion', label: 'Criterion', width: 230, min: 140 },
    ...shown.map((e) => ({
      id: e.slug,
      label: (
        <button onClick={() => onOpen(e.slug)} className="text-left text-foreground hover:text-primary">
          {e.name}
        </button>
      ),
      width: 260,
      min: 120,
    })),
  ]

  const rows: TableRow[] = []
  for (const s of TEMPLATE_SECTIONS) {
    const fields = s.fields.filter((f) => selected.has(f.key))
    if (fields.length === 0) continue
    rows.push({ kind: 'group', key: `g-${s.id}`, label: s.title })
    for (const tf of fields) {
      rows.push({
        kind: 'row',
        key: tf.key,
        cells: [
          <div key="c" className="flex flex-col gap-1">
            <span className="font-medium leading-snug">{tf.label}</span>
            {tf.fill === 'human' && <span className="text-xs text-muted-foreground">Our read</span>}
          </div>,
          ...shown.map((e) => <Cell key={e.slug} entry={e} fieldKey={tf.key} />),
        ],
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-title text-balance">Compare</h1>
        <p className="max-w-[62ch] text-muted-foreground">
          Pick the criteria and benchmarks to line up. Highlight any answer or note to comment on it.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <CriteriaPicker keys={prefs.keys} onChange={(keys) => update({ ...prefs, keys })} />
        <EvalPicker evals={evals} slugs={prefs.slugs} onChange={(slugs) => update({ ...prefs, slugs })} />
        <span className="nb-mono ml-auto text-xs text-muted-foreground">
          {prefs.keys.length} criteria · {shown.length} evals
        </span>
      </div>

      {prefs.keys.length === 0 || shown.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {shown.length === 0 ? 'Pick at least one benchmark.' : 'Pick at least one criterion.'}
        </div>
      ) : (
        <ResizableTable id="compare" columns={columns} rows={rows} />
      )}
    </div>
  )
}

function Cell({ entry, fieldKey }: { entry: EvalEntry; fieldKey: string }) {
  const field = entry.fields.find((f) => f.key === fieldKey && !f.deletedAt)
  const [open, setOpen] = useState(false)
  if (!field) return <span className="text-sm text-muted-foreground/60">Deleted on this eval</span>
  const hasNotes = !!field.notes.trim()
  return (
    <div className="flex flex-col gap-1">
      <div {...fieldAttr(entry.slug, field.id)} className="min-w-0">
        <AnswerView field={field} size="sm" />
        {open && hasNotes && (
          <div className="mt-2 rounded-md bg-muted/40 px-2.5 py-1.5 [&_.nb-prose]:text-[0.8125rem]">
            <Markdown>{field.notes}</Markdown>
          </div>
        )}
      </div>
      <div className="-ml-1.5 flex items-center gap-0.5">
        {hasNotes && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex h-7 items-center gap-0.5 rounded-md px-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
            Notes
          </button>
        )}
        <CommentButton slug={entry.slug} fieldId={field.id} label={`${field.label}, ${entry.name}`} />
      </div>
    </div>
  )
}

function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, ref }
}

function Checkbox({ checked, indeterminate, onChange, label, id }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: React.ReactNode; id: string }) {
  const box = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (box.current) box.current.indeterminate = !!indeterminate
  }, [indeterminate])
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 hover:bg-muted">
      <input ref={box} id={id} type="checkbox" checked={checked} onChange={onChange} className="mt-0.5 accent-[hsl(var(--primary))]" />
      <span className="min-w-0 flex-1">{label}</span>
    </label>
  )
}

function CriteriaPicker({ keys, onChange }: { keys: string[]; onChange: (keys: string[]) => void }) {
  const { open, setOpen, ref } = usePopover()
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const selected = useMemo(() => new Set(keys), [keys])
  // Keep the template's order no matter how things were picked.
  const set = (next: Set<string>) => onChange(ALL_KEYS.filter((k) => next.has(k)))

  const query = q.trim().toLowerCase()
  const sections = TEMPLATE_SECTIONS.map((s) => ({
    ...s,
    visible: s.fields.filter((f) => !query || f.label.toLowerCase().includes(query) || s.title.toLowerCase().includes(query)),
  })).filter((s) => s.visible.length > 0)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted"
      >
        Criteria <span className="nb-mono text-muted-foreground">{keys.length}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 flex max-h-[30rem] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-lg border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring">
              <Search size={14} className="text-muted-foreground" />
              <input
                id="nb-criteria-search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search criteria"
                className="h-8 w-full bg-transparent text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="mt-2 flex gap-1 text-xs">
              <button onClick={() => onChange(TOP_CRITERIA)} className="rounded px-2 py-1 hover:bg-muted">
                Top 10
              </button>
              <button onClick={() => onChange(ALL_KEYS)} className="rounded px-2 py-1 hover:bg-muted">
                All
              </button>
              <button onClick={() => onChange([])} className="rounded px-2 py-1 hover:bg-muted">
                None
              </button>
            </div>
          </div>
          <div className="overflow-y-auto p-1.5 text-sm">
            {sections.length === 0 && <p className="px-2 py-3 text-muted-foreground">No criteria match “{q}”.</p>}
            {sections.map((s) => {
              const on = s.visible.filter((f) => selected.has(f.key)).length
              const isCollapsed = !query && collapsed.has(s.id)
              return (
                <div key={s.id} className="mb-1">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsed((c) => {
                          const next = new Set(c)
                          if (next.has(s.id)) next.delete(s.id)
                          else next.add(s.id)
                          return next
                        })
                      }
                      aria-label={isCollapsed ? `Expand ${s.title}` : `Collapse ${s.title}`}
                      className="rounded p-1 text-muted-foreground hover:bg-muted"
                    >
                      <ChevronRight size={14} className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                    </button>
                    <div className="flex-1">
                      <Checkbox
                        id={`nb-sec-${s.id}`}
                        checked={on === s.visible.length}
                        indeterminate={on > 0 && on < s.visible.length}
                        onChange={() => {
                          const next = new Set(selected)
                          if (on === s.visible.length) s.visible.forEach((f) => next.delete(f.key))
                          else s.visible.forEach((f) => next.add(f.key))
                          set(next)
                        }}
                        label={
                          <span className="flex justify-between gap-2 font-medium">
                            {s.title}
                            <span className="nb-mono text-xs font-normal text-muted-foreground">
                              {on}/{s.visible.length}
                            </span>
                          </span>
                        }
                      />
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="ml-7">
                      {s.visible.map((f) => (
                        <Checkbox
                          key={f.key}
                          id={`nb-crit-${f.key}`}
                          checked={selected.has(f.key)}
                          onChange={() => {
                            const next = new Set(selected)
                            if (next.has(f.key)) next.delete(f.key)
                            else next.add(f.key)
                            set(next)
                          }}
                          label={f.label}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function EvalPicker({ evals, slugs, onChange }: { evals: EvalEntry[]; slugs: string[] | null; onChange: (s: string[] | null) => void }) {
  const { open, setOpen, ref } = usePopover()
  const isOn = (slug: string) => !slugs || slugs.includes(slug)
  const count = evals.filter((e) => isOn(e.slug)).length
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted"
      >
        Benchmarks <span className="nb-mono text-muted-foreground">{count}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-64 rounded-lg border border-border bg-popover p-1.5 text-sm text-popover-foreground shadow-xl">
          {evals.map((e) => (
            <Checkbox
              key={e.slug}
              id={`nb-eval-${e.slug}`}
              checked={isOn(e.slug)}
              onChange={() => {
                const current = evals.filter((x) => isOn(x.slug)).map((x) => x.slug)
                const next = current.includes(e.slug) ? current.filter((s) => s !== e.slug) : [...current, e.slug]
                onChange(next.length === evals.length ? null : next)
              }}
              label={e.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}
