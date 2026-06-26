import { html, nothing, type TemplateResult } from 'lit'
import type { LogEntry } from '@/types/event-log.ts'

export function shortId(id: string): string {
  return id.slice(0, 8)
}

export function formatWallTime(perfNow?: number): string {
  if (perfNow === undefined) return '–'
  const date = new Date(performance.timeOrigin + perfNow)
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

export function formatDuration(startOrMs?: number, end?: number): string {
  if (startOrMs === undefined) return '–'
  if (end === undefined) return `${startOrMs.toFixed(1)}ms`
  return `${(end - startOrMs).toFixed(1)}ms`
}

export function camelToKebab(input: string): string {
  return input.replace(/[A-Z]/g, (match) => '-' + match.toLowerCase())
}

export function previewValue(value: unknown): string {
  if (value === undefined) return '∅'
  if (typeof value === 'string')
    return JSON.stringify(value.length > 24 ? value.slice(0, 24) + '…' : value)
  if (typeof value === 'number' || typeof value === 'boolean' || value === null)
    return JSON.stringify(value)
  try {
    const serialized = JSON.stringify(value) as string | undefined
    return serialized ?? '[unserializable]'
  } catch {
    return '[unserializable]'
  }
}

export function renderEventSummary(entry: LogEntry): TemplateResult | typeof nothing {
  if (entry.type !== 'MFE:UPDATED') return nothing
  const payload = entry.payload as
    | { changed?: Record<string, { from: unknown; to: unknown }> }
    | undefined
  if (!payload?.changed) return nothing
  const changedEntries = Object.entries(payload.changed)
  if (changedEntries.length === 0) return nothing
  return html`<span class="diff">
    ${changedEntries.map(
      ([key, change]) =>
        html`<span class="diff-key">${key}</span>:
          <span class="diff-from">${previewValue(change.from)}</span> →
          <span class="diff-to">${previewValue(change.to)}</span>`,
    )}
  </span>`
}
