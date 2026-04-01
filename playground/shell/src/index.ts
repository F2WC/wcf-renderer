import { getMountedApps, getAppStatus, getAppNames } from 'web-component-framework-renderer-sdk'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).__wcf = { getMountedApps, getAppStatus, getAppNames }
