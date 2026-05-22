import type { AppRegistryEntry, WcfHostElement } from 'web-component-framework-renderer-sdk'

export interface DomEntry {
  element: WcfHostElement
  specifier: string
  wcfDepth: number
  wcfParent: WcfHostElement | undefined
  instance: AppRegistryEntry | undefined
}
