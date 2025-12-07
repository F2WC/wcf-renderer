import { ConsoleWcfLogger } from '@/logger.js'

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
interface LifecycleFunctions {
  bootstrap?: () => MaybePromise<void>
  mount: () => MaybePromise<void>
  unmount: () => MaybePromise<void>
}

/**
 * The public lifecycle API returned by `createMfe` for registration and orchestration.
 * Extends `LifecycleFunctions` but makes all lifecycle methods required and adds `register`.
 */
interface ExternalLifecycleFunctions extends Required<LifecycleFunctions> {
  register: () => void
}

/**
 * Internal representation of a running MFE instance tracked by the SDK.
 * Includes the full external lifecycle API plus a unique `id`.
 */
interface AppInstance extends ExternalLifecycleFunctions {
  id: string
}

/**
 * Configuration passed by the MFE to describe its custom element and behavior.
 *
 * @property name The custom element tag name to register (e.g. `mfe-counter`).
 * @property cssURLs Optional list of CSS files to preload and attach while mounted.
 * @property customRootContainer Optional root element where the MFE should render; defaults to the root of the custom element.
 */
interface Options {
  name: string
  cssURLs?: string[]
  customRootContainer?: HTMLElement
}

/**
 * HTML attribute contract supported by the custom element.
 * These are read from `HTMLElement.dataset` on the component instance.
 *
 * @property props A JSON string of props to pass to the MFE on mount.
 * @property autoMount If present (any value), the component will automatically bootstrap and mount when connected.
 */
interface ComponentAttributes {
  props?: string
  autoMount?: string
}

/**
 * Generic props bag passed from the AppShell to the MFE.
 */
type ComponentProps = Record<string, unknown>

/**
 * Options provided by the AppShell when instantiating the MFE via `appFactory`.
 *
 * @property rootContainer The element the MFE should render into.
 * @property props Optional initial props passed to the MFE on bootstrap/mount.
 */
interface CreateMfeOptions {
  rootContainer: HTMLElement
  props?: Record<string, unknown>
}

/**
 * A factory function, provided by the MFE, that creates and returns a fresh
 * instance of its application. It can receive props from the AppShell.
 */
type AppFactory = (options: CreateMfeOptions) => LifecycleFunctions

/**
 * Creates a class for a self-contained web component for a micro-frontend.
 * This class can then be exported by the MFE and registered by the AppShell.
 *
 * @param appFactory A function that returns a new instance of the MFE's application.
 * @param options
 * @returns An HTMLElement class that can be registered with `customElements.define()`.
 */
