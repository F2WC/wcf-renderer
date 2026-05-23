import { LitElement, html, css, type PropertyValues } from 'lit'
import { AppRegistryEntry, WcfHostElement } from 'web-component-framework-renderer-sdk'
import { tokens } from '@/styles/tokens.css.ts'
import { reset } from '@/styles/reset.css.ts'
import { formatWallTime, formatDuration, shortId } from '@/utils/format.ts'
import { highlightElement, clearHighlight } from '@/utils/dom.ts'
import { readPropsFromElement } from '@/utils/props.ts'
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
        margin-bottom: var(--dt-space-2);
      }

      .short-id {
        font-family: var(--dt-font-mono), monospace;
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

      .badge.unmounted {
        background: var(--dt-c-unmounted-bg);
        color: var(--dt-c-unmounted-text);
      }

      /* ── Lifecycle stepper ── */

      .lifecycle-stepper {
        display: flex;
        align-items: flex-start;
        margin-bottom: var(--dt-space-2);
      }

      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        gap: 3px;
        position: relative;
        min-width: 0;
      }

      /* connector line to the next step */
      .step:not(:last-child)::after {
        content: '';
        position: absolute;
        top: 7px;
        left: calc(50% + 8px);
        right: calc(-50% + 8px);
        height: 1px;
        background: var(--dt-border);
        z-index: 0;
      }

      .step.done:not(:last-child)::after {
        background: var(--dt-accent-dim);
      }

      .step-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid var(--dt-border);
        background: var(--dt-bg-chip);
        position: relative;
        z-index: 1;
        flex-shrink: 0;
        transition:
          border-color var(--dt-dur-xs) var(--dt-ease),
          background var(--dt-dur-xs) var(--dt-ease);
      }

      .step.done .step-dot {
        border-color: var(--dt-accent);
        background: var(--dt-accent-dim);
      }

      .step.active .step-dot {
        border-color: var(--dt-c-mounted-text);
        background: var(--dt-c-mounted-bg);
        box-shadow: 0 0 5px color-mix(in srgb, var(--dt-c-mounted-text) 40%, transparent);
      }

      .step.error .step-dot {
        border-color: var(--dt-danger-text);
        background: var(--dt-danger-bg);
      }

      .step.unmounted .step-dot {
        border-color: var(--dt-c-unmounted-text);
        background: var(--dt-c-unmounted-bg);
      }

      .step-label {
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
        text-align: center;
        line-height: 1.2;
        white-space: nowrap;
      }

      .step.done .step-label,
      .step.active .step-label {
        color: var(--dt-text-secondary);
      }

      .step.error .step-label {
        color: var(--dt-danger-text);
      }

      .step.unmounted .step-label {
        color: var(--dt-c-unmounted-text);
      }

      .step-time {
        font-family: var(--dt-font-mono), monospace;
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
        text-align: center;
        white-space: nowrap;
      }

      .step.active .step-time {
        color: var(--dt-c-mounted-text);
      }

      .step.error .step-time {
        color: var(--dt-danger-text);
      }

      /* ── Error box ── */

      .error-box {
        background: var(--dt-danger-bg);
        border: 1px solid var(--dt-danger-border);
        color: var(--dt-danger-text);
        padding: 4px 6px;
        border-radius: var(--dt-radius-xs);
        font-size: var(--dt-font-size-xs);
        font-family: var(--dt-font-mono), monospace;
        margin-bottom: var(--dt-space-2);
        word-break: break-word;
      }

      /* ── Actions ── */

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
    _props: { state: true },
  }

  declare element: WcfHostElement | undefined
  declare instance: AppRegistryEntry | undefined
  declare _copied: boolean
  declare _props: Record<string, string>

  #copiedTimer: ReturnType<typeof setTimeout> | undefined

  constructor() {
    super()
    this._copied = false
    this._props = {}
  }

  updated(changed: PropertyValues): void {
    if (changed.has('element')) {
      this._props = this.element ? readPropsFromElement(this.element) : {}
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    clearTimeout(this.#copiedTimer)
  }

  #refreshProps = () => {
    if (this.element) this._props = readPropsFromElement(this.element)
  }

  #copyId = async () => {
    if (!this.instance?.id) return

    try {
      await navigator.clipboard.writeText(this.instance.id)
      this._copied = true
      clearTimeout(this.#copiedTimer)
      this.#copiedTimer = setTimeout(() => {
        this._copied = false
      }, 1200)
    } catch (error) {
      console.warn('Failed to copy instance id to clipboard', error)
    }
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

  #renderStepper() {
    const inst = this.instance
    if (!inst) return ''

    const isUnmounted = !!inst.unmountedAt
    const hasError = !!inst.lastError
    const errorPhase = inst.lastError?.phase

    const bootstrapMs =
      inst.registeredAt && inst.bootstrappedAt ? inst.bootstrappedAt - inst.registeredAt : undefined
    const mountMs =
      inst.bootstrappedAt && inst.mountedAt ? inst.mountedAt - inst.bootstrappedAt : undefined

    const regClass = 'done'
    const bootClass =
      errorPhase === 'bootstrap'
        ? 'error'
        : inst.bootstrappedAt
          ? isUnmounted || inst.status === 'mounted'
            ? 'done'
            : 'active'
          : 'pending'
    const mountClass =
      errorPhase === 'mount'
        ? 'error'
        : inst.mountedAt
          ? isUnmounted
            ? 'done'
            : 'active'
          : 'pending'
    const unmountClass = isUnmounted ? 'unmounted' : 'pending'

    const steps = [
      {
        cls: regClass,
        label: 'Register',
        time: formatWallTime(inst.registeredAt),
      },
      {
        cls: bootClass,
        label: 'Bootstrap',
        time: bootstrapMs !== undefined ? formatDuration(bootstrapMs) : '—',
      },
      {
        cls: mountClass,
        label: 'Mount',
        time: mountMs !== undefined ? formatDuration(mountMs) : '—',
      },
      ...(isUnmounted
        ? [
            {
              cls: unmountClass,
              label: 'Unmount',
              time: formatWallTime(inst.unmountedAt),
            },
          ]
        : []),
    ]

    return html`
      <div class="lifecycle-stepper">
        ${steps.map(
          (s) => html`
            <div class="step ${s.cls}">
              <div class="step-dot"></div>
              <span class="step-label">${s.label}</span>
              <span class="step-time">${s.time}</span>
            </div>
          `,
        )}
      </div>
      ${hasError
        ? html`<div class="error-box">[${inst.lastError?.phase}] ${inst.lastError?.message}</div>`
        : ''}
    `
  }

  render() {
    const inst = this.instance
    const id = inst ? shortId(inst.id) : ''
    const status = inst?.unmountedAt ? 'unmounted' : (inst?.status ?? 'registered')

    return html`
      <div
        class="instance"
        @mouseenter=${this.#onMouseEnter}
        @mouseleave=${this.#onMouseLeave}
        @wcf:prop-edit=${this.#refreshProps}
        @wcf:prop-remove=${this.#refreshProps}
        @wcf:prop-add=${this.#refreshProps}
      >
        <div class="instance-head">
          ${inst ? html`<span class="badge ${status}">${status}</span>` : ''}
          <span class="short-id">${id}</span>
          ${inst
            ? html`<button class="copy-btn" title="Copy full ID" @click=${this.#copyId}>
                ${this._copied ? '✓' : '⎘'}
              </button>`
            : ''}
        </div>

        ${this.#renderStepper()}

        <div class="instance-actions">
          ${inst && !inst.unmountedAt
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
                .props=${this._props}
              ></wcf-props-editor>
            `
          : ''}
      </div>
    `
  }
}

if (!customElements.get('wcf-instance-card')) {
  customElements.define('wcf-instance-card', InstanceCard)
}
