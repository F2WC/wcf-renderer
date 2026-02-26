import { getLoader } from '@/core/loader.js'
import { wcfLogger } from '@/logger.js'
import { getComponentProps } from '@/utils/props.js'
import type { ComponentAttributes, ExternalLifecycleFunctions } from '@/types/index.js'

export class MfeComponent extends HTMLElement {
  static get observedAttributes() {
    return ['data-mfe-name']
  }

  #lifecycle: ExternalLifecycleFunctions | undefined

  async connectedCallback() {
    await this.loadMfe()
  }

  async disconnectedCallback() {
    await this.#lifecycle?.unmount()
    this.#lifecycle = undefined
  }

  async attributeChangedCallback(name: string, oldValue: string | null, newValue: string) {
    if (name === 'data-mfe-name' && oldValue !== null && oldValue !== newValue) {
      await this.#lifecycle?.unmount()
      this.#lifecycle = undefined
      await this.loadMfe()
    }
  }

  private async loadMfe() {
    const mfeName = this.getAttribute('data-mfe-name')
    if (!mfeName) {
      wcfLogger.warn('MFE name is missing on wcf-mfe')
      return
    }

    const loader = getLoader()
    if (!loader) {
      wcfLogger.error('Loader not set. Call setLoader() before using wcf-mfe.')
      return
    }

    try {
      const mfeLifecycle = await loader({ name: mfeName })

      // Clear previous content
      this.innerHTML = ''

      const rootContainer = document.createElement('div')
      this.appendChild(rootContainer)

      const attributes = this.dataset as ComponentAttributes
      const props = getComponentProps(attributes, wcfLogger, mfeName)

      await mfeLifecycle.bootstrap(rootContainer, props)
      await mfeLifecycle.mount()

      this.#lifecycle = mfeLifecycle
    } catch (error) {
      wcfLogger.error(`Failed to load MFE "${mfeName}": ${String(error)}`)
    }
  }
}

export function registerMfeComponent() {
  if (!customElements.get('wcf-mfe')) {
    customElements.define('wcf-mfe', MfeComponent)
  }
}
