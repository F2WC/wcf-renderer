export interface InitializeOptions {
  /** URL of the importmap. Defaults to `/importmap.json`. */
  importmapUrl?: string
}

/**
 * Boots the App Shell: fetches the importmap that the `publisher` package
 * produces (today: a hand-edited static file) and injects it into the
 * document so subsequent dynamic `import('@mf/...')` calls resolve.
 *
 * Must be awaited before any code that triggers an MFE load runs — i.e.
 * before the SDK module is imported (its module-load side effect registers
 * the `<wcf-mfe>` custom element, which calls `import(mfeName)` on upgrade).
 *
 * Typical usage:
 * ```ts
 * // bootstrap.ts — the HTML's single <script type="module"> entry
 * import { initialize } from 'web-component-framework-renderer-shell'
 * await initialize()
 * await import('./index.ts') // user's shell code
 * ```
 */
export async function initialize(options: InitializeOptions = {}): Promise<void> {
  const url = options.importmapUrl ?? '/importmap.json'
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to load importmap from ${url}: ${res.status}`)
  }
  const importmap = await res.text()

  const tag = document.createElement('script')
  tag.type = 'importmap'
  tag.textContent = importmap
  document.head.appendChild(tag)
}
