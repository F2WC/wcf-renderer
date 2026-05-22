export const STORAGE_KEYS = {
  enable: 'wcf:devtools',
  overrides: 'wcf:devtools:importmap-overrides',
  ui: 'wcf:devtools:ui',
} as const

export type ImportmapOverrides = Record<string, string>

export interface UiState {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  collapsed: boolean
  panel: 'apps' | 'timeline' | 'dom-tree' | 'events' | 'overrides'
}

const DEFAULT_UI: UiState = {
  position: 'bottom-right',
  collapsed: true,
  panel: 'apps',
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return fallback
    return { ...fallback, ...(parsed as Partial<T>) }
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / unavailable — ignore */
  }
}

function isStringRecord(value: unknown): value is ImportmapOverrides {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.entries(value).every(
    ([key, entry]) => typeof key === 'string' && typeof entry === 'string',
  )
}

export function getOverrides(): ImportmapOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.overrides)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!isStringRecord(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

export function setOverrides(overrides: ImportmapOverrides): void {
  writeJSON(STORAGE_KEYS.overrides, overrides)
}

export function getUiState(): UiState {
  return readJSON<UiState>(STORAGE_KEYS.ui, DEFAULT_UI)
}

export function setUiState(state: UiState): void {
  writeJSON(STORAGE_KEYS.ui, state)
}

export function resetAll(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key)
  }
}
