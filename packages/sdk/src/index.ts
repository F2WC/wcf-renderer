import { ConsoleWcfLogger } from '@/logger.js'

/**
 * A generic interface for a micro-frontend application instance from any framework.
 * It must have `mount` and `unmount` methods.
 */
interface FrameworkApplication {
  bootstrap?(): void
  mount(): void
  unmount(): void
}

interface AppInstance extends FrameworkApplication {
  id: string;
}

interface LifecycleFunctions {
  bootstrap: () => void
  mount: () => void
  unmount: () => void
}

interface Options {
  name: string
  cssURLs?: string[],
  customRootContainer?: HTMLElement
}

interface ComponentAttributes {
  props?: string
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
type AppFactory<T extends FrameworkApplication> = (options: CreateMfeOptions) => T

/**
 * Creates a class for a self-contained web component for a micro-frontend.
 * This class can then be exported by the MFE and registered by the AppShell.
 *
 * @param appFactory A function that returns a new instance of the MFE's application.
 * @param options
 * @returns An HTMLElement class that can be registered with `customElements.define()`.
 */
export default function createMfe<T extends FrameworkApplication>(
  appFactory: AppFactory<T>,
  options: Options,
) {
  const logger = new ConsoleWcfLogger()
  // Track lifecycle functions per element instance so multiple components can mount independently
  const lifecycleMap = new WeakMap<Element, LifecycleFunctions>()

  const _createCustomElement = () => {
    if (customElements.get(options.name)) {
      logger.debug(`MFE custom element "${options.name}" already defined.`)
      return
    }
    const cssList = options.cssURLs?.join(', ') ?? ''
    logger.debug(
      `Registering MFE with name "${options.name}"` + (cssList ? ` and CSS URLs: ${cssList}` : ''),
    )
    customElements.define(options.name, MfeComponent)
  }

  const _createStyleElement = (cssUrl: string, id: string) => {
    const styleAlreadyExists = document.head.querySelector(`link[href="${cssUrl}"]`)
    if(styleAlreadyExists) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssUrl
    link.setAttribute(`data-wcf-${id}`, '')
    document.head.appendChild(link)
  }

  const _deleteStyleElements = (id: string) => {
    const links = document.querySelectorAll(`link[data-wcf-${id}][rel="stylesheet"]`)
    links.forEach(link => link.remove())
  }

  const _createPreloadLink = (cssUrl: string, id: string) => {
    const preloadAlreadyExists = document.head.querySelector(`link[href="${cssUrl}"][rel="preload"]`)
    if(preloadAlreadyExists) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = cssUrl
    link.as = 'style'
    link.setAttribute(`data-wcf-${id}`, '')
    document.head.appendChild(link)
  }

  const _executeOnCustomElements = (callback: (el: Element) => void) => {
    const nodes = document.querySelectorAll(options.name)
    nodes.forEach(callback)
  }

  const _getComponentProps = (el: HTMLElement) => {
    const dataset = el.dataset as ComponentAttributes
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
      bootstrap: () => {},
      mount: () => {},
      unmount: () => {},
    }
    #isMounted = false
    #rootContainer: HTMLElement = document.createElement('div')

    connectedCallback() {
      if(options.customRootContainer) {
        this.#rootContainer = options.customRootContainer.cloneNode() as HTMLElement
      }

      const bootstrap = () => {
        logger.debug(`Bootstrapping MFE ${options.name} with id ${this.#appInstance.id}`)

        this.#appInstance = {
          ...this.#appInstance,
          ...appFactory({
            rootContainer: this.#rootContainer,
            props: _getComponentProps(this),
          })
        }

        options.cssURLs?.forEach((cssUrl) => {
          _createStyleElement(cssUrl, this.#appInstance.id)
          _createPreloadLink(cssUrl, this.#appInstance.id)
        })

        this.appendChild(this.#rootContainer)
        // TODO: Make MaybePromise
        this.#appInstance.bootstrap?.()
      }

      const mount = () => {
        if (this.#isMounted) {
          logger.debug(`MFE ${options.name} with id ${this.#appInstance.id} is already mounted.`)
          return
        }
        logger.debug(`Mounting MFE ${options.name} with id ${this.#appInstance.id}`)
        // TODO: Make MaybePromise
        this.#appInstance.mount()
        this.#isMounted = true
      }

      const unmount = () => {
        if (!this.#isMounted) {
          logger.debug(`MFE ${options.name} is not mounted.`)
          return
        }
        logger.debug(`Unmounting MFE ${options.name} with id ${this.#appInstance.id}.`)
        options.cssURLs?.forEach(() => {
          _deleteStyleElements(this.#appInstance.id)
        })
        // TODO: Make MaybePromise
        this.#appInstance.unmount()
        this.#isMounted = false
      }

      lifecycleMap.set(this, { mount, unmount, bootstrap })
      bootstrap()
      mount()
    }

    disconnectedCallback() {
      lifecycleMap.get(this)?.unmount()
    }
  }

  return {
    bootstrap: _createCustomElement,
    mount: () => {
      if (!options.name) {
        logger.error('MFE name is missing.')
        return
      }
      // Mount all current instances that are not mounted yet
      _executeOnCustomElements((el) => {
        lifecycleMap.get(el)?.mount()
      })
    },
    unmount: () => {
      if (!options.name) {
        logger.error('MFE name is missing.')
        return
      }
      // Unmount all current instances of this custom element on the page
      _executeOnCustomElements((el) => {
        lifecycleMap.get(el)?.unmount()
      })
    },
  }
}
