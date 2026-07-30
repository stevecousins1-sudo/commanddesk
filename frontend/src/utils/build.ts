/**
 * Build identity.
 *
 * The build number is the UTC date and time the bundle was compiled, injected by
 * Vite's `define` (see vite.config.ts). It is a constant in the shipped bundle —
 * deliberately not `new Date()` at runtime, which would show the viewer's clock
 * and tell you nothing about which build is deployed.
 *
 * UTC is rendered explicitly because builds run on the deploy host, not locally.
 */

const rawBuildTime = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : ''

function formatBuildNumber(value: string): string {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return 'dev'
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    ` ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
  )
}

/** Full ISO timestamp of the build, for tooltips. */
export const BUILD_TIMESTAMP = rawBuildTime

/** e.g. "2026-07-30 01:42 UTC", or "dev" when served without a build step. */
export const BUILD_NUMBER = formatBuildNumber(rawBuildTime)
