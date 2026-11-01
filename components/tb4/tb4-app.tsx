'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useIndex, usePerTask } from '../../lib/tb4/data'
import { Browse, NO_FILTERS, type Filters } from './browse'
import { TaskView } from './task-view'

export const TB4_BASE = '/tb4-r8v3xm'
type Tab = 'instruction' | 'tests' | 'solution' | 'environment' | 'files'
const TABS: Tab[] = ['instruction', 'tests', 'solution', 'environment', 'files']

// Static export: every view is this one page with a query string, so a task
// and file can be linked directly (?task=html-js-filter&tab=tests&file=…).
export function TB4App() {
  const { data: index, error } = useIndex()
  const { data: per } = usePerTask()
  const params = useSearchParams()
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)

  const task = params.get('task')
  const view = params.get('view') === 'landscape' ? 'landscape' : 'table'
  const tabParam = params.get('tab') as Tab | null
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'instruction'

  const go = (q: Record<string, string | null | undefined>, scroll = true) => {
    const qs = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => v && qs.set(k, v))
    const s = qs.toString()
    router.push(s ? `${TB4_BASE}?${s}` : TB4_BASE, { scroll: false })
    if (scroll) window.scrollTo({ top: 0 })
  }

  if (error) return <p className="py-16 text-center text-muted-foreground">Couldn’t load the task list. Reload to try again.</p>
  if (!index) return <div className="min-h-[60vh]" aria-busy="true" />

  return task ? (
    <TaskView
      name={task}
      index={index}
      per={per}
      tab={tab}
      filePath={params.get('file')}
      onTab={(t, file) => go({ task, tab: t === 'instruction' ? null : t, file }, false)}
      onBack={() => go({ view: view === 'landscape' ? 'landscape' : null })}
      onOpen={(name) => go({ task: name })}
    />
  ) : (
    <Browse
      tasks={index.tasks}
      per={per}
      view={view}
      filters={filters}
      setFilters={setFilters}
      onView={(v) => go({ view: v === 'landscape' ? 'landscape' : null }, false)}
      onOpen={(name) => go({ task: name })}
    />
  )
}
