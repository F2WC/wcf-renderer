import { registerMfeComponent, registerWidgetComponent } from 'web-component-framework-renderer-sdk'

export interface InitializeOptions {
  /** URL of the importmap. Defaults to `/importmap.json`. */
  importmapUrl?: string
  /**
   * Optional transform applied to the raw importmap JSON text after fetching
   * and before injection. Used by tooling (e.g. the devtools package) to
   * rewrite specifiers without coupling the shell to the tool itself.
   */
  transformImportmap?: (raw: string) => string | Promise<string>
}

/**
 * Boots the App Shell: fetches the importmap that the `publisher` package
 * produces (today: a hand-edited static file) and injects it into the
 * document so subsequent dynamic `import('@mf/...')` calls resolve.
 *
 * Must be awaited before any code that triggers an MFE load runs — i.e.
 * before the SDK module is imported (its module-load side effect registers
 * the `<wcf-mfe>` custom element, which calls `import(mfeName)` on upgrade).
 */
export async function initialize(options: InitializeOptions = {}): Promise<void> {
  const url = options.importmapUrl ?? '/importmap.json'
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to load importmap from ${url}: ${String(res.status)}`)
  }
  let importmap = await res.text()

  if (options.transformImportmap) {
    importmap = await options.transformImportmap(importmap)
  }

  const tag = document.createElement('script')
  tag.type = 'importmap'
  tag.textContent = importmap
  document.head.appendChild(tag)

  registerMfeComponent()
  registerWidgetComponent()
}
