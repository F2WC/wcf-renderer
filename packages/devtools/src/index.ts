import { defineDevtoolsElement, DEVTOOLS_TAG } from './panel.ts'
import type { Route, MountDevtoolsOptions } from './types/public-api.ts'

export { installImportmapHook } from './importmap-hook.ts'
export type { Route, MountDevtoolsOptions } from './types/public-api.ts'

declare global {
  interface Window {
    __WCF_DEVTOOLS?: boolean
    __WCF_DEVTOOLS_ROUTES?: Route[]
  }
}

export const isDevtools: () => boolean = () => window.__WCF_DEVTOOLS ?? false

export const getRoutes: () => Route[] = () => window.__WCF_DEVTOOLS_ROUTES ?? []

export const setRoutes = (routes: Route[]) => {
  window.__WCF_DEVTOOLS_ROUTES = routes
}

/**
 * Mounts the WCF devtools panel into the page. Idempotent: a second call
 * while an instance is still attached returns an unmount handle for it.
 */
export function mountDevtools(options: MountDevtoolsOptions = {}): () => void {
  window.__WCF_DEVTOOLS = true
  defineDevtoolsElement()

  const target = options.target ?? document.body
  const existing = target.querySelector(DEVTOOLS_TAG)
  if (existing) {
    return () => {
      existing.remove()
    }
  }

  const el = document.createElement(DEVTOOLS_TAG)
  target.appendChild(el)
  return () => {
    el.remove()
  }
}
