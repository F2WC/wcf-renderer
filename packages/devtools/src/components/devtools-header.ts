import { LitElement, css, html } from 'lit'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'

export class DevtoolsHeader extends LitElement {
  static properties = {
    position: { type: String },
  }

  declare position: string

  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
      }

      .header {
        display: flex;
        align-items: center;
        gap: var(--dt-space-2);
        padding: var(--dt-space-2) var(--dt-space-3);
        background: var(--dt-bg-header);
        border-bottom: 1px solid var(--dt-border);
        font-family: var(--dt-font-ui), sans-serif;
        font-size: var(--dt-font-size-sm);
      }

      .title {
        display: flex;
        align-items: center;
        gap: var(--dt-space-1);
        font-weight: 600;
        color: var(--dt-text-primary);
        margin-right: auto;
      }

      .logo {
        color: var(--dt-accent);
        font-size: 1.1em;
        line-height: 1;
      }

      select,
      button {
        font-family: var(--dt-font-ui), sans-serif;
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-secondary);
        background: var(--dt-bg-chip);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        padding: 2px var(--dt-space-2);
        cursor: pointer;
        transition:
          background var(--dt-dur-xs) var(--dt-ease),
          color var(--dt-dur-xs) var(--dt-ease);
        outline: none;
        appearance: none;
        -webkit-appearance: none;
      }

      select {
        padding-right: var(--dt-space-3);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 6px center;
      }

      select:hover,
      button:hover {
        background: var(--dt-bg-row);
        color: var(--dt-text-primary);
      }

      select:focus,
      button:focus-visible {
        border-color: var(--dt-border-focus);
      }

      .btn-close {
        font-size: var(--dt-font-size-base);
        line-height: 1;
        padding: 2px 6px;
      }
    `,
  ]

  #onPositionChange = (e: Event) => {
    const select = e.target as HTMLSelectElement
    this.dispatchEvent(
      new CustomEvent('wcf:position-change', {
        bubbles: true,
        composed: true,
        detail: { position: select.value },
      }),
    )
  }

  #onReset = () => {
    this.dispatchEvent(new CustomEvent('wcf:reset', { bubbles: true, composed: true }))
  }

  #onClose = () => {
    this.dispatchEvent(new CustomEvent('wcf:close', { bubbles: true, composed: true }))
  }

  render() {
    return html`
      <header class="header">
        <span class="title">
          <span class="logo">◈</span>
          WCF devtools
        </span>
        <select @change=${this.#onPositionChange}>
          ${(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map(
            (opt) => html`<option value=${opt} ?selected=${this.position === opt}>${opt}</option>`,
          )}
        </select>
        <button @click=${this.#onReset}>Reset</button>
        <button class="btn-close" @click=${this.#onClose}>×</button>
      </header>
    `
  }
}

if (!customElements.get('wcf-devtools-header')) {
  customElements.define('wcf-devtools-header', DevtoolsHeader)
}
