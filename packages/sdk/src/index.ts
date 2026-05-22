import { ConsoleWcfLogger } from '@/logger.js'
import { registerMfeComponent, registerWidgetComponent } from '@/components/wcf-component.js'
import { createStyleElement, createPreloadLink } from '@/utils/dom.js'
import type {
  AppFactory,
  ComponentProps,
  ExternalLifecycleFunctions,
  LifecycleFunctions,
  MfeFactory,
  MfeFactoryOptions,
  Options,
} from '@/types/index.js'
import { eventBus, MFE_EVENTS } from '@/utils/events.ts'
import {
  registerApp,
  removeApp,
  setAppStatus,
  setAppError,
  setAppSupportsUpdate,
  markAppUnmounted,
  getMountedApps,
  getAllApps,
  getAppStatus,
  getAppNames,
} from '@/core/app-registry.js'

// Component registration is intentionally NOT a side effect of importing the
// SDK. The App Shell calls these inside `initialize()` after the importmap is
// injected; MFE bundles that import `createMfe` should not register the host
// elements they get mounted into.
export { registerMfeComponent, registerWidgetComponent }

// Re-export types and EventBus for public API
export type {
  MaybePromise,
  ExternalLifecycleFunctions,
  MfeFactory,
  MfeFactoryOptions,
  AppStatus,
  AppRegistryEntry,
  AppRegistryError,
} from '@/types/index.js'
export type { WcfHostElement } from '@/components/wcf-component.js'
export { eventBus, MFE_EVENTS }
export { getMountedApps, getAllApps, getAppStatus, getAppNames }

function describeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: error.message, stack: error.stack }
  return { message: String(error) }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasSeenPair(seen: WeakMap<object, WeakSet<object>>, left: object, right: object): boolean {
  return seen.get(left)?.has(right) ?? false
}

function markSeenPair(seen: WeakMap<object, WeakSet<object>>, left: object, right: object): void {
  let seenRights = seen.get(left)
  if (!seenRights) {
    seenRights = new WeakSet<object>()
    seen.set(left, seenRights)
  }
  seenRights.add(right)

  let seenLefts = seen.get(right)
  if (!seenLefts) {
    seenLefts = new WeakSet<object>()
    seen.set(right, seenLefts)
  }
  seenLefts.add(left)
}

function deepEqual(a: unknown, b: unknown, seen = new WeakMap<object, WeakSet<object>>()): boolean {
  if (Object.is(a, b)) return true

  if (Array.isArray(a) && Array.isArray(b)) {
    if (hasSeenPair(seen, a, b)) return true
    markSeenPair(seen, a, b)
    if (a.length !== b.length) return false
    return a.every((entry, index) => deepEqual(entry, b[index], seen))
  }

  if (isObject(a) && isObject(b)) {
    if (hasSeenPair(seen, a, b)) return true
    markSeenPair(seen, a, b)
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) => key in b && deepEqual(a[key], b[key], seen))
  }

  return false
}

function snapshotValue(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (Array.isArray(value)) {
    const existing = seen.get(value)
    if (existing) return existing
    const snapshot: unknown[] = []
    seen.set(value, snapshot)
    for (const entry of value) {
      snapshot.push(snapshotValue(entry, seen))
    }
    return snapshot
  }
  if (!isObject(value)) return value
  const existing = seen.get(value)
  if (existing) return existing
  const snapshot: Record<string, unknown> = {}
  seen.set(value, snapshot)
  for (const [key, entry] of Object.entries(value)) {
    snapshot[key] = snapshotValue(entry, seen)
  }
  return snapshot
}

function diffProps(
  previous: ComponentProps,
  next: ComponentProps,
): Record<string, { from: unknown; to: unknown }> {
  const changed: Record<string, { from: unknown; to: unknown }> = {}
  const allKeys = new Set([...Object.keys(previous), ...Object.keys(next)])
  for (const key of allKeys) {
    if (!deepEqual(previous[key], next[key])) changed[key] = { from: previous[key], to: next[key] }
  }
  return changed
}

/**
 * Creates a self-contained lifecycle API for a micro-frontend.
 *
 * Usage sequence:
 * 1. `bootstrap(rootContainer, props)` — initialise the app, run pre-mount setup
 * 2. `mount()` — render the app into the container
 * 3. `unmount()` — tear down the app and clean up resources
 *
 * Use `<wcf-mfe data-mfe-name="...">` or `<wcf-widget data-widget-name="...">` to mount declaratively.
 *
 * @param appFactory A function that creates a new instance of the MFE's application.
 * @param options MFE configuration options (name, cssURLs, etc.)
 */
