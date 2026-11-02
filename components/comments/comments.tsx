'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, MessageSquarePlus, X } from 'lucide-react'
import { openThreadCount, type CommentTarget } from '../../lib/comments/store'
import { personFromName } from '../../lib/notebook/people'
import type { Comment, Person } from '../../lib/notebook/types'
import { WhoBadge, relativeTime } from '../notebook/bits'

// Google-Docs-style comments, shared by the eval notebook and the TB4 task
// browser. Any element rendering commentable text carries fieldAttr(slug,
// fieldId); selecting text inside one offers a Comment button, and open
// threads' quotes are highlighted wherever that item is shown. Each page
// supplies a CommentsApi through <CommentsContext.Provider>.

export interface CommentsApi {
  user: Person | null
  login: (p: Person) => void
  comments: Comment[]
  addComment: (target: CommentTarget, body: string, parentId?: string | null) => void
  setResolved: (threadId: string, resolved: boolean) => void
  target: CommentTarget | null
  open: (target: CommentTarget | null) => void
  /** Names the item for the drawer header; `text` (as rendered) flags quotes that no longer match. */
  describe: (slug: string, fieldId: string) => { title: string; label: string; text?: string } | null
}

export const CommentsContext = createContext<CommentsApi | null>(null)

export function useComments(): CommentsApi {
  const ctx = useContext(CommentsContext)
  if (!ctx) throw new Error('useComments must be used inside CommentsContext.Provider')
  return ctx
}

// Slugs and field ids may contain ':' (TB4 file paths), so they travel in two attributes.
export const fieldAttr = (slug: string, fieldId: string) => ({ 'data-nb-slug': slug, 'data-nb-fid': fieldId })

