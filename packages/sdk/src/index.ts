import { ConsoleWcfLogger } from '@/logger.js'

export type MaybePromise<T> = T | Promise<T>

interface LifecycleFunctions {
  bootstrap?: () => MaybePromise<void>
  mount: () => MaybePromise<void>
  unmount: () => MaybePromise<void>
}

interface ExternalLifecycleFunctions extends Required<LifecycleFunctions> {
  register: () => void
}

interface AppInstance extends ExternalLifecycleFunctions {
  id: string
}

interface Options {
  name: string
  cssURLs?: string[]
  customRootContainer?: HTMLElement
}

interface ComponentAttributes {
  props?: string
  autoMount?: string
}

type ComponentProps = Record<string, unknown>

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
