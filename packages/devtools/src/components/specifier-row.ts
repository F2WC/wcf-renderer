import { LitElement, html, css } from 'lit'
import { AppRegistryEntry, WcfHostElement } from 'web-component-framework-renderer-sdk'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'
import './instance-card.ts'

class SpecifierRow extends LitElement {
  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
      }

      .row {
        background: var(--dt-bg-row);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-sm);
        margin-bottom: var(--dt-space-2);
      }

      .row-head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        cursor: pointer;
        user-select: none;
      }

      .row-head:hover {
        background: var(--dt-bg-chip);
      }

      .row-name {
        flex: 1;
        font-weight: 500;
      }

      .row-id {
        font-family: var(--dt-font-mono);
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 7px;
        border-radius: 999px;
        font-size: var(--dt-font-size-xs);
        letter-spacing: 0.04em;
        font-weight: 500;
        line-height: 1.4;
      }

      .badge.mounted {
        background: var(--dt-c-mounted-bg);
        color: var(--dt-c-mounted-text);
      }

      .badge.bootstrapped {
        background: var(--dt-c-bootstrapped-bg);
        color: var(--dt-c-bootstrapped-text);
      }

      .badge.registered {
        background: var(--dt-c-registered-bg);
        color: var(--dt-c-registered-text);
      }

      .badge.available {
        background: var(--dt-c-available-bg, var(--dt-bg-chip));
        color: var(--dt-c-available-text, var(--dt-text-secondary));
      }

      .badge.error {
        background: var(--dt-c-error-bg, var(--dt-danger-bg));
        color: var(--dt-c-error-text, var(--dt-danger-text));
      }

      .chevron {
        transition: transform var(--dt-dur-sm) var(--dt-ease);
        flex-shrink: 0;
        color: var(--dt-text-muted);
      }

      .chevron.open {
        transform: rotate(180deg);
      }

      .row-body {
        padding: 8px;
        border-top: 1px solid var(--dt-border-subtle);
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .empty {
        color: var(--dt-text-muted);
        padding: 12px;
        font-size: var(--dt-font-size-sm);
      }
    `,
  ]

  static properties = {
    specifier: { type: String },
    elements: { type: Array },
    instances: { type: Array },
    isExpanded: { type: Boolean },
  }

  declare specifier: string
  declare elements: WcfHostElement[]
  declare instances: AppRegistryEntry[]
  declare isExpanded: boolean

  constructor() {
    super()
    this.specifier = ''
    this.elements = []
    this.instances = []
    this.isExpanded = false
  }

  #aggregateStatus(): 'mounted' | 'bootstrapped' | 'registered' | 'available' {
    let highest: 'mounted' | 'bootstrapped' | 'registered' | 'available' = 'available'

    for (const el of this.elements) {
      const id = el.getAttribute('data-wcf-id')
      const entry = this.instances.find((i) => i.id === id)
      if (!entry) continue

      if (entry.status === 'mounted') return 'mounted'
      if (entry.status === 'bootstrapped' && highest !== 'mounted') {
        highest = 'bootstrapped'
      } else if (entry.status === 'registered' && highest === 'available') {
        highest = 'registered'
      }
    }

    return highest
  }

  #hasError(): boolean {
    return this.elements.some((el) => {
      const id = el.getAttribute('data-wcf-id')
      const entry = this.instances.find((i) => i.id === id)
      return !!entry?.lastError
    })
  }

  #onHeadClick = () => {
    this.dispatchEvent(
      new CustomEvent('wcf:row-toggle', {
        bubbles: true,
        composed: true,
        detail: { specifier: this.specifier },
      }),
    )
  }

  #findInstance(el: WcfHostElement): AppRegistryEntry | undefined {
    const id = el.getAttribute('data-wcf-id')
    return this.instances.find((i) => i.id === id)
  }

  render() {
    const status = this.#aggregateStatus()
    const hasError = this.#hasError()

    return html`
      <div class="row">
        <div class="row-head" @click=${this.#onHeadClick}>
          <span class="badge ${status}">${status}</span>
          <span class="row-name">${this.specifier}</span>
          ${this.elements.length > 1
            ? html`<span class="row-id">×${this.elements.length}</span>`
            : ''}
          ${hasError ? html`<span class="badge error">err</span>` : ''}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            class="chevron ${this.isExpanded ? 'open' : ''}"
          >
            <path
              d="M2 3.5 L5 6.5 L8 3.5"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
            />
          </svg>
        </div>
        ${this.isExpanded
          ? html`
              <div class="row-body">
                ${this.elements.length === 0
                  ? html`<div class="empty">
                      No wcf-mfe / wcf-widget in the DOM for this specifier.
                    </div>`
                  : this.elements.map(
                      (el) => html`
                        <wcf-instance-card
                          .element=${el}
                          .instance=${this.#findInstance(el)}
                        ></wcf-instance-card>
                      `,
                    )}
              </div>
            `
          : ''}
      </div>
    `
  }
}

customElements.define('wcf-specifier-row', SpecifierRow)
