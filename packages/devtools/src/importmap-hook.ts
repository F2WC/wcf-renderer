import { getOverrides } from './storage.ts'

interface Importmap {
  imports?: Record<string, string>
  scopes?: Record<string, Record<string, string>>
}

let baseImports: Record<string, string> = {}

/**
 * The set of `imports` from the importmap as originally fetched by the shell,
 * before any devtools overrides were merged in. Captured by the transform
 * returned from `installImportmapHook()` the first time it runs. Returns an
 * empty record if the hook hasn't run yet.
 */
export function getBaseImports(): Record<string, string> {
  return { ...baseImports }
}

/**
 * Returns a transform suitable for the shell's `initialize({ transformImportmap })`
 * hook. Captures the raw importmap as the base snapshot for later inspection,
 * then merges the user's persisted overrides into the `imports` map; overrides
 * win on collision. If JSON parsing fails, the original text is returned
 * unchanged.
 */
export function installImportmapHook(): (raw: string) => string {
  return (raw: string): string => {
    let parsed: Importmap
    try {
      parsed = JSON.parse(raw) as Importmap
    } catch {
      console.warn('[wcf-devtools] could not parse importmap; skipping overrides')
      return raw
    }

    baseImports = { ...(parsed.imports ?? {}) }

    const overrides = getOverrides()
    if (Object.keys(overrides).length === 0) return raw

    parsed.imports = { ...baseImports, ...overrides }
    return JSON.stringify(parsed)
  }
}
