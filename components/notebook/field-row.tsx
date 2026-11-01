'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, History, Check, Trash2, PenLine } from 'lucide-react'
import { checkAnswer } from '../../lib/notebook/build'
import { useNotebook } from '../../lib/notebook/store'
import type { FieldRow as Field } from '../../lib/notebook/types'
import { Markdown, WhoBadge, hostOf, relativeTime, shortDate } from './bits'
import { PEOPLE } from '../../lib/notebook/people'
import { AnswerInput, AnswerView } from './answer'
import { CommentButton, fieldAttr } from '../comments/comments'

export function FieldRow({ slug, field }: { slug: string; field: Field }) {
  const { updateField, checkField, deleteField, restoreVersion } = useNotebook()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ value: field.value, notes: field.notes })
  const [notesOpen, setNotesOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!editing) setDraft({ value: field.value, notes: field.notes })
  }, [field.value, field.notes, editing])

  const error = checkAnswer(field.type, draft.value, field.options)
  const save = () => {
    if (error) return
    updateField(slug, field.id, { value: draft.value.trim(), notes: draft.notes.trim() })
    setEditing(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 900)
  }

  const unchecked = field.author === 'ai' && !field.checkedBy && !!field.value
  const hasNotes = !!field.notes.trim()

  return (
    <div
      id={`f-${field.key}`}
      data-unchecked={unchecked}
      className={`nb-field group grid gap-2 py-3 pl-4 pr-3 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-6 ${flash ? 'nb-saved' : ''}`}
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium leading-snug">{field.label}</span>
        {field.format && <span className="nb-chip">{field.format}</span>}
        {field.origin === 'custom' && <span className="nb-chip">Custom</span>}
      </div>

      <div className="min-w-0">
        {editing ? (
          <div className="flex flex-col gap-3">
            <AnswerInput
              id={`edit-${field.id}`}
              field={field}
              value={draft.value}
              onChange={(value) => setDraft((d) => ({ ...d, value }))}
              onSubmit={save}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Notes{field.notesGuide ? ` · ${field.notesGuide}` : ''}</span>
              <textarea
                id={`notes-${field.id}`}
                value={draft.notes}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, notes: e.target.value }))
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight + 2}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
                  if (e.key === 'Escape') setEditing(false)
                }}
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2.5 text-sm leading-relaxed"
                placeholder="Markdown. Links as [text](url)."
              />
            </label>
            <div className="flex items-center gap-2">
              <button onClick={save} disabled={!!error} className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="h-8 rounded-md px-3 text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <span className="nb-mono ml-auto text-xs text-muted-foreground">⌘↵ to save</span>
            </div>
          </div>
        ) : (
          <div {...fieldAttr(slug, field.id)}>
            <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1">
              {field.value ? (
                <AnswerView field={field} />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-sm text-muted-foreground/70 underline decoration-dashed decoration-border underline-offset-4 hover:text-foreground"
                >
                  {field.fill === 'human' ? 'Add your read' : 'Not filled'}
                </button>
              )}
              {(hasNotes || field.notesGuide) && (
                <button
                  type="button"
                  onClick={() => setNotesOpen((o) => !o)}
                  aria-expanded={notesOpen}
                  aria-controls={`notes-body-${field.id}`}
                  className={`inline-flex items-center gap-0.5 text-xs hover:text-foreground ${hasNotes ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
                >
                  <ChevronRight size={13} className={`transition-transform ${notesOpen ? 'rotate-90' : ''}`} />
                  Notes{!hasNotes && ' (empty)'}
                </button>
              )}
            </div>
            {notesOpen && (
              <div id={`notes-body-${field.id}`} className="mt-2 rounded-md bg-muted/40 px-3 py-2">
                {hasNotes ? (
                  <Markdown>{field.notes}</Markdown>
                ) : (
                  <p className="text-sm text-muted-foreground">{field.notesGuide || 'No notes yet.'}</p>
                )}
                {field.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {field.sources.map((s) => (
                      <a key={s} href={s} target="_blank" rel="noreferrer" className="nb-mono underline decoration-border underline-offset-2 hover:text-foreground">
                        {hostOf(s)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!editing && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {field.author && <WhoBadge who={field.author} checkedBy={field.checkedBy} />}
            {field.author && field.updatedAt && (
              <span>
                edited {shortDate(field.updatedAt)} by {PEOPLE[field.author].short}
              </span>
            )}
            {field.confidence && <span className="nb-chip">{field.confidence}</span>}
          <div className="-my-1 ml-auto flex flex-wrap gap-0.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:[&:has([aria-label*='threads'])]:opacity-100">
            <CommentButton slug={slug} fieldId={field.id} label={field.label} />
            {field.author === 'ai' && field.value && (
              <RowAction onClick={() => checkField(slug, field.id)} icon={<Check size={13} />}>
                {field.checkedBy ? 'Uncheck' : 'Check'}
              </RowAction>
            )}
            <RowAction onClick={() => setEditing(true)} icon={<PenLine size={13} />}>
              Edit
            </RowAction>
            {field.history.length > 0 && (
              <RowAction onClick={() => setShowHistory((v) => !v)} icon={<History size={13} />} pressed={showHistory}>
                History ({field.history.length})
              </RowAction>
            )}
            <RowAction onClick={() => deleteField(slug, field.id)} icon={<Trash2 size={13} />}>
              Delete
            </RowAction>
          </div>
          </div>
        )}

        {showHistory && !editing && (
          <ol className="mt-3 flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
            {[...field.history].reverse().map((h, ri) => {
              const i = field.history.length - 1 - ri
              const current = i === field.history.length - 1
              return (
                <li key={`${h.at}-${i}`} className="text-sm">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <WhoBadge who={h.author} />
                    <span>{relativeTime(h.at)}</span>
                    {current ? (
                      <span className="ml-auto">current</span>
                    ) : (
                      <button onClick={() => restoreVersion(slug, field.id, i)} className="ml-auto text-primary hover:underline">
                        Restore
                      </button>
                    )}
                  </div>
                  <div className="font-medium">{h.value || '(empty)'}</div>
                  {h.notes && <div className="line-clamp-2 text-muted-foreground">{h.notes}</div>}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}

function RowAction({
  children,
  icon,
  onClick,
  pressed,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  onClick: () => void
  pressed?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
    >
      {icon}
      {children}
    </button>
  )
}
