'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { load, save } from '../../lib/notebook/store'

export interface Column {
  id: string
  label: React.ReactNode
  width: number
  min?: number
}

export type TableRow = { kind: 'row'; key: string; cells: React.ReactNode[] } | { kind: 'group'; key: string; label: string }

/**
 * A table whose columns resize by dragging the right edge of a header cell
 * (double-click resets it). Widths are kept per table in this browser.
 * The first column stays pinned while the rest scroll sideways.
 */
export function ResizableTable({ id, columns, rows }: { id: string; columns: Column[]; rows: TableRow[] }) {
  const storeKey = `evalnb-colw:${id}`
  const [widths, setWidths] = useState<Record<string, number>>({})
  const drag = useRef<{ col: string; startX: number; startW: number } | null>(null)

  useEffect(() => {
    setWidths(load<Record<string, number>>(storeKey) ?? {})
  }, [storeKey])

  const widthOf = useCallback((c: Column) => widths[c.id] ?? c.width, [widths])

  const onPointerDown = (e: React.PointerEvent, c: Column) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { col: c.id, startX: e.clientX, startW: widthOf(c) }
  }
  const onPointerMove = (e: React.PointerEvent, c: Column) => {
    const d = drag.current
    if (!d || d.col !== c.id) return
    const w = Math.max(c.min ?? 72, Math.round(d.startW + e.clientX - d.startX))
    setWidths((all) => ({ ...all, [c.id]: w }))
  }
  const onPointerUp = () => {
    if (!drag.current) return
    drag.current = null
    setWidths((all) => {
      save(storeKey, all)
      return all
    })
  }
  const reset = (c: Column) =>
    setWidths((all) => {
      const next = { ...all }
      delete next[c.id]
      save(storeKey, next)
      return next
    })
  const nudge = (e: React.KeyboardEvent, c: Column) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const w = Math.max(c.min ?? 72, widthOf(c) + (e.key === 'ArrowRight' ? 16 : -16))
    setWidths((all) => {
      const next = { ...all, [c.id]: w }
      save(storeKey, next)
      return next
    })
  }

  const total = columns.reduce((sum, c) => sum + widthOf(c), 0)

  return (
    <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-border">
      <table className="text-sm" style={{ tableLayout: 'fixed', width: total }}>
        <colgroup>
          {columns.map((c) => (
            <col key={c.id} style={{ width: widthOf(c) }} />
          ))}
        </colgroup>
        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            {columns.map((c, i) => (
              <th
                key={c.id}
                scope="col"
                className={`relative px-3 py-2 align-bottom font-medium ${i === 0 ? 'sticky left-0 z-[1] bg-muted' : ''}`}
              >
                <span className="block truncate">{c.label}</span>
                <span
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`Resize column`}
                  tabIndex={0}
                  title="Drag to resize · double-click to reset"
                  onPointerDown={(e) => onPointerDown(e, c)}
                  onPointerMove={(e) => onPointerMove(e, c)}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onDoubleClick={() => reset(c)}
                  onKeyDown={(e) => nudge(e, c)}
                  className="nb-col-handle"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) =>
            r.kind === 'group' ? (
              <tr key={r.key} className="border-t border-border bg-muted/20">
                <th
                  colSpan={columns.length}
                  scope="colgroup"
                  className="nb-mono sticky left-0 px-3 pb-1.5 pt-4 text-left text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {r.label}
                </th>
              </tr>
            ) : (
              <tr key={r.key} className="border-t border-border align-top">
                {r.cells.map((cell, i) => (
                  <td key={i} className={`px-3 py-2.5 ${i === 0 ? 'sticky left-0 z-[1] bg-background' : ''}`}>
                    <div className="min-w-0 overflow-hidden">{cell}</div>
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}
