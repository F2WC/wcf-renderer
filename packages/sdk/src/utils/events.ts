import { createEventBus } from '@/core/createEventBus.ts'

export const MFE_EVENTS = {
  REGISTERED: 'MFE:REGISTERED',
  BOOTSTRAPPED: 'MFE:BOOTSTRAPPED',
  MOUNTED: 'MFE:MOUNTED',
  UNMOUNTED: 'MFE:UNMOUNTED',
} as const

interface MfeEventPayload {
  id?: string
  name: string
}

type MfeEventMap = Record<(typeof MFE_EVENTS)[keyof typeof MFE_EVENTS], MfeEventPayload>

export const eventBus = createEventBus<MfeEventMap>()
