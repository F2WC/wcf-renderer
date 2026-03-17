import { wcfLogger } from '@/logger.js'
import { getComponentProps } from '@/utils/props.js'
import type { ExternalLifecycleFunctions, MfeFactory } from '@/types/index.js'

function createWcfComponentClass(attributeName: string) {
  return class WcfComponent extends HTMLElement {
    static get observedAttributes() {
      return [attributeName]
    }

    #lifecycle: ExternalLifecycleFunctions | undefined
    #observer: MutationObserver | undefined

    async connectedCallback() {
      this.#observer = new MutationObserver((mutations) => {
        const propChanged = mutations.some((m) => m.attributeName?.startsWith('data-prop-'))
        if (!propChanged) return
        const props = getComponentProps(this) ?? {}

        if (this.#lifecycle?.update) {
          void this.#lifecycle.update(props)
        } else {
          wcfLogger.debug(
            'You need to implement update method in lifecycle to dynamically update props',
          )
        }
      })
      this.#observer.observe(this, { attributes: true })
      await this.#load()
    }

    async disconnectedCallback() {
      this.#observer?.disconnect()
      this.#observer = undefined
      await this.#lifecycle?.unmount()
      this.#lifecycle = undefined
    }

    async attributeChangedCallback(name: string, oldValue: string | null, newValue: string) {
      if (name === attributeName && oldValue !== null && oldValue !== newValue) {
        await this.#lifecycle?.unmount()
        this.#lifecycle = undefined
        await this.#load()
      }
    }

    async #load() {
      const moduleName = this.getAttribute(attributeName)
      if (!moduleName) {
        wcfLogger.warn(`${attributeName} is missing`)
        return
      }

      try {
        const module = (await import(/* @vite-ignore */ moduleName)) as { default: MfeFactory }
        const lifecycle = module.default()

        this.innerHTML = ''
        const rootContainer = document.createElement('div')

        for (const attr of this.attributes) {
          if (attr.name.startsWith('data-') && attr.name !== attributeName) {
            rootContainer.setAttribute(attr.name, attr.value)
          }
        }

        this.appendChild(rootContainer)

        const props = getComponentProps(this)
        await lifecycle.bootstrap(rootContainer, props)
        await lifecycle.mount()

        this.#lifecycle = lifecycle
      } catch (error) {
        wcfLogger.error(`Failed to load "${moduleName}": ${String(error)}`)
      }
    }
  }
}

export function registerMfeComponent() {
  if (!customElements.get('wcf-mfe')) {
    customElements.define('wcf-mfe', createWcfComponentClass('data-mfe-name'))
  }
}

export function registerWidgetComponent() {
  if (!customElements.get('wcf-widget')) {
    customElements.define('wcf-widget', createWcfComponentClass('data-widget-name'))
  }
}
