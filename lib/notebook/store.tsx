'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { FIXTURES } from './fixtures'
import { evalFromFixture, evalFromTemplate, newId } from './build'
import type { Author, Comment, EvalEntry, FieldRow, Person } from './types'

// Mock store: evals and comments live in this browser's localStorage, seeded
// from the research fixtures. The Supabase store replaces this module in
// milestone 2 behind the same hook, so the views don't change.

const DATA_KEY = 'evalnb-mock-v3'
const COMMENTS_KEY = 'evalnb-comments-v1'
const USER_KEY = 'evalnb-user'
// Evals taken out of the notebook; removed from browsers that saved them.
const RETIRED_SLUGS = ['terminal-bench-2']

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked: edits still work for this page view.
  }
}

/** Which field the comment drawer is open on, and the words to quote. */
export interface CommentTarget {
  slug: string
  fieldId: string
  quote: string | null
}

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
  const [user, setUser] = useState<Person | null>(null)
  const [evals, setEvals] = useState<EvalEntry[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null)

  useEffect(() => {
    setUser(load<Person>(USER_KEY))
    const stored = load<EvalEntry[]>(DATA_KEY)
    // Seed from fixtures; pick up fixtures added since this browser last saved,
    // and drop evals that were removed from the notebook.
    const seeded = FIXTURES.map(evalFromFixture)
    const retired = (e: EvalEntry) => RETIRED_SLUGS.includes(e.slug) && e.createdBy === 'ai'
    const gone = new Set((stored ?? []).filter(retired).map((e) => e.slug))
    const base = (stored ?? []).filter((e) => !retired(e))
    setEvals([...base, ...seeded.filter((s) => !base.some((e) => e.slug === s.slug))])
    setComments((load<Comment[]>(COMMENTS_KEY) ?? []).filter((c) => !gone.has(c.slug)))
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) save(DATA_KEY, evals)
  }, [evals, ready])

  useEffect(() => {
    if (ready) save(COMMENTS_KEY, comments)
  }, [comments, ready])

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
      ready,
      user,
      login: (p) => {
        setUser(p)
        save(USER_KEY, p)
      },
      logout: () => {
        setUser(null)
        save(USER_KEY, null)
      },
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
      addComment: (target, body, parentId = null) =>
        setComments((all) => [
          ...all,
          {
            id: newId(),
            slug: target.slug,
            fieldId: target.fieldId,
            parentId,
            quote: parentId ? null : target.quote,
            body,
            author: me,
            createdAt: now(),
            resolvedAt: null,
          },
        ]),
      setResolved: (threadId, resolved) =>
        setComments((all) => all.map((c) => (c.id === threadId ? { ...c, resolvedAt: resolved ? now() : null } : c))),
      commentTarget,
      openComments: setCommentTarget,
    }
  }, [ready, user, evals, comments, commentTarget, mutateField])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useNotebook(): NotebookApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNotebook must be used inside NotebookProvider')
  return ctx
}

/** Open (unresolved) threads on one field. */
export function openThreadCount(comments: Comment[], slug: string, fieldId: string): number {
  return comments.filter((c) => c.slug === slug && c.fieldId === fieldId && !c.parentId && !c.resolvedAt).length
}