export default function createMfe(appFactory: AppFactory, options: Options): MfeFactory {
  const logger = new ConsoleWcfLogger()

  return (factoryOptions?: MfeFactoryOptions): ExternalLifecycleFunctions => {
    const id = factoryOptions?.id ?? crypto.randomUUID()

    let appLifecycle: LifecycleFunctions | undefined
    let loadedStyles: HTMLLinkElement[] = []
    let isBootstrapped = false
    let isMounted = false
    let lastProps: ComponentProps = {}

    return {
      id,
      name: options.name,

      bootstrap: async (rootContainer: HTMLElement, props?: ComponentProps) => {
        if (isBootstrapped) {
          logger.debug(`MFE ${options.name} with id ${id} is already bootstrapped.`)
          return
        }
        logger.debug(`Bootstrapping MFE ${options.name} with id ${id}`)
        registerApp({
          id,
          name: options.name,
          status: 'registered',
          registeredAt: performance.now(),
          supportsUpdate: false,
        })
        eventBus.emit(MFE_EVENTS.REGISTERED, { id, name: options.name })
        try {
          appLifecycle = appFactory({ rootContainer, props })
          lastProps = snapshotValue(props ?? {}) as ComponentProps
          await appLifecycle.bootstrap?.()
        } catch (error) {
          setAppError(id, { phase: 'bootstrap', ...describeError(error), at: performance.now() })
          removeApp(id)
          throw error
        }
        isBootstrapped = true
        setAppSupportsUpdate(id, Boolean(appLifecycle.update))
        setAppStatus(id, 'bootstrapped', performance.now())
        eventBus.emit(MFE_EVENTS.BOOTSTRAPPED, { id, name: options.name })
      },

      mount: async () => {
        if (!isBootstrapped || !appLifecycle) {
          logger.debug(`MFE ${options.name} with id ${id} is not bootstrapped yet.`)
          return
        }
        if (isMounted) {
          logger.debug(`MFE ${options.name} with id ${id} is already mounted.`)
          return
        }
        logger.debug(`Mounting MFE ${options.name} with id ${id}`)
        const addedStyles: HTMLLinkElement[] = []
        options.cssURLs?.forEach((cssUrl) => {
          addedStyles.push(createStyleElement(cssUrl, id))
          createPreloadLink(cssUrl, id)
        })
        try {
          await appLifecycle.mount()
        } catch (error) {
          setAppError(id, { phase: 'mount', ...describeError(error), at: performance.now() })
          addedStyles.forEach((link) => {
            link.remove()
          })
          throw error
        }
        loadedStyles = addedStyles
        isMounted = true
        setAppStatus(id, 'mounted', performance.now())
        eventBus.emit(MFE_EVENTS.MOUNTED, { id, name: options.name })
      },

      unmount: async () => {
        if (!isMounted || !appLifecycle) {
          logger.debug(`MFE ${options.name} with id ${id} is not mounted.`)
          return
        }
        logger.debug(`Unmounting MFE ${options.name} with id ${id}.`)
        try {
          await appLifecycle.unmount()
        } catch (error) {
          setAppError(id, { phase: 'unmount', ...describeError(error), at: performance.now() })
          throw error
        } finally {
          loadedStyles.forEach((link) => {
            link.remove()
          })
          loadedStyles = []
          isMounted = false
          isBootstrapped = false
          appLifecycle = undefined
          markAppUnmounted(id, performance.now())
          removeApp(id)
          eventBus.emit(MFE_EVENTS.UNMOUNTED, { id, name: options.name })
        }
      },

      update: async (newProps: ComponentProps) => {
        if (!isMounted || !appLifecycle?.update) return
        logger.debug(`Passed new props for MFE ${options.name} with id ${id}`)
        const changed = diffProps(lastProps, newProps)
        await appLifecycle.update(newProps)
        lastProps = snapshotValue(newProps) as ComponentProps
        if (Object.keys(changed).length > 0) {
          eventBus.emit(MFE_EVENTS.UPDATED, { id, name: options.name, changed })
        }
      },
    }
  }
}
