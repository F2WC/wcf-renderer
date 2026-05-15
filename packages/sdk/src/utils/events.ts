import { createEventBus } from '@/core/createEventBus.ts'

export const MFE_EVENTS = {
  REGISTERED: 'MFE:REGISTERED',
  BOOTSTRAPPED: 'MFE:BOOTSTRAPPED',
  MOUNTED: 'MFE:MOUNTED',
  UPDATED: 'MFE:UPDATED',
  UNMOUNTED: 'MFE:UNMOUNTED',
} as const

export interface PropChange {
  from: unknown
  to: unknown
}

interface MfeEventPayload {
  id?: string
  name: string
  /** Per-key diff. Only present on `MFE:UPDATED`. */
  changed?: Record<string, PropChange>
}

type MfeEventMap = Record<(typeof MFE_EVENTS)[keyof typeof MFE_EVENTS], MfeEventPayload>

export const eventBus = createEventBus<MfeEventMap>()
