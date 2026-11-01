'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Comment, Person } from '../notebook/types'

// Comments and the signed-in name are shared by every page that comments
// (the eval notebook and the TB4 task browser). Both live in this browser's
// localStorage until the Supabase backend lands.

export const USER_KEY = 'evalnb-user'
export const COMMENTS_KEY = 'evalnb-comments-v1'

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
  }, [])
  const logout = useCallback(() => {
    setUser(null)
    save(USER_KEY, null)
  }, [])
  return { ready, user, login, logout }
}

// Another tab may have written comments since this one loaded: merge by id,
// letting this tab's copy win for comments it knows about.
function merge(stored: Comment[], mine: Comment[]): Comment[] {
  const byId = new Map(stored.map((c) => [c.id, c]))
  mine.forEach((c) => byId.set(c.id, c))
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function useCommentStore(user: Person | null, drop?: (c: Comment) => boolean) {
  const [ready, setReady] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    const read = () => (load<Comment[]>(COMMENTS_KEY) ?? []).filter((c) => !drop?.(c))
    setComments(read())
    setReady(true)
    const onStorage = (e: StorageEvent) => e.key === COMMENTS_KEY && setComments((mine) => merge(read(), mine))
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // `drop` is a fixed filter chosen by the page; reading it once is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready) return
    save(COMMENTS_KEY, merge(load<Comment[]>(COMMENTS_KEY) ?? [], comments).filter((c) => !drop?.(c)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, ready])

  const addComment = useCallback(
    (target: CommentTarget, body: string, parentId: string | null = null) => {
      if (!user) return
      setComments((all) => [
        ...all,
        {
          id: newId(),
          slug: target.slug,
          fieldId: target.fieldId,
          parentId,
          quote: parentId ? null : target.quote,
          body,
          author: user,
          createdAt: new Date().toISOString(),
          resolvedAt: null,
        },
      ])
    },
    [user]
  )

  const setResolved = useCallback(
    (threadId: string, resolved: boolean) =>
      setComments((all) => all.map((c) => (c.id === threadId ? { ...c, resolvedAt: resolved ? new Date().toISOString() : null } : c))),
    []
  )

  return { comments, addComment, setResolved }
}

/** Open (unresolved) threads on one item. */
export function openThreadCount(comments: Comment[], slug: string, fieldId?: string): number {
  return comments.filter((c) => c.slug === slug && (fieldId === undefined || c.fieldId === fieldId) && !c.parentId && !c.resolvedAt).length
}
