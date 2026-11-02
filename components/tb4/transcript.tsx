'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { formatSeconds, formatTokens, formatUsd } from '../../lib/tb4/data'
import { useTrajectory, type AtifStep, type StoredTrajectory } from '../../lib/tb4/trajectories'
import { CommentButton, fieldAttr, NameSignIn, useComments } from '../comments/comments'

const PAGE = 150 // steps rendered before "Show more"
const OUTPUT_LINES = 12 // tool output lines shown before "Show all"

export const trialField = (trial: string) => `trial:${trial}`

/**
 * One agent run, step by step: what the agent said, its reasoning (hidden by
 * default), each tool call and what came back. The whole transcript is one
 * commentable item, so highlighting any of it starts a thread.
 */
export function Transcript({
  slug,
  label,
  stored,
  hubUrl,
  onClose,
}: {
  slug: string
  label: string
  stored: StoredTrajectory
  hubUrl: string | null
  onClose: () => void
}) {
  const { user } = useComments()
  const { data, error } = useTrajectory(user, stored.object_path)
  const [showReasoning, setShowReasoning] = useState(false)
  const [limit, setLimit] = useState(PAGE)

  const start = data?.steps[0]?.timestamp ? Date.parse(data.steps[0].timestamp) : null
  const fm = data?.final_metrics

  return (
    <section aria-label="Transcript" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{label}</div>
          <div className="tb4-mono text-xs text-muted-foreground">
            {stored.outcome.replace(/_/g, ' ')} · {stored.steps ?? '?'} steps
            {fm && ` · ${formatUsd(fm.total_cost_usd)} · ${formatTokens(fm.total_completion_tokens)} output tokens`}
            {start && data && data.steps.at(-1)?.timestamp && ` · ${formatSeconds((Date.parse(data.steps.at(-1)!.timestamp!) - start) / 1000)}`}
          </div>
        </div>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={showReasoning} onChange={() => setShowReasoning((v) => !v)} className="accent-[hsl(var(--primary))]" />
          Reasoning
        </label>
        <CommentButton slug={slug} fieldId={trialField(stored.trial_id)} label={`the transcript of ${label}`} />
        {hubUrl && (
          <a href={hubUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            Hub <ExternalLink size={12} />
          </a>
        )}
        <button onClick={onClose} aria-label="Close transcript" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X size={16} />
        </button>
      </div>

      {!user ? (
        <div className="max-w-sm">
          <NameSignIn prompt="Transcripts are private. What's your name?" />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">Couldn’t load this transcript: {error}</p>
      ) : !data ? (
        <p className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">Loading transcript…</p>
      ) : (
        <ol className="flex flex-col gap-2" {...fieldAttr(slug, trialField(stored.trial_id))}>
          {data.steps.slice(0, limit).map((s) => (
            <Step key={s.step_id} step={s} start={start} showReasoning={showReasoning} />
          ))}
          {data.steps.length > limit && (
            <li data-nb-skip="">
              <button onClick={() => setLimit((l) => l + PAGE)} className="w-full rounded-lg border border-border py-2.5 text-sm text-primary hover:bg-muted/40">
                Show {Math.min(PAGE, data.steps.length - limit)} more of {data.steps.length - limit} remaining steps
              </button>
            </li>
          )}
        </ol>
      )}
    </section>
  )
}

function Step({ step, start, showReasoning }: { step: AtifStep; start: number | null; showReasoning: boolean }) {
  const offset = start && step.timestamp ? formatSeconds((Date.parse(step.timestamp) - start) / 1000) : null
  const results = useMemo(() => new Map((step.observation?.results ?? []).map((r) => [r.source_call_id, r.content])), [step])
  const isUser = step.source === 'user'
  return (
    <li className={`rounded-lg border px-4 py-3 ${isUser ? 'border-primary/40 bg-accent/40' : 'border-border bg-card'}`}>
      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground" data-nb-skip="">
        <span className="tb4-mono">#{step.step_id}</span>
        <span className="font-medium uppercase tracking-wide">{step.source}</span>
        {offset && <span className="tb4-mono">+{offset}</span>}
        {step.metrics?.completion_tokens != null && <span className="tb4-mono ml-auto">{formatTokens(step.metrics.completion_tokens)} out</span>}
      </div>
      {showReasoning && step.reasoning_content && (
        <p className="mb-2 whitespace-pre-wrap border-l-2 border-border pl-3 text-[0.8125rem] italic leading-relaxed text-muted-foreground">{step.reasoning_content}</p>
      )}
      {step.message && <p className="whitespace-pre-wrap text-sm leading-relaxed">{step.message}</p>}
      {step.tool_calls?.map((c) => (
        <div key={c.tool_call_id} className="mt-2 overflow-hidden rounded-md border border-border">
          <div className="tb4-mono border-b border-border bg-muted/50 px-3 py-1 text-[0.72rem] text-muted-foreground" data-nb-skip="">
            {c.function_name}
          </div>
          <pre className="tb4-mono overflow-x-auto whitespace-pre-wrap px-3 py-2 text-[0.75rem] leading-relaxed">{argsText(c.arguments)}</pre>
          {results.has(c.tool_call_id) && <Output content={results.get(c.tool_call_id)} />}
        </div>
      ))}
    </li>
  )
}

function argsText(args: Record<string, unknown>): string {
  if (typeof args?.command === 'string') return args.command
  const text = JSON.stringify(args, null, 2)
  return text.length > 4000 ? `${text.slice(0, 4000)}\n… (${text.length.toLocaleString('en-US')} characters)` : text
}

function Output({ content }: { content: unknown }) {
  const [all, setAll] = useState(false)
  const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  const lines = text.split('\n')
  const long = lines.length > OUTPUT_LINES
  return (
    <div className="border-t border-border bg-muted/25">
      <pre className="tb4-mono max-h-[28rem] overflow-auto whitespace-pre-wrap px-3 py-2 text-[0.72rem] leading-relaxed text-muted-foreground">
        {all || !long ? text : lines.slice(0, OUTPUT_LINES).join('\n')}
      </pre>
      {long && (
        <button data-nb-skip="" onClick={() => setAll((a) => !a)} className="w-full border-t border-border py-1.5 text-xs text-primary hover:bg-muted/40">
          {all ? 'Show less' : `Show all ${lines.length.toLocaleString('en-US')} lines`}
        </button>
      )}
    </div>
  )
}