// Text as rendered, for comparing a quote with stored Markdown: drop link
// targets and emphasis marks, thousands separators, % signs and extra spaces.
const plainText = (s: string) =>
  s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/(\d),(?=\d{3})/g, '$1')
    .replace(/%/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export function CommentButton({ slug, fieldId, label }: { slug: string; fieldId: string; label: string }) {
  const { comments, open } = useComments()
  const n = openThreadCount(comments, slug, fieldId)
  return (
    <button
      type="button"
      onClick={() => open({ slug, fieldId, quote: null })}
      aria-label={n ? `${n} comment threads on ${label}` : `Comment on ${label}`}
      className={`inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs hover:bg-muted ${n ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      {n ? <MessageSquare size={13} /> : <MessageSquarePlus size={13} />}
      {n > 0 && <span className="nb-mono">{n}</span>}
    </button>
  )
}

function findRanges(root: Element, quote: string): Range[] {
  // Line numbers and other [data-nb-skip] chrome aren't part of the quotable text.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('[data-nb-skip]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  })
  // Match ignoring whitespace: a selection across code lines or Markdown
  // blocks carries line breaks that aren't text nodes in the DOM.
  const chars: { node: Text; offset: number }[] = []
  let text = ''
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const value = n.nodeValue ?? ''
    for (let i = 0; i < value.length; i++) {
      if (/\s/.test(value[i])) continue
      chars.push({ node: n as Text, offset: i })
      text += value[i]
    }
  }
  const needle = quote.replace(/\s+/g, '')
  const at = needle ? text.indexOf(needle) : -1
  if (at < 0) return []
  // One range per text node, so a quote across code lines doesn't also tint
  // the line-number gutter between them.
  const ranges: Range[] = []
  let start = chars[at]
  let prev = start
  const close = (from: { node: Text; offset: number }, to: { node: Text; offset: number }) => {
    const r = document.createRange()
    r.setStart(from.node, from.offset)
    r.setEnd(to.node, to.offset + 1)
    ranges.push(r)
  }
  for (let i = at + 1; i < at + needle.length; i++) {
    const c = chars[i]
    if (c.node !== prev.node) {
      close(start, prev)
      start = c
    }
    prev = c
  }
  close(start, prev)
  return ranges
}

type HighlightCtor = new (...ranges: Range[]) => object
const highlightApi = () => {
  const registry = (CSS as unknown as { highlights?: Map<string, object> }).highlights
  const Highlight = (window as unknown as { Highlight?: HighlightCtor }).Highlight
  return registry && Highlight ? { registry, Highlight } : null
}

const hostsOf = (slug: string, fieldId: string) =>
  document.querySelectorAll(`[data-nb-slug="${CSS.escape(slug)}"][data-nb-fid="${CSS.escape(fieldId)}"]`)

/** Paints open threads' quotes; the thread being viewed gets a stronger tint. */
export function CommentHighlighter() {
  const { comments, target } = useComments()
  useEffect(() => {
    const api = highlightApi()
    if (!api) return
    const threads = comments.filter((c) => !c.parentId && !c.resolvedAt && c.quote)
    const paint = () => {
      const normal: Range[] = []
      const active: Range[] = []
      for (const t of threads) {
        hostsOf(t.slug, t.fieldId).forEach((el) => {
          const isActive = target?.slug === t.slug && target.fieldId === t.fieldId
          ;(isActive ? active : normal).push(...findRanges(el, t.quote as string))
        })
      }
      api.registry.set('nb-comment', new api.Highlight(...normal))
      api.registry.set('nb-comment-active', new api.Highlight(...active))
    }
    paint()
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new MutationObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(paint, 120)
    })
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [comments, target])
  useEffect(
    () => () => {
      const api = highlightApi()
      api?.registry.delete('nb-comment')
      api?.registry.delete('nb-comment-active')
    },
    []
  )
  return null
}

/** Floating "Comment" button over a text selection inside a commentable item. */
export function SelectionCommenter() {
  const { open } = useComments()
  const [spot, setSpot] = useState<{ x: number; y: number; slug: string; fieldId: string; quote: string } | null>(null)

  useEffect(() => {
    const read = () => {
      const sel = window.getSelection()
      const quote = sel?.toString().trim() ?? ''
      if (!sel || sel.isCollapsed || !quote || sel.rangeCount === 0) return setSpot(null)
      const range = sel.getRangeAt(0)
      const host = (n: Node | null) => (n instanceof Element ? n : n?.parentElement)?.closest('[data-nb-fid]')
      const a = host(range.startContainer)
      if (!a || a !== host(range.endContainer)) return setSpot(null)
      const rect = range.getBoundingClientRect()
      setSpot({
        x: rect.right,
        y: rect.bottom,
        slug: a.getAttribute('data-nb-slug') as string,
        fieldId: a.getAttribute('data-nb-fid') as string,
        quote: quote.slice(0, 400),
      })
    }
    const onUp = () => setTimeout(read, 0)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        read()
        setSpot((s) => {
          if (s) {
            open({ slug: s.slug, fieldId: s.fieldId, quote: s.quote })
            window.getSelection()?.removeAllRanges()
          }
          return null
        })
      } else if (e.shiftKey) onUp()
    }
    const onScroll = () => setSpot(null)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('keyup', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('keyup', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  if (!spot) return null
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        open({ slug: spot.slug, fieldId: spot.fieldId, quote: spot.quote })
        window.getSelection()?.removeAllRanges()
        setSpot(null)
      }}
      className="fixed z-50 inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-2.5 text-xs font-medium text-background shadow-lg"
      style={{ left: Math.min(spot.x + 6, window.innerWidth - 120), top: spot.y + 6 }}
    >
      <MessageSquarePlus size={13} /> Comment
    </button>
  )
}

/** Right-hand drawer (bottom sheet on phones) with an item's threads. */
export function CommentDrawer() {
  const { target, open, comments, addComment, setResolved, describe, user } = useComments()
  const [body, setBody] = useState('')
  const [quote, setQuote] = useState<string | null>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setQuote(target?.quote ?? null)
    setBody('')
    if (target) setTimeout(() => box.current?.focus(), 0)
  }, [target])

  useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && open(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [target, open])

  const threads = useMemo(() => {
    if (!target) return []
    const mine = comments.filter((c) => c.slug === target.slug && c.fieldId === target.fieldId)
    return mine.filter((c) => !c.parentId).map((root) => ({ root, replies: mine.filter((c) => c.parentId === root.id) }))
  }, [comments, target])

  const info = target ? describe(target.slug, target.fieldId) : null
  if (!target || !info) return null
  const openThreads = threads.filter((t) => !t.root.resolvedAt)
  const resolved = threads.filter((t) => t.root.resolvedAt)
  const itemText = info.text === undefined ? null : plainText(info.text)

  const post = () => {
    if (!body.trim()) return
    addComment({ ...target, quote }, body.trim())
    setBody('')
    setQuote(null)
  }

  return (
    <aside
      aria-label="Comments"
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[75vh] flex-col rounded-t-xl border-t border-border bg-popover text-popover-foreground shadow-2xl md:inset-x-auto md:bottom-0 md:right-0 md:top-0 md:max-h-none md:w-[24rem] md:rounded-none md:border-l md:border-t-0"
    >
      <header className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-muted-foreground">{info.title}</div>
          <div className="break-words font-medium leading-snug">{info.label}</div>
        </div>
        <button onClick={() => open(null)} aria-label="Close comments" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {user ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              post()
            }}
          >
            {quote && (
              <div className="flex items-start gap-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-sm">
                <span className="line-clamp-3 flex-1 whitespace-pre-wrap">“{quote}”</span>
                <button type="button" onClick={() => setQuote(null)} aria-label="Remove quote" className="text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              </div>
            )}
            <textarea
              ref={box}
              id="nb-comment-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post()
              }}
              rows={3}
              placeholder={quote ? 'Comment on the highlighted text' : 'Comment on this'}
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="nb-mono text-xs text-muted-foreground">⌘↵ to post</span>
              <button type="submit" disabled={!body.trim()} className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40">
                Comment
              </button>
            </div>
          </form>
        ) : (
          <NameSignIn />
        )}

        <div className="mt-5 flex flex-col gap-4">
          {openThreads.length === 0 && <p className="text-sm text-muted-foreground">No open comments here yet.</p>}
          {openThreads.map((t) => (
            <Thread
              key={t.root.id}
              root={t.root}
              replies={t.replies}
              stale={!!t.root.quote && itemText !== null && !itemText.includes(plainText(t.root.quote))}
              onReply={user ? (text) => addComment(target, text, t.root.id) : undefined}
              onResolve={user ? () => setResolved(t.root.id, true) : undefined}
            />
          ))}
          {resolved.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">{resolved.length} resolved</summary>
              <div className="mt-3 flex flex-col gap-4 opacity-75">
                {resolved.map((t) => (
                  <Thread key={t.root.id} root={t.root} replies={t.replies} stale={false} onReopen={user ? () => setResolved(t.root.id, false) : undefined} />
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </aside>
  )
}

/** Name-only sign-in, for pages that don't gate on login (drawer, transcripts). */
export function NameSignIn({ prompt = "What's your name?" }: { prompt?: string }) {
  const { login } = useComments()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-border p-3"
      onSubmit={(e) => {
        e.preventDefault()
        const p = personFromName(name)
        if (p) login(p)
        else setError("We don't recognize that name.")
      }}
    >
      <label htmlFor="nb-comment-name" className="text-sm font-medium">
        {prompt}
      </label>
      <div className="flex gap-2">
        <input
          id="nb-comment-name"
          autoFocus
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm"
        />
        <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
          Continue
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}

function Thread({
  root,
  replies,
  stale,
  onReply,
  onResolve,
  onReopen,
}: {
  root: Comment
  replies: Comment[]
  stale: boolean
  onReply?: (text: string) => void
  onResolve?: () => void
  onReopen?: () => void
}) {
  const [reply, setReply] = useState('')
  return (
    <article className="rounded-lg border border-border p-3">
      {root.quote && (
        <div className="mb-2 border-l-2 border-[hsl(var(--nb-comment-strong))] pl-2 text-sm text-muted-foreground">
          <span className="line-clamp-3 whitespace-pre-wrap">“{root.quote}”</span>
          {stale && <span className="mt-0.5 block text-xs">Text changed since this comment.</span>}
        </div>
      )}
      <ol className="flex flex-col gap-2.5">
        {[root, ...replies].map((c) => (
          <li key={c.id} className="text-sm">
            <div className="mb-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <WhoBadge who={c.author} />
              <span>{relativeTime(c.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap">{c.body}</p>
          </li>
        ))}
      </ol>
      {(onReply || onResolve || onReopen) && (
        <div className="mt-2.5 flex items-center gap-2">
          {onReply && (
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (reply.trim()) {
                  onReply(reply.trim())
                  setReply('')
                }
              }}
            >
              <input
                id={`nb-reply-${root.id}`}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply"
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm"
              />
            </form>
          )}
          {onResolve && (
            <button onClick={onResolve} className="h-8 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
              Resolve
            </button>
          )}
          {onReopen && (
            <button onClick={onReopen} className="h-8 rounded-md px-2 text-xs text-primary hover:underline">
              Reopen
            </button>
          )}
        </div>
      )}
    </article>
  )
}
