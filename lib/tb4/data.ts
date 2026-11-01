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
