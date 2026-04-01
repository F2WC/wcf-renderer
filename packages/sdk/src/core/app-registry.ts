import type { AppRegistryEntry, AppStatus } from '@/types/index.js'

const REGISTRY_KEY = '__wcf_registry__'

type RegistryWindow = Window & {
  [REGISTRY_KEY]?: Map<string, AppRegistryEntry>
}

function getRegistry(): Map<string, AppRegistryEntry> {
  const win = window as RegistryWindow
  if (!(win[REGISTRY_KEY] instanceof Map)) {
    win[REGISTRY_KEY] = new Map<string, AppRegistryEntry>()
  }
  return win[REGISTRY_KEY]
}

export function registerApp(entry: AppRegistryEntry): void {
  getRegistry().set(entry.id, entry)
}

export function setAppStatus(id: string, status: AppStatus): void {
  const entry = getRegistry().get(id)
  if (entry) entry.status = status
}

export function removeApp(id: string): void {
  getRegistry().delete(id)
}

export function getMountedApps(): AppRegistryEntry[] {
  return [...getRegistry().values()].filter((e) => e.status === 'mounted')
}

export function getAppStatus(id: string): AppStatus | undefined {
  return getRegistry().get(id)?.status
}

export function getAppNames(): string[] {
  return [...new Set([...getRegistry().values()].map((e) => e.name))]
}
