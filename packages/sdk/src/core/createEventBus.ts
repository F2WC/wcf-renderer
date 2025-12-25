import type { EventMap, Listener } from '@/types/index.ts'

export function createEventBus<EM extends EventMap>() {
  const emit = <K extends keyof EM & string>(
    type: K,
    detail: EM[K],
    options?: { bubbles?: boolean; composed?: boolean; cancelable?: boolean },
  ) => {
    const evt = new CustomEvent(type, {
      detail,
      bubbles: options?.bubbles ?? true,
      composed: options?.composed ?? true,
      cancelable: options?.cancelable ?? false,
    })
    window.dispatchEvent(evt)
  }

  const on = <K extends keyof EM & string>(
    type: K,
    listener: Listener<EM[K]>,
    options?: AddEventListenerOptions,
  ) => {
    window.addEventListener(type, listener as EventListener, options)
  }

  const off = <K extends keyof EM & string>(
    type: K,
    listener: Listener<EM[K]>,
    options?: EventListenerOptions,
  ) => {
    window.removeEventListener(type, listener as EventListener, options)
  }

  return { emit, on, off }
}
