import { defineDevtoolsElement, DEVTOOLS_TAG } from './panel.ts'

export { installImportmapHook } from './importmap-hook.ts'

export interface MountDevtoolsOptions {
  /** Where to attach the host element. Default: document.body */
  target?: HTMLElement
}

/**
 * Mounts the WCF devtools panel into the page. Idempotent: a second call
 * while an instance is still attached returns an unmount handle for it.
 */
export function mountDevtools(options: MountDevtoolsOptions = {}): () => void {
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
