'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Comment, Person } from '../notebook/types'
import { rest, signIn, signOut } from '../supabase/client'

// Comments and the signed-in name are shared by every page that comments
// (the eval notebook and the TB4 task browser). The name lives in this
// browser; comments live in Supabase so Seb and Daniel see each other's.

export const USER_KEY = 'evalnb-user'
/** Where comments lived before Supabase; read once to carry them over. */
export const COMMENTS_KEY = 'evalnb-comments-v1'
const POLL_MS = 15_000

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

/** Which item the comment drawer is open on, and the words to quote. */
export interface CommentTarget {
  slug: string
  fieldId: string
  quote: string | null
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useIdentity() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<Person | null>(null)
  useEffect(() => {
    setUser(load<Person>(USER_KEY))
    setReady(true)
  }, [])
  const login = useCallback((p: Person) => {
    setUser(p)
    save(USER_KEY, p)
    signIn(p).catch(() => {
      // Retried on the first database call.
    })
  }, [])
  const logout = useCallback(() => {
    setUser(null)
    save(USER_KEY, null)
    signOut()
  }, [])
  return { ready, user, login, logout }
}

interface Row {
  id: string
  slug: string
  field_id: string
  parent_id: string | null
  quote: string | null
  body: string
  author: Person
  created_at: string
  resolved_at: string | null
}

const fromRow = (r: Row): Comment => ({
  id: r.id,
  slug: r.slug,
  fieldId: r.field_id,
  parentId: r.parent_id,
  quote: r.quote,
  body: r.body,
  author: r.author,
  createdAt: r.created_at,
  resolvedAt: r.resolved_at,
})

const toRow = (c: Comment): Row => ({
  id: c.id,
  slug: c.slug,
  field_id: c.fieldId,
  parent_id: c.parentId,
  quote: c.quote,
  body: c.body,
  author: c.author,
  created_at: c.createdAt,
  resolved_at: c.resolvedAt,
})

export type SyncState = 'idle' | 'loading' | 'synced' | 'offline'

/**
 * Comments from Supabase for a signed-in member, polled while the page is
 * visible. Writes are applied locally first and rolled back if the server
 * refuses them. Signed out, the list is empty.
 */
export function useCommentStore(user: Person | null, drop?: (c: Comment) => boolean) {
  const [comments, setComments] = useState<Comment[]>([])
  const [sync, setSync] = useState<SyncState>('idle')
  const dropRef = useRef(drop)
  dropRef.current = drop

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const rows = await rest<Row[]>(user, 'comments?select=*&order=created_at.asc')
      setComments(rows.map(fromRow).filter((c) => !dropRef.current?.(c)))
      setSync('synced')
    } catch {
      setSync('offline')
    }
  }, [user])

  // Carry over comments this person wrote before comments moved to Supabase.
  const carryOver = useCallback(async () => {
    if (!user) return
    const local = load<Comment[]>(COMMENTS_KEY)
    if (!local?.length) return
    const mine = local.filter((c) => c.author === user)
    if (mine.length) {
      // Parents first, so replies' foreign keys resolve.
      const ordered = [...mine.filter((c) => !c.parentId), ...mine.filter((c) => c.parentId)]
      await rest(user, 'comments?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
        json: ordered.map(toRow),
      })
    }
    const rest_ = local.filter((c) => c.author !== user)
    save(COMMENTS_KEY, rest_.length ? rest_ : null)
  }, [user])

  useEffect(() => {
    if (!user) {
      setComments([])
      setSync('idle')
      return
    }
    let live = true
    setSync('loading')
    carryOver()
      .catch(() => {
        // Left in localStorage; tried again next load.
      })
      .finally(() => live && refresh())
    const tick = () => document.visibilityState === 'visible' && refresh()
    const timer = setInterval(tick, POLL_MS)
    window.addEventListener('focus', tick)
    return () => {
      live = false
      clearInterval(timer)
      window.removeEventListener('focus', tick)
    }
  }, [user, refresh, carryOver])

  const addComment = useCallback(
    (target: CommentTarget, body: string, parentId: string | null = null) => {
      if (!user) return
      const c: Comment = {
        id: newId(),
        slug: target.slug,
        fieldId: target.fieldId,
        parentId,
        quote: parentId ? null : target.quote,
        body,
        author: user,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      }
      setComments((all) => [...all, c])
      rest(user, 'comments', { method: 'POST', headers: { Prefer: 'return=minimal' }, json: toRow(c) }).then(refresh, () => {
        setComments((all) => all.filter((x) => x.id !== c.id))
        setSync('offline')
      })
    },
    [user, refresh]
  )

  const setResolved = useCallback(
    (threadId: string, resolved: boolean) => {
      if (!user) return
      const at = resolved ? new Date().toISOString() : null
      let before: string | null = null
      setComments((all) =>
        all.map((c) => {
          if (c.id !== threadId) return c
          before = c.resolvedAt
          return { ...c, resolvedAt: at }
        })
      )
      rest(user, `comments?id=eq.${encodeURIComponent(threadId)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, json: { resolved_at: at } }).then(
        refresh,
        () => setComments((all) => all.map((c) => (c.id === threadId ? { ...c, resolvedAt: before } : c)))
      )
    },
    [user, refresh]
  )

  return { comments, addComment, setResolved, sync }
}

/** Open (unresolved) threads on one item. */
export function openThreadCount(comments: Comment[], slug: string, fieldId?: string): number {
  return comments.filter((c) => c.slug === slug && (fieldId === undefined || c.fieldId === fieldId) && !c.parentId && !c.resolvedAt).length
}
