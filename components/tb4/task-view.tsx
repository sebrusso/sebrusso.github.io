'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, File, Folder } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  catVar,
  formatBytes,
  formatDuration,
  formatHours,
  useTask,
  type Index,
  type PerTask,
  type TaskFile,
} from '../../lib/tb4/data'
import { CodeViewer } from './code-viewer'

type Tab = 'instruction' | 'tests' | 'solution' | 'environment' | 'files'
const TABS: [Tab, string][] = [
  ['instruction', 'Instruction'],
  ['tests', 'Tests'],
  ['solution', 'Solution'],
  ['environment', 'Environment'],
  ['files', 'All files'],
]
// The file each tab opens on, in order of preference.
const HUB_ROWS = 'https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4/leaderboards/4-0-0/rows'

const PREFERRED: Record<Exclude<Tab, 'instruction'>, RegExp[]> = {
  tests: [/test_outputs\.py$/, /\.py$/, /test\.sh$/],
  solution: [/solve\.sh$/, /\.py$/],
  environment: [/^environment\/Dockerfile$/, /Dockerfile$/],
  files: [/^task\.toml$/],
}

export function TaskView({
  name,
  index,
  per,
  tab,
  filePath,
  onTab,
  onBack,
  onOpen,
}: {
  name: string
  index: Index
  per: PerTask | null
  tab: Tab
  filePath: string | null
  onTab: (tab: Tab, file?: string | null) => void
  onBack: () => void
  onOpen: (name: string) => void
}) {
  const { data: task, error } = useTask(name)
  const summary = index.tasks.find((t) => t.name === name)
  const ghBase = `${index.repo}/blob/${index.tag}/tasks/${name}`

  if (!summary) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        No task called “{name}”.{' '}
        <button onClick={onBack} className="text-primary hover:underline">
          Back to all tasks
        </button>
      </div>
    )
  }

  const related = index.tasks.filter((t) => t.category === summary.category && t.name !== name)
  const results = per?.results[name]
  const configs = per && results ? per.configs.filter((c) => results[c.id]).map((c) => ({ c, r: results[c.id] })) : []
  configs.sort((a, b) => b.r.passed / b.r.trials - a.r.passed / a.r.trials || a.c.model.localeCompare(b.c.model))

  return (
    <div className="flex flex-col gap-6 py-8">
      <button onClick={onBack} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> All {index.tasks.length} tasks
      </button>

      <header className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center gap-2 rounded-full border border-border px-2.5 text-[0.8125rem] font-medium">
            <span className="tb4-dot" style={{ background: catVar(summary.category) }} aria-hidden="true" />
            {summary.category} / {summary.subcategory}
          </span>
          {summary.tags.map((tag) => (
            <span key={tag} className="inline-flex h-7 items-center rounded-full border border-border px-2.5 text-[0.8125rem] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="tb4-mono break-all text-[2.1rem] font-medium leading-tight tracking-tight">{name}</h1>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Meta label={summary.authors.length > 1 ? 'Authors' : 'Author'} value={summary.authors.join(', ')} />
          <Meta label="Expert time" value={formatHours(summary.expertHours)} mono />
          <Meta label="Agent time limit" value={formatDuration(summary.agentTimeoutSec)} mono />
          <Meta label="Tests" value={summary.tests ? String(summary.tests) : '—'} mono />
          <Meta
            label="Resources"
            value={[summary.cpus && `${summary.cpus} CPU`, summary.memoryMb && `${summary.memoryMb / 1024} GB`, summary.gpus ? `${summary.gpus} GPU` : null].filter(Boolean).join(' · ') || '—'}
            mono
          />
        </dl>
      </header>

      <div className="flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-4">
          <div role="tablist" aria-label="Task sections" className="flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => onTab(id, null)}
                className="-mb-px h-10 shrink-0 border-b-2 border-transparent px-3.5 text-sm font-medium text-muted-foreground hover:text-foreground aria-selected:border-primary aria-selected:text-foreground"
              >
                {label}
              </button>
            ))}
          </div>

          {!task ? (
            <div className="rounded-xl border border-border px-4 py-12 text-center text-sm text-muted-foreground">
              {error ? 'Couldn’t load this task’s files. Reload to try again.' : 'Loading task files…'}
            </div>
          ) : tab === 'instruction' ? (
            <article className="tb4-prose rounded-xl border border-border bg-card px-6 py-5">
              {/* The canary comment stays in the raw file (All files tab); the rendered view drops it. */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.instruction.replace(/<!--[\s\S]*?-->/g, '')}</ReactMarkdown>
            </article>
          ) : (
            <FilesPanel files={task.files} tab={tab} filePath={filePath} ghBase={ghBase} onPick={(p) => onTab(tab, p)} />
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Files are reproduced verbatim from{' '}
            <a href={`${index.repo}/tree/${index.tag}/tasks/${name}`} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
              harbor-framework/terminal-bench@{index.tag}
            </a>{' '}
            ({index.commit.slice(0, 7)}), canary lines included. Benchmark data: keep it out of training corpora.
          </p>
        </div>

        <aside aria-label="Task details" className="flex w-full flex-col gap-4 lg:w-[320px] lg:flex-none">
          {configs.length > 0 && (
            <section aria-labelledby="tb4-results" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="tb4-results" className="text-[0.95rem] font-semibold">
                  Results by model
                </h2>
                <span className="tb4-mono text-xs text-muted-foreground">passes / trials</span>
              </div>
              <ul className="flex max-h-[26rem] flex-col gap-2.5 overflow-y-auto pr-1">
                {configs.map(({ c, r }) => (
                  <li key={c.id} className="flex flex-col gap-1">
                    <div className="flex justify-between gap-3 text-[0.8125rem]">
                      <a
                        href={c.hub_row_id ? `${HUB_ROWS}/${c.hub_row_id}?tab=results` : per!.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate hover:text-primary"
                        title={[c.model, c.agent, c.effort].filter(Boolean).join(' · ')}
                      >
                        {c.model}
                        <span className="text-muted-foreground">
                          {' '}
                          · {c.agent}
                          {c.effort && `, ${c.effort}`}
                        </span>
                      </a>
                      <span className="tb4-mono text-muted-foreground">
                        {r.passed}/{r.trials}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="h-full rounded-full" style={{ width: `${(r.passed / r.trials) * 100}%`, background: 'hsl(var(--tb4-bar))' }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Per-trial results from the{' '}
                <a href={per!.source_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Harbor Hub leaderboard
                </a>
                , retrieved {per!.retrieved_at}. Each model ran every task 5 times.
              </p>
            </section>
          )}

          {task && <FileSummary files={task.files} onPick={(t, p) => onTab(t, p)} />}

          {related.length > 0 && (
            <section aria-labelledby="tb4-related" className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
              <h2 id="tb4-related" className="mb-1.5 text-[0.95rem] font-semibold">
                More {summary.category} tasks
              </h2>
              {related.map((t) => (
                <button key={t.name} onClick={() => onOpen(t.name)} className="flex min-h-[30px] items-center justify-between gap-3 text-left">
                  <span className="tb4-mono truncate text-[0.8125rem] hover:text-primary">{t.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatHours(t.expertHours)}</span>
                </button>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'tb4-mono' : ''}>{value}</dd>
    </div>
  )
}

function inTab(f: TaskFile, tab: Exclude<Tab, 'instruction'>): boolean {
  return tab === 'files' || f.section === tab
}

function FilesPanel({
  files,
  tab,
  filePath,
  ghBase,
  onPick,
}: {
  files: TaskFile[]
  tab: Exclude<Tab, 'instruction'>
  filePath: string | null
  ghBase: string
  onPick: (path: string) => void
}) {
  const list = useMemo(() => files.filter((f) => inTab(f, tab)), [files, tab])
  const fallback = useMemo(() => {
    for (const re of PREFERRED[tab]) {
      const hit = list.find((f) => re.test(f.path) && f.kind === 'text')
      if (hit) return hit
    }
    return list.find((f) => f.kind === 'text') ?? list[0]
  }, [list, tab])
  const [showData, setShowData] = useState(false)
  const current = list.find((f) => f.path === filePath) ?? fallback

  useEffect(() => setShowData(false), [tab])

  if (!current) return <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">This task has no files here.</div>

  const code = list.filter((f) => f.kind === 'text')
  const other = list.filter((f) => f.kind !== 'text')
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Files" className="flex max-h-[70vh] flex-col overflow-y-auto rounded-xl border border-border bg-card p-1.5">
        {code.map((f) => (
          <FileButton key={f.path} f={f} tab={tab} active={f.path === current.path} onPick={onPick} />
        ))}
        {other.length > 0 && (
          <>
            <button onClick={() => setShowData((s) => !s)} className="mt-1 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted">
              {showData ? 'Hide' : 'Show'} {other.length} data and binary file{other.length > 1 ? 's' : ''}
            </button>
            {showData && other.map((f) => <FileButton key={f.path} f={f} tab={tab} active={f.path === current.path} onPick={onPick} />)}
          </>
        )}
      </nav>
      <CodeViewer key={current.path} file={current} githubUrl={`${ghBase}/${current.path}`} />
    </div>
  )
}

function FileButton({ f, tab, active, onPick }: { f: TaskFile; tab: Tab; active: boolean; onPick: (p: string) => void }) {
  // Inside a section tab the folder name is implied; show the rest.
  const label = tab === 'files' || !f.path.startsWith(`${f.section}/`) ? f.path : f.path.slice(f.section.length + 1)
  return (
    <button
      onClick={() => onPick(f.path)}
      aria-current={active ? 'true' : undefined}
      title={f.path}
      className="tb4-mono flex min-h-[30px] items-center gap-2 rounded-md px-2 text-left text-[0.78rem] hover:bg-muted aria-[current=true]:bg-accent aria-[current=true]:text-accent-foreground"
    >
      <File size={12} className="shrink-0 opacity-60" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {f.kind !== 'text' && <span className="shrink-0 text-[0.7rem] text-muted-foreground">{formatBytes(f.size)}</span>}
    </button>
  )
}

function FileSummary({ files, onPick }: { files: TaskFile[]; onPick: (tab: Tab, path: string | null) => void }) {
  const groups: [Exclude<Tab, 'instruction' | 'files'>, string][] = [
    ['tests', 'tests/'],
    ['solution', 'solution/'],
    ['environment', 'environment/'],
  ]
  return (
    <section aria-labelledby="tb4-files" className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <h2 id="tb4-files" className="mb-1.5 text-[0.95rem] font-semibold">
        Files
      </h2>
      {groups.map(([tab, label]) => {
        const fs = files.filter((f) => f.section === tab)
        if (fs.length === 0) return null
        const size = fs.reduce((s, f) => s + f.size, 0)
        return (
          <button key={tab} onClick={() => onPick(tab, null)} className="flex min-h-[30px] items-center gap-2 text-left">
            <Folder size={13} className="text-muted-foreground" aria-hidden="true" />
            <span className="tb4-mono flex-1 text-[0.8125rem] hover:text-primary">{label}</span>
            <span className="text-xs text-muted-foreground">
              {fs.length} file{fs.length > 1 ? 's' : ''} · {formatBytes(size)}
            </span>
          </button>
        )
      })}
      <button onClick={() => onPick('files', 'task.toml')} className="flex min-h-[30px] items-center gap-2 text-left">
        <File size={13} className="text-muted-foreground" aria-hidden="true" />
        <span className="tb4-mono flex-1 text-[0.8125rem] hover:text-primary">task.toml</span>
      </button>
    </section>
  )
}
