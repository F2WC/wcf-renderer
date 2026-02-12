import { getLoader } from '@/core/loader.js'
import { wcfLogger } from '@/logger.js'

export class WidgetComponent extends HTMLElement {
  static get observedAttributes() {
    return ['data-widget-name']
  }

  async connectedCallback() {
    await this.loadWidget()
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'data-widget-name' && oldValue !== newValue && oldValue !== null) {
      this.loadWidget()
    }
  }

  private async loadWidget() {
    const widgetName = this.getAttribute('data-widget-name')
    if (!widgetName) {
      wcfLogger.warn('Widget name is missing on wcf-widget')
      return
    }

    const loader = getLoader()
    if (!loader) {
      wcfLogger.error('Loader not set. Call setLoader() before using wcf-widget.')
      return
    }

    try {
      const widgetLifecycle = await loader({ name: widgetName })
      widgetLifecycle.register()
      
      // Clear previous content
      this.innerHTML = ''
      
      const element = document.createElement(widgetLifecycle.name)
      // Pass through data attributes to the widget
      for (const attr of this.attributes) {
        if (attr.name.startsWith('data-') && attr.name !== 'data-widget-name') {
          element.setAttribute(attr.name, attr.value)
        }
      }
      this.appendChild(element)
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
