import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

export interface WcfReactOptions {
  /**
   * Path to the MFE's entry file containing the React/JSX code. Resolved
   * relative to the Vite project root. Defaults to the value of
   * `build.lib.entry` if set, otherwise `src/entry.jsx`.
   */
  entry?: string
}

/**
 * Cross-origin React MFE dev glue.
 *
 * `@vitejs/plugin-react` injects its Fast Refresh preamble into the MFE's
 * own `index.html`. When the MFE is loaded into an App Shell on a different
 * origin via an importmap, the host page has no such injection — the first
 * JSX-transformed module evaluated throws
 * `@vitejs/plugin-react can't detect preamble. Something is wrong.`
 *
 * This plugin solves it by, in dev only, replacing the entry module's source
 * with a non-JSX wrapper that:
 *   1. Installs the React Refresh preamble globals on `window`.
 *   2. Dynamically imports the real entry (with a query suffix so this
 *      plugin's transform passes through on the second pass).
 *
 * It enforces `pre` ordering so it runs before `@vitejs/plugin-react`, which
 * means the React plugin sees the wrapper (no JSX, no preamble check added)
 * and only injects its preamble check into the inner load — by which point
 * the preamble is installed.
 *
 * Production builds skip the wrapper entirely (`apply: 'serve'`).
 */
const INNER_QUERY = 'wcf_react_inner'

export default function wcfReact(options: WcfReactOptions = {}): Plugin {
  let entryAbsPath: string | null = null
  let viteBase = '/'

  return {
    name: 'wcf-react',
    apply: 'serve',
    enforce: 'pre',
    configResolved(config: ResolvedConfig) {
      const libEntry =
        typeof config.build.lib === 'object' && !Array.isArray(config.build.lib.entry)
          ? (config.build.lib.entry as string | undefined)
          : undefined
      const entryOpt = options.entry ?? libEntry ?? 'src/entry.jsx'
      entryAbsPath = path.isAbsolute(entryOpt)
        ? entryOpt
        : path.resolve(config.root, entryOpt)
      viteBase = config.base
    },
    transform(_code, id) {
      if (!entryAbsPath) return null
      const [filePath, query] = id.split('?')
      if (filePath !== entryAbsPath) return null
      if (query && query.includes(INNER_QUERY)) return null

      const refreshUrl = `${viteBase.replace(/\/$/, '')}/@react-refresh`
      const innerSpecifier = `./${path.basename(filePath)}?${INNER_QUERY}`

      return {
        code: `\
if (!window.__vite_plugin_react_preamble_installed__) {
  const RefreshRuntime = await import(${JSON.stringify(refreshUrl)})
  RefreshRuntime.default.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
}
const __wcf_mod = await import(${JSON.stringify(innerSpecifier)})
export default __wcf_mod.default
`,
        map: null,
      }
    },
  }
}
