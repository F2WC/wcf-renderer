import { LitElement, html, css } from 'lit'
import { AppRegistryEntry } from 'web-component-framework-renderer-sdk'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'
import { ImportmapOverrides } from '../state/storage.ts'
import { findElementsForSpecifier } from '../utils/dom.ts'
import { getBaseImports } from '../importmap-hook.ts'
import './specifier-row.ts'

class AppsPanel extends LitElement {
  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
        padding: var(--dt-space-2);
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        gap: 6px;
        color: var(--dt-text-muted);
        font-size: var(--dt-font-size-sm);
        text-align: center;
      }

      .empty-icon {
        font-size: 1.6rem;
        opacity: 0.4;
        line-height: 1;
        color: var(--dt-text-muted);
      }

      .toolbar {
        margin-bottom: var(--dt-space-2);
        display: flex;
        gap: var(--dt-space-2);
      }

      .search-input {
        flex: 1;
        background: var(--dt-bg-input);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        padding: 5px 8px;
        font: inherit;
        font-size: var(--dt-font-size-sm);
        color: var(--dt-text-primary);
      }

      .search-input:focus {
        outline: none;
        border-color: var(--dt-accent);
      }

      .search-input::placeholder {
        color: var(--dt-text-muted);
      }
    `,
  ]

  static properties = {
    apps: { type: Array },
    expanded: { type: Object },
    overrides: { type: Object },
    _search: { state: true },
  }

  declare apps: AppRegistryEntry[]
  declare expanded: Set<string>
  declare overrides: ImportmapOverrides
  declare _search: string

  constructor() {
    super()
    this.apps = []
    this.expanded = new Set()
    this.overrides = {}
    this._search = ''
  }

  #allSpecifiers(): string[] {
    const keys = new Set([
      ...Object.keys(getBaseImports()),
      ...Object.keys(this.overrides),
      ...this.apps.map((a) => a.name),
    ])
    return [...keys].sort()
  }

  #filteredSpecifiers(): string[] {
    const q = this._search.trim().toLowerCase()
    const all = this.#allSpecifiers()
    return q ? all.filter((s) => s.toLowerCase().includes(q)) : all
  }

  render() {
    const specifiers = this.#filteredSpecifiers()
    const hasAny = this.#allSpecifiers().length > 0

    if (!hasAny) {
      return html`
        <div class="empty">
          <span class="empty-icon">⊘</span>
          <span>No MFEs registered yet.</span>
        </div>
      `
    }

    return html`
      <div class="toolbar">
        <input
          class="search-input"
          type="text"
          placeholder="Filter specifiers…"
          .value=${this._search}
          @input=${(e: Event) => {
            this._search = (e.target as HTMLInputElement).value
          }}
        />
      </div>
      ${specifiers.length === 0
        ? html`<div class="empty"><span>No match for "${this._search}"</span></div>`
        : specifiers.map(
            (specifier) => html`
              <wcf-specifier-row
                .specifier=${specifier}
                .elements=${findElementsForSpecifier(specifier)}
                .instances=${this.apps}
                .isExpanded=${this.expanded.has(specifier)}
              ></wcf-specifier-row>
            `,
          )}
    `
  }
}

customElements.define('wcf-apps-panel', AppsPanel)
