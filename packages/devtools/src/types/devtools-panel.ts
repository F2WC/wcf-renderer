import type { MFE_EVENTS } from 'web-component-framework-renderer-sdk'

export type MFEEventName = (typeof MFE_EVENTS)[keyof typeof MFE_EVENTS]

export interface MFEEventListener {
  type: MFEEventName
  listener: (event: Event) => void
}
