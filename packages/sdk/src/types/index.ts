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
 *
 * @interface LifecycleFunctions
 *
 * @property {() => MaybePromise<void>} [bootstrap]
 *    An optional function that runs before the component or application
 *    is mounted. Typically used for setup processes such as initializing
 *    configurations or services.
 *
 * @property {() => MaybePromise<void>} mount
 *    A required function that runs when the component or application
 *    is ready to be loaded. Handles the initialization and rendering.
 *
 * @property {() => MaybePromise<void>} unmount
 *    A required function that runs when the component or application
 *    is being removed or destroyed. Handles cleanup operations, such
 *    as freeing resources or detaching event listeners.
 */
export interface LifecycleFunctions {
  bootstrap?: () => MaybePromise<void>
  mount: () => MaybePromise<void>
  unmount: () => MaybePromise<void>
}

/**
 * The public lifecycle API returned by `createMfe`.
 *
 * Sequence: `bootstrap(rootContainer, props)` → `mount()` → `unmount()`
 *
 * - `bootstrap` sets up the app instance and runs any pre-mount initialization.
 * - `mount` renders the app into the container provided to `bootstrap`.
 * - `unmount` tears down the app and cleans up resources.
 */
export interface ExternalLifecycleFunctions {
  name: string
  bootstrap: (rootContainer: HTMLElement, props?: ComponentProps) => Promise<void>
  mount: () => Promise<void>
  unmount: () => Promise<void>
}

/**
 * Configuration passed by the MFE to describe its custom element and behavior.
 *
 * @property name The custom element tag name to register (e.g. `mfe-counter`).
 * @property cssURLs Optional list of CSS files to preload and attach while mounted.
 */
export interface Options {
  name: string
  cssURLs?: string[]
}

/**
 * HTML attribute contract supported by the custom element.
 * These are read from `HTMLElement.dataset` on the component instance.
 *
 * @property props A JSON string of props to pass to the MFE on mount.
 * @property autoMount If present (any value), the component will automatically bootstrap and mount when connected.
 * @property mfeName The name/identifier of the MFE to load dynamically (used by wcf-mfe).
 */
export interface ComponentAttributes {
  props?: string
  autoMount?: string
  mfeName?: string
}

/**
 * Generic props bag passed from the AppShell to the MFE.
 */
export type ComponentProps = Record<string, unknown>

/**
 * Options provided by the AppShell when instantiating the MFE via `appFactory`.
 *
 * @property rootContainer The element the MFE should render into.
 * @property props Optional initial props passed to the MFE on bootstrap/mount.
 */
export interface CreateMfeOptions {
  rootContainer: HTMLElement
  props?: Record<string, unknown>
}

/**
 * A factory function, provided by the MFE, that creates and returns a fresh
 * instance of its application. It can receive props from the AppShell.
 */
export type AppFactory = (options: CreateMfeOptions) => LifecycleFunctions

/**
 * A function that loads an MFE or widget by name and returns its lifecycle functions.
 */
export type LoadApp = ({ name }: { name: string }) => Promise<ExternalLifecycleFunctions>

/**
 * Represents a mapping of event names to their corresponding data types.
 * This type definition is commonly used to define the structure of events and their associated payloads
 * for strongly-typed event handling systems.
 *
 * Each key in the `EventMap` represents the name of an event as a string,
 * and the associated value represents the type of data that the event carries.
 */
export type EventMap = Record<string, unknown>

/**
 * A type representing a listener function for handling custom events.
 *
 * @template E - The type of data carried by the custom event.
 * @param {CustomEvent<E>} evt - The custom event object containing event details and payload.
 */
export type Listener<E> = (evt: CustomEvent<E>) => void