export default function createMfe(
  appFactory: AppFactory,
  options: Options,
): ExternalLifecycleFunctions {
  const logger = new ConsoleWcfLogger()
  // Track lifecycle functions per element instance so multiple components can mount independently
  const lifecycleMap = new WeakMap<Element, Required<LifecycleFunctions>>()

  const _createCustomElement = () => {
    if (customElements.get(options.name)) {
      logger.debug(
        `MFE custom element "${options.name}" already defined skipping custom element registration.`,
      )
      return
    }
    const cssList = options.cssURLs?.join(', ') ?? ''
    logger.debug(
      `Registering MFE with name "${options.name}"` + (cssList ? ` and CSS URLs: ${cssList}` : ''),
    )
    customElements.define(options.name, MfeComponent)
  }

  const _createStyleElement = (cssUrl: string, id: string) => {
    const styleAlreadyExists = document.head.querySelector(
      `link[href="${cssUrl}"][rel="stylesheet"]`,
    )
    if (styleAlreadyExists) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssUrl
    link.setAttribute(`data-wcf-${id}`, '')
    document.head.appendChild(link)
  }

  const _deleteStyleElements = (id: string) => {
    const links = document.querySelectorAll(`link[data-wcf-${id}][rel="stylesheet"]`)
    links.forEach((link) => {
      link.remove()
    })
  }

  const _createPreloadLink = (cssUrl: string, id: string) => {
    const preloadAlreadyExists = document.head.querySelector(
      `link[href="${cssUrl}"][rel="preload"]`,
    )
    if (preloadAlreadyExists) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = cssUrl
    link.as = 'style'
    link.setAttribute(`data-wcf-${id}`, '')
    document.head.appendChild(link)
  }

  const _executeOnCustomElements = async (callback: (el: Element) => MaybePromise<void>) => {
    const nodes = document.querySelectorAll(options.name)
    if (!nodes.length) throw new Error(`No custom elements found with tag name "${options.name}"`)
    for (const el of nodes) {
      await callback(el)
    }
  }

  const _getComponentProps = (dataset: ComponentAttributes) => {
    if (dataset.props) {
      try {
        return JSON.parse(dataset.props) as ComponentProps
      } catch (e) {
        logger.warn(`Failed to parse props for MFE ${options.name}: ${String(e)}`)
      }
    }
  }

  class MfeComponent extends HTMLElement {
    #appInstance: AppInstance = {
      id: crypto.randomUUID(),
      register: () => {
        /* empty */
      },
      bootstrap: () => {
        /* empty */
      },
      mount: () => {
        /* empty */
      },
      unmount: () => {
        /* empty */
      },
    }
    #isBootstrapped = false
    #isMounted = false
    #rootContainer: HTMLElement = document.createElement('div')
    #attributes = this.dataset as ComponentAttributes

    async connectedCallback() {
      if (options.customRootContainer) {
        this.#rootContainer = options.customRootContainer.cloneNode() as HTMLElement
      }

      const bootstrap = async () => {
        logger.debug(`Bootstrapping MFE ${options.name} with id ${this.#appInstance.id}`)

        this.#appInstance = {
          ...this.#appInstance,
          ...appFactory({
            rootContainer: this.#rootContainer,
            props: _getComponentProps(this.#attributes),
          }),
        }

        this.appendChild(this.#rootContainer)
        await this.#appInstance.bootstrap()
        this.#isBootstrapped = true
      }

      const mount = async () => {
        if (!this.#isBootstrapped) {
          logger.debug(
            `MFE ${options.name} with id ${this.#appInstance.id} is not bootstrapped yet.`,
          )
          return
        }
        if (this.#isMounted) {
          logger.debug(`MFE ${options.name} with id ${this.#appInstance.id} is already mounted.`)
          return
        }
        logger.debug(`Mounting MFE ${options.name} with id ${this.#appInstance.id}`)

        options.cssURLs?.forEach((cssUrl) => {
          _createStyleElement(cssUrl, this.#appInstance.id)
          _createPreloadLink(cssUrl, this.#appInstance.id)
        })

        await this.#appInstance.mount()
        this.#isMounted = true
      }

      const unmount = async () => {
        if (!this.#isMounted) {
          logger.debug(`MFE ${options.name} is not mounted.`)
          return
        }
        logger.debug(`Unmounting MFE ${options.name} with id ${this.#appInstance.id}.`)
        await this.#appInstance.unmount()

        options.cssURLs?.forEach(() => {
          _deleteStyleElements(this.#appInstance.id)
        })
        this.removeChild(this.#rootContainer)
        this.#isMounted = false
        this.#isBootstrapped = false
      }

      lifecycleMap.set(this, { mount, unmount, bootstrap })

      if (this.#attributes.autoMount) {
        await bootstrap()
        await mount()
      }
    }

    async disconnectedCallback() {
      await lifecycleMap.get(this)?.unmount()
    }
  }

  return {
    register: _createCustomElement,
    bootstrap: async () => {
      if (!options.name) {
        logger.error('MFE name is missing.')
        return
      }

      try {
        _createCustomElement()
        await _executeOnCustomElements(async (el) => {
          await lifecycleMap.get(el)?.bootstrap()
        })
      } catch {
        logger.debug(`No custom elements found for MFE ${options.name} to bootstrap`)
      }
    },
    mount: async () => {
      if (!options.name) {
        logger.error('MFE name is missing.')
        return
      }
      // Mount all current instances that are not mounted yet
      try {
        await _executeOnCustomElements(async (el) => {
          await lifecycleMap.get(el)?.mount()
        })
      } catch {
        logger.debug(`No custom elements found for MFE ${options.name} to mount`)
      }
    },
    unmount: async () => {
      if (!options.name) {
        logger.error('MFE name is missing.')
        return
      }
      // Unmount all current instances of this custom element on the page
      try {
        await _executeOnCustomElements(async (el) => {
          await lifecycleMap.get(el)?.unmount()
        })
      } catch {
        logger.debug(`No custom elements found for MFE ${options.name} to unmount`)
      }
    },
  }
}
