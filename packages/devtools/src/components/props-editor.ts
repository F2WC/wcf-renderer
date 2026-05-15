import { LitElement, css, html } from 'lit'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'

export class PropsEditor extends LitElement {
  static properties = {
    element: { attribute: false },
    supportsUpdate: { type: Boolean },
    props: { attribute: false },
    _draftKey: { state: true },
    _draftValue: { state: true },
  }

  declare element: HTMLElement | undefined
  declare supportsUpdate: boolean
  declare props: Record<string, string>
  declare _draftKey: string
  declare _draftValue: string

  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
        border-top: 1px dashed var(--dt-border);
        padding-top: var(--dt-space-2);
        margin-top: var(--dt-space-2);
        font-family: var(--dt-font-ui);
        font-size: var(--dt-font-size-sm);
      }

      h4 {
        margin: 0 0 var(--dt-space-1) 0;
        padding: 0 var(--dt-space-3);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 10px;
        font-weight: 600;
        color: var(--dt-text-secondary);
      }

      .warn {
        padding: var(--dt-space-1) var(--dt-space-3);
        font-size: var(--dt-font-size-xs);
        color: var(--dt-warn-text);
        margin-bottom: var(--dt-space-1);
      }

      .prop-row,
      .add-row {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 4px;
        padding: 2px var(--dt-space-3);
        align-items: center;
      }

      .add-row {
        margin-top: var(--dt-space-1);
        padding-top: var(--dt-space-1);
        border-top: 1px solid var(--dt-border-subtle);
      }

      input {
        width: 100%;
        box-sizing: border-box;
        background: var(--dt-bg-input);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        color: var(--dt-text-primary);
        font-family: var(--dt-font-mono);
        font-size: var(--dt-font-size-xs);
        padding: 3px var(--dt-space-2);
        outline: none;
        transition: border-color var(--dt-dur-xs) var(--dt-ease);
        min-width: 0;
      }

      input::placeholder {
        color: var(--dt-text-muted);
      }

      input:focus {
        border-color: var(--dt-border-focus);
      }

      input[readonly] {
        color: var(--dt-text-muted);
        cursor: default;
      }

      button {
        background: var(--dt-bg-chip);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        color: var(--dt-text-secondary);
        cursor: pointer;
        font-family: var(--dt-font-ui);
        font-size: var(--dt-font-size-sm);
        line-height: 1;
        padding: 3px 7px;
        transition:
          background var(--dt-dur-xs) var(--dt-ease),
          color var(--dt-dur-xs) var(--dt-ease);
        white-space: nowrap;
      }

      button:hover {
        background: var(--dt-bg-row);
        color: var(--dt-text-primary);
      }

      button:focus-visible {
        outline: 2px solid var(--dt-border-focus);
        outline-offset: 1px;
      }

      .btn-remove {
        color: var(--dt-danger-text);
        border-color: var(--dt-danger-border);
      }

      .btn-remove:hover {
        background: var(--dt-danger-bg);
      }

      .btn-add {
        color: var(--dt-accent);
        border-color: var(--dt-accent-dim);
      }

      .btn-add:hover {
        background: var(--dt-accent-dim);
        color: var(--dt-text-primary);
      }
    `,
  ]

  constructor() {
    super()
    this.element = undefined
    this.supportsUpdate = false
    this.props = {}
    this._draftKey = ''
    this._draftValue = ''
  }

  #onAdd = () => {
    this.dispatchEvent(
      new CustomEvent('wcf:prop-add', {
        bubbles: true,
        composed: true,
        detail: { key: this._draftKey, value: this._draftValue },
      }),
    )
    this._draftKey = ''
    this._draftValue = ''
  }

  render() {
    const entries = Object.entries(this.props)

    return html`
      <h4>Props</h4>
      ${!this.supportsUpdate
        ? html`<p class="warn">This MFE doesn't implement update() — edits won't take effect.</p>`
        : null}
      ${entries.map(
        ([key, value]) => html`
          <div class="prop-row">
            <input readonly .value=${key} />
            <input
              .value=${value}
              @change=${(e: Event) => {
                this.dispatchEvent(
                  new CustomEvent('wcf:prop-edit', {
                    bubbles: true,
                    composed: true,
                    detail: { key, value: (e.target as HTMLInputElement).value },
                  }),
                )
              }}
            />
            <button
              class="btn-remove"
              @click=${() => {
                this.dispatchEvent(
                  new CustomEvent('wcf:prop-remove', {
                    bubbles: true,
                    composed: true,
                    detail: { key },
                  }),
                )
              }}
            >
              ×
            </button>
          </div>
        `,
      )}
      <div class="add-row">
        <input
          placeholder="newKey (camelCase)"
          .value=${this._draftKey}
          @input=${(e: Event) => {
            this._draftKey = (e.target as HTMLInputElement).value
          }}
        />
        <input
          placeholder="value"
          .value=${this._draftValue}
          @input=${(e: Event) => {
            this._draftValue = (e.target as HTMLInputElement).value
          }}
        />
        <button class="btn-add" @click=${this.#onAdd}>+</button>
      </div>
    `
  }
}

customElements.define('wcf-props-editor', PropsEditor)
