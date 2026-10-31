import template from './template.json'
import type { AnswerType, Confidence, EvalEntry, FieldRow, ModelResult, TemplateSection } from './types'

export const TEMPLATE_SECTIONS = template.sections as TemplateSection[]
export const TEMPLATE_VERSION = template.version

// The criteria the compare page and the side-by-side table open with.
export const TOP_CRITERIA = [
  'publisher',
  'released',
  'tasktype',
  'taskcount',
  'grader',
  'evalset',
  'sota_score',
  'monthly',
  'contam',
  'signal',
]

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // Names with no ASCII letters or digits still need an addressable slug.
  return slug || 'eval'
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// A new eval starts with every template field, empty and unattributed.
export function evalFromTemplate(name: string, createdBy: EvalEntry['createdBy']): EvalEntry {
  const fields: FieldRow[] = []
  TEMPLATE_SECTIONS.forEach((section) =>
    section.fields.forEach((f, i) =>
      fields.push({
        id: newId(),
        key: f.key,
        section: section.id,
        label: f.label,
        type: f.type,
        options: f.options,
        unit: f.unit,
        format: f.format,
        notesGuide: f.notes,
        fill: f.fill,
        position: i,
        value: '',
        notes: '',
        sources: [],
        origin: 'template',
        history: [],
      })
    )
  )
  return {
    slug: slugify(name),
    name,
    createdAt: new Date().toISOString(),
    createdBy,
    fields,
    results: [],
    summary: {},
  }
}

// Shape the research agents write (snake_case, mirrors the Supabase columns).
export interface RawFixture {
  slug: string
  name: string
  researched_at: string
  fields: Record<string, { answer: string; notes?: string; sources: string[]; confidence: Confidence }>
  model_results: {
    model: string
    lab: string
    score: number
    cost_per_task_usd: number | null
    scaffold?: string
    reported_on?: string
    source_url?: string
  }[]
  summary?: {
    released?: string
    tasks?: number | null
    repos?: number | null
    sota_model?: string
    sota_score?: number
    sota_date?: string
  }
  cost_unit?: string
}

export function evalFromFixture(raw: RawFixture): EvalEntry {
  const entry = evalFromTemplate(raw.name, 'ai')
  entry.slug = raw.slug
  entry.createdAt = `${raw.researched_at}T09:00:00Z`
  const at = entry.createdAt
  entry.fields = entry.fields.map((f) => {
    const filled = raw.fields[f.key]
    if (!filled || f.fill !== 'ai') return f
    const notes = filled.notes ?? ''
    return {
      ...f,
      value: filled.answer,
      notes,
      sources: filled.sources ?? [],
      confidence: filled.confidence,
      author: 'ai',
      updatedAt: at,
      history: [{ value: filled.answer, notes, author: 'ai', at }],
    }
  })
  entry.results = raw.model_results.map(
    (r): ModelResult => ({
      model: r.model,
      lab: r.lab,
      score: r.score,
      costPerTask: r.cost_per_task_usd,
      scaffold: r.scaffold,
      reportedOn: r.reported_on,
      sourceUrl: r.source_url,
    })
  )
  const s = raw.summary ?? {}
  entry.summary = {
    released: s.released,
    tasks: s.tasks ?? undefined,
    repos: s.repos ?? undefined,
    sotaModel: s.sota_model,
    sotaScore: s.sota_score,
    sotaDate: s.sota_date,
  }
  entry.costUnit = raw.cost_unit
  return entry
}

// Answer validation for the typed editors. Returns an error message or null.
export function checkAnswer(type: AnswerType, value: string, options?: string[]): string | null {
  const v = value.trim()
  if (!v) return null
  switch (type) {
    case 'bool':
      return ['Yes', 'No', 'Unknown'].includes(v) ? null : 'Pick Yes, No or Unknown.'
    case 'enum':
      return !options || options.includes(v) ? null : 'Pick one of the options.'
    case 'int':
      return /^\d+$/.test(v) ? null : 'Use a whole number, e.g. 89.'
    case 'number':
      return /^-?\d+(\.\d+)?$/.test(v) ? null : 'Use a number, e.g. 3.5.'
    case 'percent':
      return /^\d+(\.\d+)?$/.test(v) && Number(v) <= 100 ? null : 'Use a number from 0 to 100, without %.'
    case 'date':
      return /^\d{4}-\d{2}(-\d{2})?$/.test(v) ? null : 'Use YYYY-MM or YYYY-MM-DD.'
    default:
      return null
  }
}
