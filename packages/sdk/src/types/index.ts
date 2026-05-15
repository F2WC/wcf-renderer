/**
 * Utility type representing a value that may be returned synchronously or as a Promise.
 *
 * @template T The resolved value type.
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Represents the lifecycle functions for a component or application.
 * These functions handle the specific stages of the lifecycle,
 * including setup, initialization, and teardown processes.
 */
export interface LifecycleFunctions {
  bootstrap?: () => MaybePromise<void>
  mount: () => MaybePromise<void>
  unmount: () => MaybePromise<void>
  update?: (newProps: ComponentProps) => MaybePromise<void>
}

/**
 * The public lifecycle API returned by `createMfe`.
 *
 * Sequence: `bootstrap(rootContainer, props)` → `mount()` → `unmount()`
 *
 * `id` uniquely identifies this lifecycle instance and is stamped on the
 * host `<wcf-mfe>` / `<wcf-widget>` element as `data-wcf-id` so external
 * tooling can resolve a registry entry back to its DOM node.
 */
export interface ExternalLifecycleFunctions {
  id: string
  name: string
  bootstrap: (rootContainer: HTMLElement, props?: ComponentProps) => Promise<void>
  mount: () => Promise<void>
  unmount: () => Promise<void>
  update?: (newProps: ComponentProps) => Promise<void>
}

/**
 * Configuration passed by the MFE to describe its custom element and behavior.
 */
export interface Options {
  name: string
  cssURLs?: string[]
}

/**
 * HTML attribute contract supported by the custom element.
 */
export interface ComponentAttributes {
  mfeName?: string
}

/**
 * Generic props bag passed from the AppShell to the MFE.
 */
export type ComponentProps = Record<string, unknown>

/**
 * Options provided by the AppShell when instantiating the MFE via `appFactory`.
 */
export interface CreateMfeOptions {
  rootContainer: HTMLElement
  props?: Record<string, unknown>
}

/**
 * A factory function, provided by the MFE, that creates and returns a fresh
 * instance of its application.
 */
export type AppFactory = (options: CreateMfeOptions) => LifecycleFunctions

/**
 * Options accepted by an MFE's default-exported factory.
 *
 * @property id Optional stable identifier to assign to the new lifecycle
 *  instance. Used by the host element to preserve identity across
 *  unmount/remount cycles. If omitted, the factory generates a fresh UUID.
 */
export interface MfeFactoryOptions {
  id?: string
}

/**
 * The default export of an MFE module.
 */
export type MfeFactory = (options?: MfeFactoryOptions) => ExternalLifecycleFunctions

/**
 * The lifecycle status of a registered MFE instance.
 */
export type AppStatus = 'registered' | 'bootstrapped' | 'mounted'

/**
 * Captures the most recent error raised by a lifecycle transition for an instance.
 */
export interface AppRegistryError {
  phase: 'bootstrap' | 'mount' | 'unmount'
  message: string
  stack?: string
  at: number
}

/**
 * A snapshot of a single MFE instance tracked in the application registry.
 *
 * Timing fields use `performance.now()` and may be undefined until the
 * corresponding transition has completed.
 */
export interface AppRegistryEntry {
  id: string
  name: string
  status: AppStatus
  registeredAt: number
  bootstrappedAt?: number
  mountedAt?: number
  unmountedAt?: number
  supportsUpdate: boolean
  lastError?: AppRegistryError
}

/**
 * Represents a mapping of event names to their corresponding data types.
 */
export type EventMap = Record<string, unknown>

/**
 * A type representing a listener function for handling custom events.
 */
export type Listener<E> = (evt: CustomEvent<E>) => void
