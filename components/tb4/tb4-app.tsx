'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { stripCanary, useAnalysis, useIndex, usePerTask, useTrialsMeta, type TaskDetail } from '../../lib/tb4/data'
import { useCommentStore, useIdentity, type CommentTarget } from '../../lib/comments/store'
import { CommentDrawer, CommentHighlighter, CommentsContext, SelectionCommenter, type CommentsApi } from '../comments/comments'
import { Browse, NO_FILTERS, type Filters, type View } from './browse'
import { TaskView } from './task-view'

export const TB4_BASE = '/tb4-r8v3xm'

type Tab = 'instruction' | 'tests' | 'solution' | 'environment' | 'files'
const TABS: Tab[] = ['instruction', 'tests', 'solution', 'environment', 'files']

// Static export: every view is this one page with a query string, so a task
// and file can be linked directly (?task=html-js-filter&tab=tests&file=…).
export function TB4App() {
  const { data: index, error } = useIndex()
  const { data: per } = usePerTask()
  const { data: analysis } = useAnalysis()
  const { data: trialsMeta } = useTrialsMeta()
  const params = useSearchParams()
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const { user, login } = useIdentity()
  const { comments, addComment, setResolved } = useCommentStore(user)
  const [target, setTarget] = useState<CommentTarget | null>(null)
  const [loaded, setLoaded] = useState<TaskDetail | null>(null)

  const commentsApi = useMemo<CommentsApi>(
    () => ({
      user,
      login,
      comments,
      addComment,
      setResolved,
      target,
      open: setTarget,
      describe: (slug, fieldId) => {
        const name = slug.replace(/^tb4:/, '')
        const detail = loaded?.name === name ? loaded : null
        if (fieldId === 'instruction') return { title: name, label: 'Instruction', text: detail ? stripCanary(detail.instruction) : undefined }
        const path = fieldId.replace(/^file:/, '')
        return { title: name, label: path, text: detail?.files.find((f) => f.path === path)?.content }
      },
    }),
    [user, login, comments, addComment, setResolved, target, loaded]
  )

  const task = params.get('task')
  const viewParam = params.get('view')
  const view: View = viewParam === 'landscape' || viewParam === 'info' ? viewParam : 'table'
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

  return (
    <CommentsContext.Provider value={commentsApi}>
      {task ? (
        <TaskView
          name={task}
          index={index}
          per={per}
          analysis={analysis}
          trialsMeta={trialsMeta}
          tab={tab}
          filePath={params.get('file')}
          onTab={(t, file) => go({ task, tab: t === 'instruction' ? null : t, file }, false)}
          onBack={() => go({ view: view === 'table' ? null : view })}
          onOpen={(name) => go({ task: name })}
          onLoaded={setLoaded}
        />
      ) : (
        <Browse
          index={index}
          per={per}
          analysis={analysis}
          view={view}
          filters={filters}
          setFilters={setFilters}
          onView={(v) => go({ view: v === 'table' ? null : v }, false)}
          onOpen={(name) => go({ task: name })}
        />
      )}
      <SelectionCommenter />
      <CommentHighlighter />
      <CommentDrawer />
    </CommentsContext.Provider>
  )
}
