const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Formats a post date as "March 20, 2025".
 *
 * Deliberately not `toLocaleDateString()`: this is a static export, so that
 * would render the build machine's locale into the HTML and then the visitor's
 * locale on hydration — a mismatch, and a different string than the one the
 * essays use in their own sign-off line.
 *
 * Parsed by hand rather than through `new Date(string)` so a bare `YYYY-MM-DD`
 * is read as a calendar date instead of UTC midnight, which shifts a day back
 * for anyone west of Greenwich.
 */
export function formatPostDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim())
  if (match) {
    const [, year, month, day] = match
    return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`
  }

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return `${MONTHS[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`
}
