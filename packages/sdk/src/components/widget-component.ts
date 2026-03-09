import { wcfLogger } from '@/logger.js'
import { getComponentProps } from '@/utils/props.js'
import type { ComponentAttributes, ExternalLifecycleFunctions } from '@/types/index.js'

export class WidgetComponent extends HTMLElement {
  static get observedAttributes() {
    return ['data-widget-name']
  }

  #lifecycle: ExternalLifecycleFunctions | undefined

  async connectedCallback() {
    await this.loadWidget()
  }

  async disconnectedCallback() {
    await this.#lifecycle?.unmount()
    this.#lifecycle = undefined
  }

  async attributeChangedCallback(name: string, oldValue: string | null, newValue: string) {
    if (name === 'data-widget-name' && oldValue !== null && oldValue !== newValue) {
      await this.#lifecycle?.unmount()
      this.#lifecycle = undefined
      await this.loadWidget()
    }
  }

  private async loadWidget() {
    const widgetName = this.getAttribute('data-widget-name')
    if (!widgetName) {
      wcfLogger.warn('Widget name is missing on wcf-widget')
      return
    }

    try {
      const widgetLifecycle = (await import(/* @vite-ignore */ widgetName)) as ExternalLifecycleFunctions

      // Clear previous content
      this.innerHTML = ''

      const rootContainer = document.createElement('div')
      // Pass through data attributes to the widget
      for (const attr of this.attributes) {
        if (attr.name.startsWith('data-') && attr.name !== 'data-widget-name') {
          rootContainer.setAttribute(attr.name, attr.value)
        }
      }
      this.appendChild(rootContainer)

      const attributes = this.dataset as ComponentAttributes
      const props = getComponentProps(attributes, wcfLogger, widgetName)

      await widgetLifecycle.bootstrap(rootContainer, props)
      await widgetLifecycle.mount()

      this.#lifecycle = widgetLifecycle
    } catch (error) {
      wcfLogger.error(`Failed to load widget "${widgetName}": ${String(error)}`)
    }
  }
}

export function registerWidgetComponent() {
  if (!customElements.get('wcf-widget')) {
    customElements.define('wcf-widget', WidgetComponent)
  }
}
