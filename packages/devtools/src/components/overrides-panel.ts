import { LitElement, html, css } from 'lit'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'
import { ImportmapOverrides } from '../state/storage.ts'
import './override-row.ts'

class OverridesPanel extends LitElement {
  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
        padding: var(--dt-space-2);
      }

      .banner {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--dt-warn-bg);
        color: var(--dt-warn-text);
        border: 1px solid var(--dt-warn-border);
        border-radius: var(--dt-radius-sm);
        padding: 7px 12px;
        margin-bottom: var(--dt-space-2);
        font-size: var(--dt-font-size-sm);
      }

      .banner-msg {
        flex: 1;
      }

      .reload-btn {
        background: var(--dt-warn-text);
        color: #111;
        border: none;
        border-radius: var(--dt-radius-xs);
        padding: 3px 10px;
        font: inherit;
        font-size: var(--dt-font-size-sm);
        font-weight: 600;
        cursor: pointer;
        flex-shrink: 0;
      }

      .reload-btn:hover {
        opacity: 0.85;
      }

      .empty {
        color: var(--dt-text-muted);
        font-size: var(--dt-font-size-sm);
        padding: 12px 0;
      }

      .add-row {
        display: grid;
        grid-template-columns: 1fr 1fr max-content;
        gap: var(--dt-space-2);
        margin-top: var(--dt-space-2);
        padding-top: var(--dt-space-2);
        border-top: 1px solid var(--dt-border-subtle);
      }

      .add-input {
        background: var(--dt-bg-input);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        padding: 5px 8px;
        font: inherit;
        font-size: var(--dt-font-size-sm);
        color: var(--dt-text-primary);
        min-width: 0;
      }

      .add-input:focus {
        outline: none;
        border-color: var(--dt-accent);
      }

      .add-btn {
        background: var(--dt-bg-chip);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        padding: 3px 10px;
        font: inherit;
        font-size: var(--dt-font-size-sm);
        color: var(--dt-text-primary);
        cursor: pointer;
        white-space: nowrap;
      }

      .add-btn:hover {
        opacity: 0.85;
      }
    `,
  ]

  static properties = {
    overrides: { type: Object },
    baseImports: { type: Object },
    dirty: { type: Boolean },
    _draftKey: { state: true },
    _draftValue: { state: true },
  }

  declare overrides: ImportmapOverrides
  declare baseImports: Record<string, string>
  declare dirty: boolean
  declare _draftKey: string
  declare _draftValue: string

  constructor() {
    super()
    this.overrides = {}
    this.baseImports = {}
    this.dirty = false
    this._draftKey = ''
    this._draftValue = ''
  }

  #onReload = () => {
    this.dispatchEvent(
      new CustomEvent('wcf:reload', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  #onAdd = () => {
    if (!this._draftKey.trim()) return
    this.dispatchEvent(
      new CustomEvent('wcf:override-add', {
        bubbles: true,
        composed: true,
        detail: { key: this._draftKey, value: this._draftValue },
      }),
    )
    this._draftKey = ''
    this._draftValue = ''
  }

  #allSpecifiers(): string[] {
    const keys = new Set([...Object.keys(this.baseImports), ...Object.keys(this.overrides)])
    return [...keys].sort()
  }

  render() {
    const specifiers = this.#allSpecifiers()

    return html`
      ${this.dirty
        ? html`
            <div class="banner">
              <span class="banner-msg">Reload to apply importmap changes.</span>
              <button class="reload-btn" @click=${this.#onReload}>Reload</button>
            </div>
          `
        : ''}
      ${specifiers.length === 0
        ? html`<div class="empty">Importmap is empty. Add a specifier below.</div>`
        : specifiers.map(
            (specifier) => html`
              <wcf-override-row
                .specifier=${specifier}
                .baseUrl=${this.baseImports[specifier] ?? ''}
                .overriddenUrl=${this.overrides[specifier] ?? ''}
                .isOverridden=${specifier in this.overrides}
                .isCustom=${!(specifier in this.baseImports)}
              ></wcf-override-row>
            `,
          )}

      <div class="add-row">
        <input
          class="add-input"
          type="text"
          placeholder="Specifier (e.g. ./mfe-name)"
          .value=${this._draftKey}
          @input=${(e: Event) => {
            this._draftKey = (e.target as HTMLInputElement).value
          }}
        />
        <input
          class="add-input"
          type="text"
          placeholder="URL"
          .value=${this._draftValue}
          @input=${(e: Event) => {
            this._draftValue = (e.target as HTMLInputElement).value
          }}
        />
        <button class="add-btn" @click=${this.#onAdd}>+</button>
      </div>
    `
  }
}

customElements.define('wcf-overrides-panel', OverridesPanel)
