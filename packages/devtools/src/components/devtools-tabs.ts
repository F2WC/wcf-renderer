import { LitElement, css, html } from 'lit'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'

type Panel = 'apps' | 'events' | 'overrides'

export class DevtoolsTabs extends LitElement {
  static properties = {
    panel: { type: String },
    appCount: { type: Number },
    eventCount: { type: Number },
    overrideCount: { type: Number },
  }

  declare panel: Panel
  declare appCount: number
  declare eventCount: number
  declare overrideCount: number

  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
      }

      .tablist {
        position: relative;
        display: flex;
        background: var(--dt-bg-panel);
        border-bottom: 1px solid var(--dt-border);
        font-family: var(--dt-font-ui);
        font-size: var(--dt-font-size-sm);
      }

      .tablist::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: var(--tab-offset, 0%);
        width: 33.333%;
        height: 2px;
        background: var(--dt-accent);
        border-radius: var(--dt-radius-pill) var(--dt-radius-pill) 0 0;
        transition: left var(--dt-dur-sm) var(--dt-ease);
        pointer-events: none;
      }

      button[role='tab'] {
        flex: 1;
        padding: var(--dt-space-2) var(--dt-space-3);
        background: none;
        border: none;
        cursor: pointer;
        font-family: var(--dt-font-ui);
        font-size: var(--dt-font-size-sm);
        color: var(--dt-text-secondary);
        transition:
          color var(--dt-dur-xs) var(--dt-ease),
          background var(--dt-dur-xs) var(--dt-ease);
        outline: none;
      }

      button[role='tab']:hover {
        color: var(--dt-text-primary);
        background: var(--dt-bg-row);
      }

      button[role='tab']:focus-visible {
        outline: 2px solid var(--dt-border-focus);
        outline-offset: -2px;
      }

      button[aria-selected='true'] {
        color: var(--dt-text-primary);
      }

      .count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 17px;
        height: 15px;
        padding: 0 4px;
        border-radius: 999px;
        font-size: 9px;
        font-weight: 700;
        background: var(--dt-bg-chip);
        color: var(--dt-text-muted);
        margin-left: 4px;
        vertical-align: middle;
        transition:
          background var(--dt-dur-xs) var(--dt-ease),
          color var(--dt-dur-xs) var(--dt-ease);
      }

      button[aria-selected='true'] .count {
        background: var(--dt-accent-dim);
        color: var(--dt-accent);
      }
    `,
  ]

  get #tabOffset(): string {
    switch (this.panel) {
      case 'apps':
        return '0%'
      case 'events':
        return '33.333%'
      case 'overrides':
        return '66.666%'
      default:
        return '0%'
    }
  }

  #selectTab(panel: Panel) {
    this.dispatchEvent(
      new CustomEvent('wcf:tab-select', {
        bubbles: true,
        composed: true,
        detail: { panel },
      }),
    )
  }

  render() {
    return html`
      <div class="tablist" role="tablist" style="--tab-offset: ${this.#tabOffset}">
        <button
          role="tab"
          aria-selected=${this.panel === 'apps' ? 'true' : 'false'}
          @click=${() => {
            this.#selectTab('apps')
          }}
        >
          Apps <span class="count">${this.appCount}</span>
        </button>
        <button
          role="tab"
          aria-selected=${this.panel === 'events' ? 'true' : 'false'}
          @click=${() => {
            this.#selectTab('events')
          }}
        >
          Events <span class="count">${this.eventCount}</span>
        </button>
        <button
          role="tab"
          aria-selected=${this.panel === 'overrides' ? 'true' : 'false'}
          @click=${() => {
            this.#selectTab('overrides')
          }}
        >
          Overrides <span class="count">${this.overrideCount}</span>
        </button>
      </div>
    `
  }
}

customElements.define('wcf-devtools-tabs', DevtoolsTabs)
