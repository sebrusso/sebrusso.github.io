'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, MessageSquarePlus, X } from 'lucide-react'
import { openThreadCount, useNotebook } from '../../lib/notebook/store'
import type { Comment } from '../../lib/notebook/types'
import { WhoBadge, relativeTime } from './bits'

// Google-Docs-style comments. Any element rendering a field's text carries
// data-nb-field="<slug>:<fieldId>"; selecting text inside one offers a
// Comment button, and open threads' quotes are highlighted wherever that
// field is shown (eval page and compare page alike).

export const fieldAttr = (slug: string, fieldId: string) => ({ 'data-nb-field': `${slug}:${fieldId}` })

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
  const { comments, openComments } = useNotebook()
  const n = openThreadCount(comments, slug, fieldId)
  return (
    <button
      type="button"
      onClick={() => openComments({ slug, fieldId, quote: null })}
      aria-label={n ? `${n} comment threads on ${label}` : `Comment on ${label}`}
      className={`inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs hover:bg-muted ${n ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      {n ? <MessageSquare size={13} /> : <MessageSquarePlus size={13} />}
      {n > 0 && <span className="nb-mono">{n}</span>}
    </button>
  )
}

function findRange(root: Element, quote: string): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let text = ''
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    nodes.push(n as Text)
    text += n.nodeValue ?? ''
  }
  const at = text.indexOf(quote)
  if (at < 0) return null
  const range = document.createRange()
  let offset = 0
  let started = false
  for (const node of nodes) {
    const len = node.length
    if (!started && at < offset + len) {
      range.setStart(node, at - offset)
      started = true
    }
    if (started && at + quote.length <= offset + len) {
      range.setEnd(node, at + quote.length - offset)
      return range
    }
    offset += len
  }
  return null
}

type HighlightCtor = new (...ranges: Range[]) => object
const highlightApi = () => {
  const registry = (CSS as unknown as { highlights?: Map<string, object> }).highlights
  const Highlight = (window as unknown as { Highlight?: HighlightCtor }).Highlight
  return registry && Highlight ? { registry, Highlight } : null
}

/** Paints open threads' quotes; the thread being viewed gets a stronger tint. */
export function CommentHighlighter() {
  const { comments, commentTarget } = useNotebook()
  useEffect(() => {
    const api = highlightApi()
    if (!api) return
    const threads = comments.filter((c) => !c.parentId && !c.resolvedAt && c.quote)
    const paint = () => {
      const normal: Range[] = []
      const active: Range[] = []
      for (const t of threads) {
        document.querySelectorAll(`[data-nb-field="${t.slug}:${t.fieldId}"]`).forEach((el) => {
          const r = findRange(el, t.quote as string)
          if (!r) return
          const isActive = commentTarget?.slug === t.slug && commentTarget.fieldId === t.fieldId
          ;(isActive ? active : normal).push(r)
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
  }, [comments, commentTarget])
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

/** Floating "Comment" button over a text selection inside a field. */
export function SelectionCommenter() {
  const { openComments } = useNotebook()
  const [spot, setSpot] = useState<{ x: number; y: number; slug: string; fieldId: string; quote: string } | null>(null)

  useEffect(() => {
    const read = () => {
      const sel = window.getSelection()
      const quote = sel?.toString().trim() ?? ''
      if (!sel || sel.isCollapsed || !quote || sel.rangeCount === 0) return setSpot(null)
      const range = sel.getRangeAt(0)
      const host = (n: Node | null) => (n instanceof Element ? n : n?.parentElement)?.closest('[data-nb-field]')
      const a = host(range.startContainer)
      if (!a || a !== host(range.endContainer)) return setSpot(null)
      const [slug, fieldId] = (a.getAttribute('data-nb-field') as string).split(':')
      const rect = range.getBoundingClientRect()
      setSpot({ x: rect.right, y: rect.bottom, slug, fieldId, quote: quote.slice(0, 400) })
    }
    const onUp = () => setTimeout(read, 0)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        read()
        setSpot((s) => {
          if (s) {
            openComments({ slug: s.slug, fieldId: s.fieldId, quote: s.quote })
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
  }, [openComments])

  if (!spot) return null
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        openComments({ slug: spot.slug, fieldId: spot.fieldId, quote: spot.quote })
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

/** Right-hand drawer (bottom sheet on phones) with a field's threads. */
export function CommentDrawer() {
  const { commentTarget: target, openComments, comments, evals, addComment, setResolved } = useNotebook()
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openComments(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [target, openComments])

  const entry = target ? evals.find((e) => e.slug === target.slug) : undefined
  const field = entry?.fields.find((f) => f.id === target?.fieldId)
  const threads = useMemo(() => {
    if (!target) return []
    const mine = comments.filter((c) => c.slug === target.slug && c.fieldId === target.fieldId)
    return mine
      .filter((c) => !c.parentId)
      .map((root) => ({ root, replies: mine.filter((c) => c.parentId === root.id) }))
  }, [comments, target])

  if (!target || !entry || !field) return null
  const open = threads.filter((t) => !t.root.resolvedAt)
  const resolved = threads.filter((t) => t.root.resolvedAt)
  const fieldText = plainText(`${field.value}\n${field.notes}`)

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
          <div className="text-xs text-muted-foreground">{entry.name}</div>
          <div className="font-medium leading-snug">{field.label}</div>
        </div>
        <button onClick={() => openComments(null)} aria-label="Close comments" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            post()
          }}
        >
          {quote && (
            <div className="flex items-start gap-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-sm">
              <span className="nb-quote line-clamp-3 flex-1">“{quote}”</span>
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
            placeholder={quote ? 'Comment on the highlighted text' : 'Comment on this field'}
            className="w-full rounded-md border border-input bg-background p-2.5 text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="nb-mono text-xs text-muted-foreground">⌘↵ to post</span>
            <button type="submit" disabled={!body.trim()} className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40">
              Comment
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-col gap-4">
          {open.length === 0 && <p className="text-sm text-muted-foreground">No open comments on this field.</p>}
          {open.map((t) => (
            <Thread
              key={t.root.id}
              root={t.root}
              replies={t.replies}
              stale={!!t.root.quote && !fieldText.includes(plainText(t.root.quote))}
              onReply={(text) => addComment(target, text, t.root.id)}
              onResolve={() => setResolved(t.root.id, true)}
            />
          ))}
          {resolved.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">{resolved.length} resolved</summary>
              <div className="mt-3 flex flex-col gap-4 opacity-75">
                {resolved.map((t) => (
                  <Thread
                    key={t.root.id}
                    root={t.root}
                    replies={t.replies}
                    stale={false}
                    onReopen={() => setResolved(t.root.id, false)}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </aside>
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
          <span className="line-clamp-3">“{root.quote}”</span>
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
    </article>
  )
}
