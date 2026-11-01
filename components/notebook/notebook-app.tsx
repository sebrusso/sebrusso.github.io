'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NotebookProvider, useNotebook } from '../../lib/notebook/store'
import { PEOPLE } from '../../lib/notebook/people'
import { Gate } from './gate'
import { SummaryView } from './summary-view'
import { EvalView } from './eval-view'
import { CompareView } from './compare-view'
import { CommentDrawer, CommentHighlighter, CommentsContext, SelectionCommenter, type CommentsApi } from '../comments/comments'

export const NOTEBOOK_BASE = '/notebook-7f3k9q'

export function NotebookApp() {
  return (
    <NotebookProvider>
      <div className="nb-root">
        <NotebookComments>
          <Screens />
        </NotebookComments>
      </div>
    </NotebookProvider>
  )
}

// Feeds the shared comment components from the notebook's store.
function NotebookComments({ children }: { children: React.ReactNode }) {
  const nb = useNotebook()
  const api = useMemo<CommentsApi>(
    () => ({
      user: nb.user,
      login: nb.login,
      comments: nb.comments,
      addComment: nb.addComment,
      setResolved: nb.setResolved,
      target: nb.commentTarget,
      open: nb.openComments,
      describe: (slug, fieldId) => {
        const entry = nb.evals.find((e) => e.slug === slug)
        const field = entry?.fields.find((f) => f.id === fieldId)
        return entry && field ? { title: entry.name, label: field.label, text: `${field.value}\n${field.notes}` } : null
      },
    }),
    [nb]
  )
  return <CommentsContext.Provider value={api}>{children}</CommentsContext.Provider>
}

function Screens() {
  const { ready, user, logout, evals } = useNotebook()
  const params = useSearchParams()
  const router = useRouter()
  const slug = params.get('e')
  const view = params.get('view')

  if (!ready) return <div className="min-h-[60vh]" />
  if (!user) return <Gate />

  // Static export: evals added after the build can't have their own routes,
  // so every view is this same page with a query string.
  const go = (qs: string) => {
    router.push(qs ? `${NOTEBOOK_BASE}?${qs}` : NOTEBOOK_BASE)
    window.scrollTo({ top: 0 })
  }
  const open = (s: string | null) => go(s ? `e=${s}` : '')
  const entry = slug ? evals.find((e) => e.slug === slug) : null
  const tab = view === 'compare' ? 'compare' : 'evals'

  return (
    <div>
      <div className="flex items-center gap-1 pt-2 text-sm">
        <nav aria-label="Notebook" className="flex gap-1">
          {(
            [
              ['evals', 'Evals', ''],
              ['compare', 'Compare', 'view=compare'],
            ] as const
          ).map(([id, label, qs]) => (
            <button
              key={id}
              onClick={() => go(qs)}
              aria-current={tab === id && !(id === 'evals' && slug) ? 'page' : undefined}
              className="h-8 rounded-md px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
            >
              {label}
            </button>
          ))}
        </nav>
        <span className="ml-auto nb-who" data-who={user}>
          {PEOPLE[user].short}
        </span>
        <button onClick={logout} className="px-2 text-xs text-muted-foreground hover:text-foreground">
          Log out
        </button>
      </div>

      {tab === 'compare' ? (
        <CompareView onOpen={open} />
      ) : slug && !entry ? (
        <div className="py-16 text-center text-muted-foreground">
          No eval called “{slug}”.{' '}
          <button onClick={() => open(null)} className="text-primary hover:underline">
            Back to all evals
          </button>
        </div>
      ) : entry ? (
        <EvalView entry={entry} base={NOTEBOOK_BASE} />
      ) : (
        <SummaryView base={NOTEBOOK_BASE} onOpen={open} onCompare={() => go('view=compare')} />
      )}

      <SelectionCommenter />
      <CommentHighlighter />
      <CommentDrawer />
    </div>
  )
}
