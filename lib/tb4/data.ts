'use client'

import { useEffect, useState } from 'react'

// Shapes written by scripts/tb4/build_data.py into public/tb4-data/.

export interface TaskSummary {
  name: string
  category: string
  subcategory: string
  tags: string[]
  authors: string[]
  expertHours: number
  instructionWords: number
  tests: number
  gpus: number
  cpus?: number
  memoryMb?: number
  agentTimeoutSec?: number
  verifierTimeoutSec?: number
  fileCount: number
}

export interface TaskFile {
  path: string
  size: number
  section: 'instruction.md' | 'task.toml' | 'environment' | 'tests' | 'solution' | 'other'
  kind: 'text' | 'data' | 'binary'
  content?: string
}

export interface TaskDetail extends TaskSummary {
  instruction: string
  files: TaskFile[]
}

export interface Index {
  tag: string
  commit: string
  repo: string
  tasks: TaskSummary[]
}

/** Optional per-task results (public/tb4-data/pertask.json), absent until sourced. */
export interface PerTask {
  source: string
  source_url: string
  retrieved_at: string
  notes: string
  configs: { id: string; model: string; agent?: string; effort?: string; lab?: string; accuracy?: number; hub_row_id?: string }[]
  results: Record<string, Record<string, { passed: number; trials: number }>>
}

const BASE = '/tb4-data'

// Comment anchors: one item per task instruction and per task file.
export const taskSlug = (name: string) => `tb4:${name}`
export const fileField = (path: string) => `file:${path}`
/** Instruction Markdown without the canary comment, as rendered. */
export const stripCanary = (md: string) => md.replace(/<!--[\s\S]*?-->/g, '')

function useJson<T>(url: string | null): { data: T | null; error: boolean } {
  const [state, setState] = useState<{ data: T | null; error: boolean }>({ data: null, error: false })
  useEffect(() => {
    if (!url) return
    let live = true
    setState({ data: null, error: false })
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: T) => live && setState({ data, error: false }))
      .catch(() => live && setState({ data: null, error: true }))
    return () => {
      live = false
    }
  }, [url])
  return state
}

export const useIndex = () => useJson<Index>(`${BASE}/index.json`)
export const useTask = (name: string | null) => useJson<TaskDetail>(name ? `${BASE}/tasks/${name}.json` : null)
export const usePerTask = () => useJson<PerTask>(`${BASE}/pertask.json`)

export const CATEGORIES = ['Software', 'Science', 'ML', 'Operations', 'Hardware', 'Security', 'Media'] as const

export const catVar = (category: string) => `var(--tb4-cat-${category.toLowerCase()}, var(--tb4-cat-other))`

export function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace(/\.0$/, '')} h`
}

export function formatDuration(sec?: number): string {
  if (!sec) return '—'
  if (sec >= 3600) return formatHours(sec / 3600)
  return `${Math.round(sec / 60)} min`
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export const BUCKETS = [
  { id: 'lt1', label: 'Under 1 h', test: (h: number) => h < 1 },
  { id: '1to4', label: '1–4 h', test: (h: number) => h >= 1 && h <= 4 },
  { id: '4to10', label: '4–10 h', test: (h: number) => h > 4 && h <= 10 },
  { id: 'gt10', label: 'Over 10 h', test: (h: number) => h > 10 },
] as const

/** Share of trials passed across every config, or null without data. */
export function solveRate(per: PerTask | null, task: string): number | null {
  const row = per?.results[task]
  if (!row) return null
  let passed = 0
  let trials = 0
  for (const r of Object.values(row)) {
    passed += r.passed
    trials += r.trials
  }
  return trials ? passed / trials : null
}

// ── Per-trial metadata and derived statistics (fetch_trials.py, analyze.py) ──

export type Outcome = 'passed' | 'tests_failed' | 'timeout' | 'token_limit' | 'refusal' | 'crash' | 'infra'

export const OUTCOMES: { id: Outcome; label: string; hint: string }[] = [
  { id: 'passed', label: 'Passed', hint: 'The verifier gave full reward.' },
  { id: 'tests_failed', label: 'Tests failed', hint: 'The agent finished, but the verifier rejected the result.' },
  { id: 'timeout', label: 'Out of time', hint: 'The agent hit the task’s time limit.' },
  { id: 'token_limit', label: 'Token limit', hint: 'The model ran out of output tokens or context window.' },
  { id: 'refusal', label: 'Refused', hint: 'The model declined the task on safety grounds.' },
  { id: 'crash', label: 'Agent crashed', hint: 'The agent process exited with an error.' },
  { id: 'infra', label: 'Infra error', hint: 'API, network, setup or verifier failure, not the model’s doing.' },
]

const ERROR_OUTCOME: Record<string, Outcome> = {
  AgentTimeoutError: 'timeout',
  OutputTokenExceededError: 'token_limit',
  ContextWindowExceededError: 'token_limit',
  AgentSafetyRefusalError: 'refusal',
  NonZeroAgentExitCodeError: 'crash',
  ValueError: 'crash',
}

/** Same grouping as scripts/tb4/analyze.py: a full reward counts as passed whatever else was logged. */
export function outcomeOf(reward: number | null, error: string | null): Outcome {
  if ((reward ?? 0) >= 1) return 'passed'
  if (!error) return 'tests_failed'
  return ERROR_OUTCOME[error] ?? 'infra'
}

export const outcomeVar = (o: Outcome) => `var(--tb4-out-${o})`

export interface TaskStats {
  passed: number
  trials: number
  solveCi: [number, number]
  difficulty: number
  discrimination: number
  abilityCorr: number | null
  suspect: boolean
  mixedShare: number
  outcomes: Record<Outcome, number>
  medianCostUsd: number | null
  medianSeconds: number | null
  medianOutputTokens: number | null
}

export interface Analysis {
  configs: Record<string, { ability: number }>
  suspectBelow: number
  tasks: Record<string, TaskStats>
}

export interface TrialsMeta {
  source: string
  retrieved_at: string
  columns: string[]
  configs: { id: string; job: string; trials: number }[]
}

/** [config index, trial id, reward, error type, cost USD, input, output, cache tokens, seconds, attempts] */
export type TrialRow = [number, string, number | null, string | null, number | null, number | null, number | null, number | null, number | null, number]

export const useAnalysis = () => useJson<Analysis>(`${BASE}/analysis.json`)
export const useTrialsMeta = () => useJson<TrialsMeta>(`${BASE}/trials-meta.json`)
export const useTrials = (name: string | null) => useJson<TrialRow[]>(name ? `${BASE}/trials/${name}.json` : null)

export const hubTrialUrl = (job: string, trial: string) => `https://hub.harborframework.com/jobs/${job}/trials/${trial}`

export function formatUsd(v: number | null | undefined): string {
  if (v == null) return '—'
  return v < 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(v < 10 ? 2 : 1)}`
}

export function formatSeconds(s: number | null | undefined): string {
  if (s == null) return '—'
  if (s < 90) return `${Math.round(s)} s`
  if (s < 5400) return `${Math.round(s / 60)} min`
  return `${(s / 3600).toFixed(1)} h`
}

export function formatTokens(n: number | null | undefined): string {
  if (n == null) return '—'
  return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n)
}
