import { wcfLogger } from '@/logger.js'
import { getComponentProps } from '@/utils/props.js'
import type { ExternalLifecycleFunctions, MfeFactory } from '@/types/index.js'

/**
 * Public contract of the host custom elements (`<wcf-mfe>` / `<wcf-widget>`)
 * beyond the standard `HTMLElement` API. Exposed so external tooling (devtools)
 * can drive the lifecycle without removing the element from the DOM.
 */
export interface WcfHostElement extends HTMLElement {
  mountLifecycle(): Promise<void>
  unmountLifecycle(): Promise<void>
}

function createWcfComponentClass(attributeName: string) {
  return class WcfComponent extends HTMLElement implements WcfHostElement {
    static get observedAttributes() {
      return [attributeName]
    }

    #lifecycle: ExternalLifecycleFunctions | undefined
    #observer: MutationObserver | undefined

    async connectedCallback() {
      this.#observer = new MutationObserver((mutations) => {
        const propChanged = mutations.some((mutation) =>
          mutation.attributeName?.startsWith('data-prop-'),
        )
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
      await this.mountLifecycle()
    }

    async disconnectedCallback() {
      this.#observer?.disconnect()
      this.#observer = undefined
      await this.unmountLifecycle()
    }

    async attributeChangedCallback(name: string, oldValue: string | null, newValue: string) {
      if (name === attributeName && oldValue !== null && oldValue !== newValue) {
        await this.unmountLifecycle()
        await this.mountLifecycle()
      }
    }

    /**
     * Loads, bootstraps and mounts the MFE module referenced by this element's
     * name attribute. Idempotent while a lifecycle is already active.
     */
    async mountLifecycle(): Promise<void> {
      if (this.#lifecycle) return

      const moduleName = this.getAttribute(attributeName)
      if (!moduleName) {
        wcfLogger.warn(`${attributeName} is missing`)
        return
      }

      try {
        const module = (await import(/* @vite-ignore */ moduleName)) as { default: MfeFactory }
        const existingId = this.getAttribute('data-wcf-id') ?? undefined
        const lifecycle = module.default({ id: existingId })
        this.setAttribute('data-wcf-id', lifecycle.id)

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

    /**
     * Tears down the active lifecycle (if any) without removing the element
     * from the DOM. The `data-wcf-id` attribute is intentionally preserved so
     * that a subsequent `mountLifecycle()` call on the same element reuses
     * the same identifier — the element keeps its identity across
     * unmount/remount cycles.
     *
     * `innerHTML` is cleared only after the user's unmount returns, so
     * framework teardown (Vue's `app.unmount`, React's `root.unmount`) can
     * still see its root container.
     */
    async unmountLifecycle(): Promise<void> {
      if (!this.#lifecycle) return
      const lifecycle = this.#lifecycle
      this.#lifecycle = undefined
      try {
        await lifecycle.unmount()
      } finally {
        this.innerHTML = ''
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
