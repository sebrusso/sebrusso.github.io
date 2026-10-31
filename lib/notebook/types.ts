// Shapes shared by the notebook UI and its data store. The mock store keeps
// these in localStorage; the Supabase store (milestone 2) maps the same shapes
// onto the tables in the design doc.

export type Author = 'ai' | 'seb' | 'daniel'
export type Person = Exclude<Author, 'ai'>
export type Confidence = 'Confirmed' | 'Reported' | 'Inferred'
export type FillMode = 'ai' | 'human'
export type AnswerType = 'bool' | 'enum' | 'multi' | 'int' | 'number' | 'percent' | 'date' | 'name' | 'short'

export interface HistoryEntry {
  value: string
  notes: string
  author: Author
  at: string
}

export interface FieldRow {
  id: string
  key: string
  section: string
  label: string
  type: AnswerType
  options?: string[]
  unit?: string
  format?: string
  /** What the collapsed notes should hold (template guidance). */
  notesGuide: string
  fill: FillMode
  position: number
  /** The short answer, formatted per `type`. */
  value: string
  /** Longer Markdown detail, collapsed by default. */
  notes: string
  sources: string[]
  confidence?: Confidence
  author?: Author
  updatedAt?: string
  checkedBy?: Person | null
  origin: 'template' | 'custom'
  deletedAt?: string | null
  history: HistoryEntry[]
}

export interface ModelResult {
  model: string
  lab: string
  score: number
  costPerTask: number | null
  scaffold?: string
  reportedOn?: string
  sourceUrl?: string
}

export interface EvalSummary {
  released?: string
  tasks?: number
  repos?: number
  sotaModel?: string
  sotaScore?: number
  sotaDate?: string
}

export interface EvalEntry {
  slug: string
  name: string
  createdAt: string
  createdBy: Author
  fields: FieldRow[]
  results: ModelResult[]
  summary: EvalSummary
  costUnit?: string
}

export interface Comment {
  id: string
  slug: string
  fieldId: string
  /** null for a thread's first comment. */
  parentId: string | null
  /** The highlighted words the thread is about, if any. */
  quote: string | null
  body: string
  author: Person
  createdAt: string
  resolvedAt: string | null
}

export interface TemplateField {
  key: string
  from?: string
  label: string
  type: AnswerType
  options?: string[]
  unit?: string
  format?: string
  notes: string
  fill: FillMode
}

export interface TemplateSection {
  id: string
  title: string
  fields: TemplateField[]
}
