'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FIXTURES } from './fixtures'
import { evalFromFixture, evalFromTemplate, newId } from './build'
import type { Author, Comment, EvalEntry, FieldRow, Person } from './types'
import { load, save, useCommentStore, useIdentity, type CommentTarget } from '../comments/store'

export { load, save, openThreadCount, type CommentTarget } from '../comments/store'

// Mock store: evals live in this browser's localStorage, seeded from the
// research fixtures; comments and the signed-in name come from the shared
// comment store. The Supabase store replaces this module in milestone 2
// behind the same hook, so the views don't change.

const DATA_KEY = 'evalnb-mock-v3'
// Evals taken out of the notebook; removed from browsers that saved them.
const RETIRED_SLUGS = ['terminal-bench-2']

interface NotebookApi {
  ready: boolean
  user: Person | null
  login: (p: Person) => void
  logout: () => void
  evals: EvalEntry[]
  addEval: (name: string) => EvalEntry
  updateField: (slug: string, fieldId: string, next: { value: string; notes: string }) => void
  checkField: (slug: string, fieldId: string) => void
  deleteField: (slug: string, fieldId: string) => void
  restoreField: (slug: string, fieldId: string) => void
  restoreVersion: (slug: string, fieldId: string, index: number) => void
  addField: (slug: string, section: string, label: string, notesGuide: string) => void
  comments: Comment[]
  addComment: (target: CommentTarget, body: string, parentId?: string | null) => void
  setResolved: (threadId: string, resolved: boolean) => void
  commentTarget: CommentTarget | null
  openComments: (target: CommentTarget | null) => void
}

const Ctx = createContext<NotebookApi | null>(null)

export function NotebookProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const { ready: userReady, user, login, logout } = useIdentity()
  const [evals, setEvals] = useState<EvalEntry[]>([])
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null)
  const gone = useRef<Set<string>>(new Set())

  // Declared before useCommentStore so `gone` is set when it first reads.
  useEffect(() => {
    const stored = load<EvalEntry[]>(DATA_KEY)
    // Seed from fixtures; pick up fixtures added since this browser last saved,
    // and drop evals that were removed from the notebook.
    const seeded = FIXTURES.map(evalFromFixture)
    const retired = (e: EvalEntry) => RETIRED_SLUGS.includes(e.slug) && e.createdBy === 'ai'
    gone.current = new Set((stored ?? []).filter(retired).map((e) => e.slug))
    const base = (stored ?? []).filter((e) => !retired(e))
    setEvals([...base, ...seeded.filter((s) => !base.some((e) => e.slug === s.slug))])
    setReady(true)
  }, [])

  const { comments, addComment, setResolved } = useCommentStore(user, (c: Comment) => gone.current.has(c.slug))

  useEffect(() => {
    if (ready) save(DATA_KEY, evals)
  }, [evals, ready])

  const mutateField = useCallback(
    (slug: string, fieldId: string, fn: (f: FieldRow) => FieldRow) =>
      setEvals((all) =>
        all.map((e) =>
          e.slug !== slug ? e : { ...e, fields: e.fields.map((f) => (f.id === fieldId ? fn(f) : f)) }
        )
      ),
    []
  )

  const api = useMemo<NotebookApi>(() => {
    const me: Person = user ?? 'seb'
    const now = () => new Date().toISOString()
    const write = (f: FieldRow, value: string, notes: string): FieldRow => {
      if (f.value === value && f.notes === notes) return f
      const at = now()
      return {
        ...f,
        value,
        notes,
        author: me as Author,
        updatedAt: at,
        checkedBy: null,
        history: [...f.history, { value, notes, author: me, at }],
      }
    }
    return {
      ready: ready && userReady,
      user,
      login,
      logout,
      evals,
      addEval: (name) => {
        const entry = evalFromTemplate(name, me)
        let slug = entry.slug
        const taken = (s: string) => RETIRED_SLUGS.includes(s) || evals.some((e) => e.slug === s)
        for (let n = 2; taken(slug); n++) slug = `${entry.slug}-${n}`
        const created = { ...entry, slug }
        setEvals((all) => [...all, created])
        return created
      },
      updateField: (slug, fieldId, next) => mutateField(slug, fieldId, (f) => write(f, next.value, next.notes)),
      checkField: (slug, fieldId) =>
        mutateField(slug, fieldId, (f) => ({ ...f, checkedBy: f.checkedBy ? null : me })),
      deleteField: (slug, fieldId) => mutateField(slug, fieldId, (f) => ({ ...f, deletedAt: now() })),
      restoreField: (slug, fieldId) => mutateField(slug, fieldId, (f) => ({ ...f, deletedAt: null })),
      restoreVersion: (slug, fieldId, index) =>
        mutateField(slug, fieldId, (f) => {
          const old = f.history[index]
          return old ? write(f, old.value, old.notes ?? '') : f
        }),
      addField: (slug, section, label, notesGuide) =>
        setEvals((all) =>
          all.map((e) => {
            if (e.slug !== slug) return e
            const position = Math.max(-1, ...e.fields.filter((f) => f.section === section).map((f) => f.position)) + 1
            const field: FieldRow = {
              id: newId(),
              key: `custom-${newId()}`,
              section,
              label,
              type: 'short',
              notesGuide,
              fill: 'human',
              position,
              value: '',
              notes: '',
              sources: [],
              origin: 'custom',
              history: [],
            }
            return { ...e, fields: [...e.fields, field] }
          })
        ),
      comments,
      addComment,
      setResolved,
      commentTarget,
      openComments: setCommentTarget,
    }
  }, [ready, userReady, user, login, logout, evals, comments, addComment, setResolved, commentTarget, mutateField])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useNotebook(): NotebookApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNotebook must be used inside NotebookProvider')
  return ctx
}
