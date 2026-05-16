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
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) }
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

export function getOverrides(): ImportmapOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.overrides)
    if (!raw) return {}
    return JSON.parse(raw) as ImportmapOverrides
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
