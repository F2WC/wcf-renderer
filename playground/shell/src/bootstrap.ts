import { initialize } from 'web-component-framework-renderer-shell'

const devtoolsEnabled =
  import.meta.env.DEV || localStorage.getItem('wcf:devtools') === '1'

const devtools = devtoolsEnabled
  ? await import('web-component-framework-renderer-devtools')
  : null

await initialize({ transformImportmap: devtools?.installImportmapHook() })

await import('./index.ts')

devtools?.mountDevtools()
