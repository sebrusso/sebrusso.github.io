import type { Author, Person } from './types'

export const PEOPLE: Record<Author, { name: string; short: string }> = {
  seb: { name: 'Seb', short: 'Seb' },
  daniel: { name: 'Daniel Fein', short: 'Daniel' },
  ai: { name: 'AI', short: 'AI' },
}

// Login is name-only by decision (see the design doc): the name picks the
// account. Normalize so "  Daniel   FEIN " still matches.
const ALIASES: Record<string, Person> = {
  seb: 'seb',
  daniel: 'daniel',
  'daniel fein': 'daniel',
}

export function personFromName(input: string): Person | null {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ')
  return ALIASES[normalized] ?? null
}
