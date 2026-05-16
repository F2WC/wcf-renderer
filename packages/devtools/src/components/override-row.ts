import { LitElement, css, html } from 'lit'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'

export class OverrideRow extends LitElement {
  static properties = {
    specifier: { type: String },
    baseUrl: { type: String },
    overriddenUrl: { type: String },
    isOverridden: { type: Boolean },
    isCustom: { type: Boolean },
    _draftValue: { state: true },
  }

  declare specifier: string
  declare baseUrl: string
  declare overriddenUrl: string
  declare isOverridden: boolean
  declare isCustom: boolean
  declare _draftValue: string

  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
      }

      .row {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        grid-template-rows: auto auto;
        gap: 2px var(--dt-space-1);
        padding: var(--dt-space-2) var(--dt-space-3);
        align-items: center;
        background: var(--dt-bg-row);
        border-bottom: 1px solid var(--dt-border-subtle);
      }

      input {
        width: 100%;
        box-sizing: border-box;
        background: var(--dt-bg-input);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        color: var(--dt-text-primary);
        font-family: var(--dt-font-mono), monospace;
        font-size: var(--dt-font-size-xs);
        padding: 3px var(--dt-space-2);
        outline: none;
        transition: border-color var(--dt-dur-xs) var(--dt-ease);
        min-width: 0;
      }

      input:focus {
        border-color: var(--dt-border-focus);
      }

      input[readonly] {
        color: var(--dt-text-muted);
        cursor: default;
      }

      .input-overridden {
        box-shadow: inset 3px 0 0 var(--dt-warn-text);
        border-color: var(--dt-warn-border);
      }

      .btn-revert {
        background: transparent;
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        color: var(--dt-warn-text);
        cursor: pointer;
        font-size: var(--dt-font-size-sm);
        line-height: 1;
        padding: 3px 6px;
        transition: background var(--dt-dur-xs) var(--dt-ease);
        white-space: nowrap;
      }

      .btn-revert:hover {
        background: var(--dt-warn-bg);
        border-color: var(--dt-warn-border);
      }

      .btn-revert:focus-visible {
        outline: 2px solid var(--dt-border-focus);
        outline-offset: 1px;
      }

      .placeholder {
        display: inline-block;
        width: 24px;
      }

      .base-hint {
        grid-column: 2;
        font-family: var(--dt-font-mono), monospace;
        font-size: 9px;
        color: var(--dt-text-muted);
        padding: 0 var(--dt-space-2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ]

  constructor() {
    super()
    this.specifier = ''
    this.baseUrl = ''
    this.overriddenUrl = ''
    this.isOverridden = false
    this.isCustom = false
    this._draftValue = ''
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('overriddenUrl') || changed.has('baseUrl')) {
      this._draftValue = this.overriddenUrl || this.baseUrl || ''
    }
  }

  #onInput = (e: Event) => {
    this._draftValue = (e.target as HTMLInputElement).value
  }

  #onChange = () => {
    this.dispatchEvent(
      new CustomEvent('wcf:override-update', {
        bubbles: true,
        composed: true,
        detail: { specifier: this.specifier, value: this._draftValue },
      }),
    )
  }

  #onRevert = () => {
    this.dispatchEvent(
      new CustomEvent('wcf:override-remove', {
        bubbles: true,
        composed: true,
        detail: { specifier: this.specifier },
      }),
    )
  }

  render() {
    return html`
      <div class="row">
        <input readonly .value=${this.specifier} />
        <input
          class=${this.isOverridden ? 'input-overridden' : ''}
          .value=${this._draftValue}
          @input=${this.#onInput}
          @change=${this.#onChange}
        />
        ${this.isOverridden
          ? html`
              <button
                class="btn-revert"
                title=${this.isCustom ? 'Remove' : 'Revert to base'}
                @click=${this.#onRevert}
              >
                ${this.isCustom ? '×' : '↺'}
              </button>
            `
          : html`<span class="placeholder"></span>`}
        ${this.isOverridden && this.baseUrl
          ? html`<span class="base-hint" title="Base URL: ${this.baseUrl}"
              >was: ${this.baseUrl}</span
            >`
          : ''}
      </div>
    `
  }
}

customElements.define('wcf-override-row', OverrideRow)
