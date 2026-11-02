'use client'

import { useMemo } from 'react'
import {
  OUTCOMES,
  formatSeconds,
  formatUsd,
  hubTrialUrl,
  outcomeOf,
  outcomeVar,
  useTrials,
  type Outcome,
  type PerTask,
  type TaskStats,
  type TrialsMeta,
} from '../../lib/tb4/data'
import type { StoredTrajectory } from '../../lib/tb4/trajectories'

const pct = (x: number) => `${Math.round(x * 100)}%`

/**
 * Every leaderboard attempt at one task: how they ended (stacked bar), then one
 * row per config with a square per trial, each linking to the trial on the
 * Harbor Hub where its transcript lives.
 */
export function TrialsPanel({
  name,
  per,
  meta,
  stats,
  stored,
  activeTrial,
  onTrial,
}: {
  name: string
  per: PerTask
  meta: TrialsMeta | null
  stats: TaskStats | null
  stored: Map<string, StoredTrajectory> | null
  activeTrial: string | null
  onTrial: (trial: string) => void
}) {
  const { data: rows } = useTrials(name)

  const byConfig = useMemo(() => {
    if (!rows) return []
    const groups = new Map<number, typeof rows>()
    rows.forEach((r) => groups.set(r[0], [...(groups.get(r[0]) ?? []), r]))
    return [...groups.entries()]
      .map(([i, trials]) => ({
        cfg: per.configs[i],
        job: meta?.configs[i]?.job,
        trials,
        passed: trials.filter((t) => outcomeOf(t[2], t[3]) === 'passed').length,
      }))
      .sort((a, b) => b.passed - a.passed || a.cfg.model.localeCompare(b.cfg.model))
  }, [rows, per, meta])

  const total = stats?.trials ?? rows?.length ?? 0
  const outcomes = stats ? OUTCOMES.filter((o) => stats.outcomes[o.id] > 0) : []

  return (
    <section aria-labelledby="tb4-trials" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <h2 id="tb4-trials" className="text-[0.95rem] font-semibold">
          Trials
        </h2>
        {stats && (
          <p className="text-[0.8125rem] text-muted-foreground">
            <span className="tb4-mono text-foreground">
              {stats.passed}/{stats.trials}
            </span>{' '}
            passed · {pct(stats.passed / stats.trials)}{' '}
            <span title="95% Wilson interval">
              (95% CI {pct(stats.solveCi[0])}–{pct(stats.solveCi[1])})
            </span>
          </p>
        )}
      </div>

      {stats && total > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={outcomes.map((o) => `${o.label} ${stats.outcomes[o.id]}`).join(', ')}>
            {outcomes.map((o) => (
              <span key={o.id} style={{ width: `${(stats.outcomes[o.id] / total) * 100}%`, background: outcomeVar(o.id) }} title={`${o.label}: ${stats.outcomes[o.id]}`} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {outcomes.map((o) => (
              <li key={o.id} className="inline-flex items-center gap-1.5" title={o.hint}>
                <span className="h-2 w-2 rounded-sm" style={{ background: outcomeVar(o.id) }} aria-hidden="true" />
                {o.label} <span className="tb4-mono text-foreground">{stats.outcomes[o.id]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!rows ? (
        <p className="text-xs text-muted-foreground">Loading trials…</p>
      ) : (
        <ul className="flex max-h-[30rem] flex-col gap-1.5 overflow-y-auto pr-1">
          {byConfig.map(({ cfg, job, trials, passed }) => (
            <li key={cfg.id} className="flex items-center gap-2">
              {/* Effort leads: several rows share a model and differ only in effort. Agent is in the tooltip. */}
              <span className="min-w-0 flex-1 truncate text-[0.8125rem]" title={[cfg.model, cfg.agent, cfg.effort && `effort ${cfg.effort}`].filter(Boolean).join(' · ')}>
                {cfg.model}
                {cfg.effort && <span className="text-muted-foreground"> {cfg.effort}</span>}
              </span>
              <span className="flex gap-1">
                {trials.map((t, k) => {
                  const o: Outcome = outcomeOf(t[2], t[3])
                  const here = stored?.has(t[1])
                  const label = `${cfg.model} trial ${k + 1}: ${OUTCOMES.find((x) => x.id === o)?.label}${t[3] && o !== 'passed' ? ` (${t[3]})` : ''} · ${formatSeconds(t[8])} · ${formatUsd(t[4])}${here ? ' · transcript stored here' : ''}`
                  return here ? (
                    <button
                      key={t[1]}
                      type="button"
                      onClick={() => onTrial(t[1])}
                      className="tb4-trial tb4-trial-stored"
                      data-active={activeTrial === t[1] || undefined}
                      style={{ background: outcomeVar(o) }}
                      title={label}
                      aria-label={label}
                    />
                  ) : job ? (
                    <a key={t[1]} href={hubTrialUrl(job, t[1])} target="_blank" rel="noreferrer" className="tb4-trial" style={{ background: outcomeVar(o) }} title={label} aria-label={label} />
                  ) : (
                    <span key={t[1]} className="tb4-trial" style={{ background: outcomeVar(o) }} title={label} />
                  )
                })}
              </span>
              <span className="tb4-mono w-7 text-right text-xs text-muted-foreground">{passed}/5</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Each square is one attempt (the latest, if it was retried). Squares with a dot have their transcript stored here; the rest open on the{' '}
        <a href={per.source_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Harbor Hub
        </a>
        . Retrieved {meta?.retrieved_at ?? per.retrieved_at}.
      </p>
    </section>
  )
}
