/**
 * Date helpers for the plain 'YYYY-MM-DD' strings stored in due_date, next_date,
 * last_meeting and meeting note dates.
 *
 * `new Date('2026-07-30')` parses as *UTC* midnight, so in any timezone behind
 * UTC it represents the previous evening. That made tasks due today compare as
 * overdue and render a day early. Always parse these values as local midnight
 * and compare against local midnight today.
 */

/** Parses a stored date string as local midnight. */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return new Date(value)
  return new Date(year, month - 1, day)
}

/** Local midnight today, optionally offset by a number of days. */
export function startOfDay(offsetDays = 0): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (offsetDays) d.setDate(d.getDate() + offsetDays)
  return d
}

/** True when the date is strictly before today. A date falling today is not overdue. */
export function isOverdue(value: string | null | undefined): boolean {
  if (!value) return false
  return parseDateOnly(value) < startOfDay()
}

/** True when the date falls between today and `days` days from now, inclusive. */
export function isDueWithin(value: string | null | undefined, days: number): boolean {
  if (!value) return false
  const due = parseDateOnly(value)
  return due >= startOfDay() && due <= startOfDay(days)
}

/** e.g. "Jul 30" */
export function formatShortDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** e.g. "Jul 30, 2026" */
export function formatMediumDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** e.g. "July 30, 2026" */
export function formatLongDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** e.g. "Thu, July 30, 2026" */
export function formatWeekdayDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
