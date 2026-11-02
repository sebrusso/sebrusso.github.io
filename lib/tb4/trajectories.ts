'use client'

import { useEffect, useState } from 'react'
import type { Person } from '../notebook/types'
import { download, rest } from '../supabase/client'

// Private copies of Harbor Hub transcripts (scripts/tb4/fetch_trajectories.py),
// readable only by signed-in members.

export const TRAJECTORY_BUCKET = 'tb4-trajectories'

export interface StoredTrajectory {
  trial_id: string
  config_id: string
  outcome: string
  object_path: string
  size_bytes: number
  steps: number | null
}

/** ATIF (Agent Trajectory Interchange Format), as much as the viewer reads. */
export interface AtifStep {
  step_id: number
  timestamp?: string
  source: 'user' | 'agent' | 'system' | string
  model_name?: string
  message?: string
  reasoning_content?: string
  tool_calls?: { tool_call_id: string; function_name: string; arguments: Record<string, unknown> }[]
  observation?: { results?: { source_call_id?: string; content?: unknown }[] }
  metrics?: { prompt_tokens?: number; completion_tokens?: number; cost_usd?: number }
}

export interface Atif {
  schema_version?: string
  agent?: { name?: string; version?: string; model_name?: string }
  steps: AtifStep[]
  final_metrics?: { total_prompt_tokens?: number; total_completion_tokens?: number; total_cost_usd?: number; total_steps?: number }
}

/** Which of a task's trials have a stored transcript, keyed by trial id. */
export function useStoredTrajectories(user: Person | null, task: string) {
  const [stored, setStored] = useState<Map<string, StoredTrajectory> | null>(null)
  useEffect(() => {
    if (!user) {
      setStored(null)
      return
    }
    let live = true
    rest<StoredTrajectory[]>(user, `tb4_trajectories?select=trial_id,config_id,outcome,object_path,size_bytes,steps&task=eq.${encodeURIComponent(task)}`)
      .then((rows) => live && setStored(new Map(rows.map((r) => [r.trial_id, r]))))
      .catch(() => live && setStored(new Map()))
    return () => {
      live = false
    }
  }, [user, task])
  return stored
}

export function useTrajectory(user: Person | null, path: string | null) {
  const [state, setState] = useState<{ data: Atif | null; error: string | null }>({ data: null, error: null })
  useEffect(() => {
    if (!user || !path) return
    let live = true
    setState({ data: null, error: null })
    ;(async () => {
      const r = await download(user, TRAJECTORY_BUCKET, path)
      // Stored gzipped; unzip in the browser.
      const stream = r.body!.pipeThrough(new DecompressionStream('gzip'))
      const text = await new Response(stream).text()
      return JSON.parse(text) as Atif
    })()
      .then((data) => live && setState({ data, error: null }))
      .catch((e: Error) => live && setState({ data: null, error: e.message }))
    return () => {
      live = false
    }
  }, [user, path])
  return state
}
