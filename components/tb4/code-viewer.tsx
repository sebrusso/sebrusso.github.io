'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink, WrapText } from 'lucide-react'
import { fileField, formatBytes, type TaskFile } from '../../lib/tb4/data'
import { CommentButton, fieldAttr } from '../comments/comments'

const PAGE = 1500 // lines rendered before "Show all"

export function CodeViewer({ slug, file, githubUrl }: { slug: string; file: TaskFile; githubUrl: string }) {
  const [wrap, setWrap] = useState(false)
  const [all, setAll] = useState(false)
  const [copied, setCopied] = useState(false)

  const header = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-2">
      <span className="tb4-mono min-w-0 flex-1 truncate text-[0.8125rem] font-medium">{file.path}</span>
      <span className="tb4-mono text-xs text-muted-foreground">{formatBytes(file.size)}</span>
      <CommentButton slug={slug} fieldId={fileField(file.path)} label={file.path} />
      {file.kind === 'text' && (
        <>
          <button
            onClick={() => setWrap((w) => !w)}
            aria-pressed={wrap}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
          >
            <WrapText size={13} /> Wrap
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(file.content ?? '').then(
                () => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                },
                () => setCopied(false)
              )
            }}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </>
      )}
      <a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
        GitHub <ExternalLink size={12} />
      </a>
    </div>
  )

  if (file.kind !== 'text') {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {header}
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {file.kind === 'binary' ? 'Binary file' : 'Large data file'} ({formatBytes(file.size)}), not copied here.{' '}
          <a href={githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Open it on GitHub
          </a>
          .
        </p>
      </div>
    )
  }

  const lines = (file.content ?? '').replace(/\n$/, '').split('\n')
  const visible = all ? lines : lines.slice(0, PAGE)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {header}
      <div className="max-h-[70vh] overflow-auto" {...fieldAttr(slug, fileField(file.path))}>
        <table className="tb4-code tb4-mono w-full border-collapse" data-wrap={wrap}>
          <tbody>
            {visible.map((line, i) => (
              <tr key={i}>
                <td className="ln w-[1%] whitespace-nowrap pl-3 align-top" data-nb-skip="">
                  {i + 1}
                </td>
                <td className="src pr-4 align-top">{line || ' '}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {lines.length > PAGE && !all && (
          <button data-nb-skip="" onClick={() => setAll(true)} className="w-full border-t border-border py-2.5 text-sm text-primary hover:bg-muted/40">
            Show all {lines.length.toLocaleString('en-US')} lines
          </button>
        )}
      </div>
    </div>
  )
}
