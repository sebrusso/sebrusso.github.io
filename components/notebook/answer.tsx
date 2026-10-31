'use client'

import { Check, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { FieldRow } from '../../lib/notebook/types'

// One short answer, rendered by its type: chips for picks, Yes/No pills,
// tabular numbers with units. Links in name/short answers stay clickable.
export function AnswerView({ field, size = 'md' }: { field: Pick<FieldRow, 'type' | 'value' | 'unit'>; size?: 'sm' | 'md' }) {
  const v = field.value.trim()
  const text = size === 'sm' ? 'text-sm' : 'text-[0.9375rem]'
  if (!v) return <span className={`${text} text-muted-foreground/60`}>—</span>

  switch (field.type) {
    case 'bool':
      if (v === 'Yes')
        return (
          <span className="nb-bool" data-v="yes">
            <Check size={13} strokeWidth={2.5} /> Yes
          </span>
        )
      if (v === 'No')
        return (
          <span className="nb-bool" data-v="no">
            <X size={13} strokeWidth={2.5} /> No
          </span>
        )
      return <span className="nb-bool" data-v="unknown">Unknown</span>
    case 'enum':
    case 'multi':
      return (
        <span className="flex flex-wrap gap-1">
          {v.split(/\s*,\s*/).map((opt) => (
            <span key={opt} className="nb-pick">
              {opt}
            </span>
          ))}
        </span>
      )
    case 'int':
    case 'number':
      return (
        <span className={`nb-mono ${text}`}>
          {Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}
          {field.unit && <span className="text-muted-foreground"> {field.unit}</span>}
        </span>
      )
    case 'percent':
      return <span className={`nb-mono ${text}`}>{v}%</span>
    case 'date':
      return <span className={`nb-mono ${text}`}>{v}</span>
    default:
      return (
        <span className={`nb-inline ${text}`}>
          <ReactMarkdown
            allowedElements={['p', 'a', 'strong', 'em', 'code']}
            unwrapDisallowed
            components={{
              p: ({ children }) => <>{children}</>,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {v}
          </ReactMarkdown>
        </span>
      )
  }
}

// The matching editor. Picks are controls, not free text, so answers stay
// comparable across evals.
export function AnswerInput({
  field,
  value,
  onChange,
  onSubmit,
  id,
}: {
  field: Pick<FieldRow, 'type' | 'options' | 'unit' | 'label'>
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  id: string
}) {
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }
  if (field.type === 'bool') {
    return (
      <div className="inline-flex rounded-md border border-input p-0.5" role="radiogroup" aria-label={field.label}>
        {['Yes', 'No', 'Unknown'].map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={value === opt}
            onClick={() => onChange(value === opt ? '' : opt)}
            className="h-8 rounded px-3 text-sm text-muted-foreground aria-checked:bg-accent aria-checked:font-medium aria-checked:text-accent-foreground"
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }
  if (field.type === 'enum') {
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label={field.label}
      >
        <option value="">Not set</option>
        {field.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }
  const numeric = ['int', 'number', 'percent'].includes(field.type)
  const placeholder =
    field.type === 'date' ? 'YYYY-MM' : field.type === 'percent' ? '0–100' : numeric ? '0' : field.type === 'name' ? 'Name, or [name](url)' : 'One line'
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={keys}
        inputMode={numeric ? 'decimal' : undefined}
        placeholder={placeholder}
        aria-label={field.label}
        className={`h-9 rounded-md border border-input bg-background px-3 text-sm ${numeric || field.type === 'date' ? 'nb-mono w-32' : 'w-full'}`}
      />
      {field.type === 'percent' && <span className="text-sm text-muted-foreground">%</span>}
      {field.unit && <span className="text-sm text-muted-foreground">{field.unit}</span>}
    </div>
  )
}
