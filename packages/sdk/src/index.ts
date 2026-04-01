import { ConsoleWcfLogger } from '@/logger.js'
import { registerMfeComponent, registerWidgetComponent } from '@/components/wcf-component.js'
import { createStyleElement, createPreloadLink } from '@/utils/dom.js'
import type {
  AppFactory,
  ComponentProps,
  ExternalLifecycleFunctions,
  LifecycleFunctions,
  MfeFactory,
  Options,
} from '@/types/index.js'
import { eventBus, MFE_EVENTS } from '@/utils/events.ts'
import {
  registerApp,
  removeApp,
  setAppStatus,
  getMountedApps,
  getAppStatus,
  getAppNames,
} from '@/core/app-registry.js'

// Register core components
registerWidgetComponent()
registerMfeComponent()

// Re-export types and EventBus for public API
export type {
  MaybePromise,
  ExternalLifecycleFunctions,
  MfeFactory,
  AppStatus,
  AppRegistryEntry,
} from '@/types/index.js'
export { eventBus, MFE_EVENTS }
export { getMountedApps, getAppStatus, getAppNames }

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

  return (): ExternalLifecycleFunctions => {
    const id = crypto.randomUUID()

    let appLifecycle: LifecycleFunctions | undefined
    let loadedStyles: HTMLLinkElement[] = []
    let isBootstrapped = false
    let isMounted = false

    return {
      name: options.name,

      bootstrap: async (rootContainer: HTMLElement, props?: ComponentProps) => {
        if (isBootstrapped) {
          logger.debug(`MFE ${options.name} with id ${id} is already bootstrapped.`)
          return
        }
        logger.debug(`Bootstrapping MFE ${options.name} with id ${id}`)
        registerApp({ id, name: options.name, status: 'registered' })
        eventBus.emit(MFE_EVENTS.REGISTERED, { name: options.name })
        try {
          appLifecycle = appFactory({ rootContainer, props })
          await appLifecycle.bootstrap?.()
        } catch (e) {
          removeApp(id)
          throw e
        }
        isBootstrapped = true
        setAppStatus(id, 'bootstrapped')
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
        options.cssURLs?.forEach((cssUrl) => {
          loadedStyles.push(createStyleElement(cssUrl, id))
          createPreloadLink(cssUrl, id)
        })
        await appLifecycle.mount()
        isMounted = true
        setAppStatus(id, 'mounted')
        eventBus.emit(MFE_EVENTS.MOUNTED, { id, name: options.name })
      },

      unmount: async () => {
        if (!isMounted || !appLifecycle) {
          logger.debug(`MFE ${options.name} with id ${id} is not mounted.`)
          return
        }
        logger.debug(`Unmounting MFE ${options.name} with id ${id}.`)
        await appLifecycle.unmount()
        loadedStyles.forEach((link) => {
          link.remove()
        })
        loadedStyles = []
        isMounted = false
        isBootstrapped = false
        appLifecycle = undefined
        removeApp(id)
        eventBus.emit(MFE_EVENTS.UNMOUNTED, { id, name: options.name })
      },

      update: async (newProps: ComponentProps) => {
        if (!isMounted || !appLifecycle?.update) return
        logger.debug(`Passed new props for MFE ${options.name} with id ${id}`)
        await appLifecycle.update(newProps)
      },
    }
  }
}
