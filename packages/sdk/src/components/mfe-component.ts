import type { ConsoleWcfLogger } from '@/logger.js'
import { createPreloadLink, createStyleElement } from '@/utils/dom.js'
import type {
  AppFactory,
  AppInstance,
  ComponentAttributes,
  LifecycleFunctions,
  Options,
} from '@/types/index.js'
import { getComponentProps } from '@/utils/props.js'
import {noop, noopAsync} from "@/utils/noop.ts";

/**
 * Creates a custom element class for the MFE.
 * This class manages the lifecycle of individual MFE instances in the DOM.
 *
 * @param appFactory The factory function that creates MFE instances
 * @param options MFE configuration options
 * @param lifecycleMap WeakMap to store lifecycle functions per element
 * @param logger Logger instance for debug messages
 * @returns A custom HTMLElement class
 */
export function createMfeComponentClass(
  appFactory: AppFactory,
  options: Options,
  lifecycleMap: WeakMap<Element, Required<LifecycleFunctions>>,
  logger: ConsoleWcfLogger,
): typeof HTMLElement {
  return class MfeComponent extends HTMLElement {
    #appInstance: AppInstance = {
      id: crypto.randomUUID(),
      register: noop,
      bootstrap: noopAsync,
      mount: noopAsync,
      unmount: noopAsync,
    }
    #isBootstrapped = false
    #isMounted = false
    #rootContainer: HTMLElement = document.createElement('div')
    #attributes = this.dataset as ComponentAttributes
    #loadedStyles: HTMLLinkElement[] = []

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
            props: getComponentProps(this.#attributes, logger, options.name),
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
          const styleLink = createStyleElement(cssUrl, this.#appInstance.id)
          createPreloadLink(cssUrl, this.#appInstance.id)
          this.#loadedStyles.push(styleLink)
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
        this.#loadedStyles.forEach((link) => { link.remove(); })
        this.#loadedStyles = []
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
}
