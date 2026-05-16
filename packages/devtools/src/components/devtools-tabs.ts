import { LitElement, css, html } from 'lit'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'

type Panel = 'apps' | 'timeline' | 'dom-tree' | 'events' | 'overrides'

const TABS: { id: Panel; label: string }[] = [
  { id: 'apps', label: 'Apps' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'dom-tree', label: 'DOM' },
  { id: 'events', label: 'Events' },
  { id: 'overrides', label: 'Overrides' },
]

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
        width: 20%;
        height: 2px;
        background: var(--dt-accent);
        border-radius: var(--dt-radius-pill) var(--dt-radius-pill) 0 0;
        transition: left var(--dt-dur-sm) var(--dt-ease);
        pointer-events: none;
      }

      button[role='tab'] {
        flex: 1;
        padding: var(--dt-space-2) 4px;
        background: none;
        border: none;
        cursor: pointer;
        font-family: var(--dt-font-ui);
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-secondary);
        transition:
          color var(--dt-dur-xs) var(--dt-ease),
          background var(--dt-dur-xs) var(--dt-ease);
        outline: none;
        white-space: nowrap;
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
        margin-left: 3px;
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
    const idx = TABS.findIndex((t) => t.id === this.panel)
    const pct = ((idx < 0 ? 0 : idx) / TABS.length) * 100
    return `${pct.toFixed(4)}%`
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

  #count(id: Panel): number | undefined {
    if (id === 'apps') return this.appCount
    if (id === 'events') return this.eventCount
    if (id === 'overrides') return this.overrideCount
    return undefined
  }

  render() {
    return html`
      <div class="tablist" role="tablist" style="--tab-offset: ${this.#tabOffset}">
        ${TABS.map((tab) => {
          const count = this.#count(tab.id)
          return html`
            <button
              role="tab"
              aria-selected=${this.panel === tab.id ? 'true' : 'false'}
              @click=${() => {
                this.#selectTab(tab.id)
              }}
            >
              ${tab.label} ${count !== undefined ? html`<span class="count">${count}</span>` : ''}
            </button>
          `
        })}
      </div>
    `
  }
}

customElements.define('wcf-devtools-tabs', DevtoolsTabs)
