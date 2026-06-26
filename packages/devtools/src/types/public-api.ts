import type { ComponentProps } from 'web-component-framework-renderer-sdk'

export interface Route {
  path: string
  name: string
  props?: ComponentProps
  beforeEnter?: () => Promise<void>
  afterEnter?: () => Promise<void>
  children?: Route[]
}

export interface MountDevtoolsOptions {
  /** Where to attach the host element. Default: document.body */
  target?: HTMLElement
}
