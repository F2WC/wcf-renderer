import { LitElement, html, css } from 'lit'
import { AppRegistryEntry, WcfHostElement } from 'web-component-framework-renderer-sdk'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'
import { formatWallTime, formatDuration, shortId } from '../utils/format.ts'
import { highlightElement, clearHighlight } from '../utils/dom.ts'
import { readPropsFromElement } from '../utils/props.ts'
import './props-editor.ts'

class InstanceCard extends LitElement {
  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
        width: 100%;
      }

      .instance {
        width: 100%;
        border: 1px solid var(--dt-border-subtle);
        border-radius: var(--dt-radius-sm);
        background: var(--dt-bg-panel);
        padding: var(--dt-space-2);
        overflow-x: auto;
      }

      .instance-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }

      .short-id {
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

      .instance-meta {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 3px 12px;
        font-size: var(--dt-font-size-sm);
      }

      .meta-label {
        color: var(--dt-text-secondary);
      }

      .meta-value {
        font-family: var(--dt-font-mono);
      }

      .error-box {
        grid-column: 1 / -1;
        background: var(--dt-danger-bg);
        border: 1px solid var(--dt-danger-border);
        color: var(--dt-danger-text);
        padding: 4px 6px;
        border-radius: var(--dt-radius-xs);
        font-size: var(--dt-font-size-xs);
        font-family: var(--dt-font-mono);
      }

      .instance-actions {
        display: flex;
        gap: 6px;
        margin-top: var(--dt-space-2);
      }

      button {
        background: var(--dt-bg-chip);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        padding: 3px 10px;
        font: inherit;
        font-size: var(--dt-font-size-sm);
        cursor: pointer;
        color: var(--dt-text-primary);
      }

      button:hover {
        opacity: 0.85;
      }

      button.danger {
        background: var(--dt-danger-bg);
        border-color: var(--dt-danger-border);
        color: var(--dt-danger-text);
      }

      .copy-btn {
        background: none;
        border: none;
        padding: 1px 3px;
        color: var(--dt-text-muted);
        cursor: pointer;
        font-size: 10px;
        line-height: 1;
        border-radius: var(--dt-radius-xs);
        margin-left: 2px;
        transition: color var(--dt-dur-xs) var(--dt-ease);
      }

      .copy-btn:hover {
        color: var(--dt-accent);
        opacity: 1;
      }

    `,
  ]

  static properties = {
    element: { type: Object },
    instance: { type: Object },
    _copied: { state: true },
  }

  declare element: WcfHostElement | undefined
  declare instance: AppRegistryEntry | undefined
  declare _copied: boolean

  constructor() {
    super()
    this._copied = false
  }

  #copyId = async () => {
    if (!this.instance?.id) return
    await navigator.clipboard.writeText(this.instance.id)
    this._copied = true
    setTimeout(() => { this._copied = false }, 1200)
  }

  #onMouseEnter = () => {
    if (this.element) highlightElement(this.element)
  }

  #onMouseLeave = () => {
    clearHighlight()
  }

  #dispatch = (eventName: string) => {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail: { element: this.element },
      }),
    )
  }

  #renderMeta() {
    const inst = this.instance
    if (!inst) return ''

    const registered = inst.registeredAt ? formatWallTime(inst.registeredAt) : '—'
    const bootstrapDuration =
      inst.registeredAt && inst.bootstrappedAt
        ? formatDuration(inst.bootstrappedAt - inst.registeredAt)
        : '—'
    const mountDuration =
      inst.bootstrappedAt && inst.mountedAt
        ? formatDuration(inst.mountedAt - inst.bootstrappedAt)
        : '—'
    const tti =
      inst.registeredAt && inst.mountedAt ? formatDuration(inst.mountedAt - inst.registeredAt) : '—'

    return html`
      <div class="instance-meta">
        <span class="meta-label">Registered</span>
        <span class="meta-value">${registered}</span>
        <span class="meta-label">Bootstrap</span>
        <span class="meta-value">${bootstrapDuration}</span>
        <span class="meta-label">Mount</span>
        <span class="meta-value">${mountDuration}</span>
        <span class="meta-label">TTI</span>
        <span class="meta-value">${tti}</span>
        ${inst.lastError
          ? html`<div class="error-box">[${inst.lastError.phase}] ${inst.lastError.message}</div>`
          : ''}
      </div>
    `
  }

  render() {
    const inst = this.instance
    const id = inst ? shortId(inst.id) : '—'
    const status = inst?.status ?? 'registered'

    return html`
      <div class="instance" @mouseenter=${this.#onMouseEnter} @mouseleave=${this.#onMouseLeave}>
        <div class="instance-head">
          ${inst ? html`<span class="badge ${status}">${status}</span>` : ''}
          <span class="short-id">${id}</span>
          ${inst
            ? html`<button
                class="copy-btn"
                title="Copy full ID"
                @click=${this.#copyId}
              >${this._copied ? '✓' : '⎘'}</button>`
            : ''}
        </div>

        ${this.#renderMeta()}

        <div class="instance-actions">
          ${inst
            ? html`
                <button
                  @click=${() => {
                    this.#dispatch('wcf:remount')
                  }}
                >
                  Remount
                </button>
                <button
                  class="danger"
                  @click=${() => {
                    this.#dispatch('wcf:unmount')
                  }}
                >
                  Unmount
                </button>
              `
            : html`<button
                @click=${() => {
                  this.#dispatch('wcf:mount')
                }}
              >
                Mount
              </button>`}
        </div>

        ${inst && this.element
          ? html`
              <wcf-props-editor
                .element=${this.element}
                .supportsUpdate=${inst.supportsUpdate}
                .props=${readPropsFromElement(this.element)}
              ></wcf-props-editor>
            `
          : ''}
      </div>
    `
  }
}

customElements.define('wcf-instance-card', InstanceCard)
