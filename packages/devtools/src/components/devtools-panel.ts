import { LitElement, html, css, nothing } from 'lit'
import {
  eventBus,
  MFE_EVENTS,
  getAllApps,
  type AppRegistryEntry,
} from 'web-component-framework-renderer-sdk'
import { EventLog, type LogEntry } from '../state/event-log.ts'
import { getBaseImports } from '../importmap-hook.ts'
import {
  getOverrides,
  setOverrides,
  getUiState,
  setUiState,
  resetAll,
  type ImportmapOverrides,
  type UiState,
} from '../state/storage.ts'
import { editProp, removeProp, addProp } from '../utils/props.ts'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'
import type { WcfHostElement } from 'web-component-framework-renderer-sdk'

import './devtools-header.ts'
import './devtools-tabs.ts'
import './apps-panel.ts'
import './timeline-panel.ts'
import './dom-tree-panel.ts'
import './events-panel.ts'
import './overrides-panel.ts'

const TAG = 'wcf-devtools'

class WcfDevtoolsPanel extends LitElement {
  static styles = [
    tokens,
    reset,
    css`
      :host {
        position: fixed;
        z-index: 2147483647;
      }

      :host([data-pos='bottom-right']) {
        bottom: var(--dt-space-4);
        right: var(--dt-space-4);
      }
      :host([data-pos='bottom-left']) {
        bottom: var(--dt-space-4);
        left: var(--dt-space-4);
      }
      :host([data-pos='top-right']) {
        top: var(--dt-space-4);
        right: var(--dt-space-4);
      }
      :host([data-pos='top-left']) {
        top: var(--dt-space-4);
        left: var(--dt-space-4);
      }

      /* Toggle pill */
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px 6px 10px;
        background: var(--dt-bg-header);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-pill);
        box-shadow: var(--dt-shadow-toggle);
        cursor: pointer;
        font-size: var(--dt-font-size-sm);
        font-weight: 600;
        color: var(--dt-text-primary);
        letter-spacing: 0.03em;
        transition:
          background var(--dt-dur-xs) var(--dt-ease),
          border-color var(--dt-dur-xs) var(--dt-ease);
      }

      .toggle:hover {
        background: var(--dt-bg-row);
        border-color: var(--dt-accent);
      }

      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
        transition: background var(--dt-dur-sm) var(--dt-ease);
      }

      .status-dot.none {
        background: var(--dt-text-muted);
      }
      .status-dot.ok {
        background: var(--dt-c-mounted-text);
        box-shadow: 0 0 4px var(--dt-c-mounted-text);
      }
      .status-dot.error {
        background: var(--dt-c-error-text);
        box-shadow: 0 0 4px var(--dt-c-error-text);
      }

      /* Panel */
      .panel {
        width: var(--dt-panel-width);
        max-height: var(--dt-panel-max-height);
        background: var(--dt-bg-panel);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-lg);
        box-shadow: var(--dt-shadow-panel);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: panel-in var(--dt-dur-md) var(--dt-ease) both;
      }

      @keyframes panel-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .panel-body {
        overflow: auto;
        flex: 1;
      }
    `,
  ]

  static properties = {
    apps: { state: true },
    events: { state: true },
    ui: { state: true },
    expanded: { state: true },
    overrides: { state: true },
    overridesDirty: { state: true },
    search: { state: true },
  }

  declare apps: AppRegistryEntry[]
  declare events: readonly LogEntry[]
  declare ui: UiState
  declare expanded: Set<string>
  declare overrides: ImportmapOverrides
  declare overridesDirty: boolean
  declare search: string

  #log = new EventLog()
  #ghostApps = new Map<string, AppRegistryEntry>()
  #unsubLog: (() => void) | undefined
  #onKeydown: ((e: KeyboardEvent) => void) | undefined

  constructor() {
    super()
    this.apps = getAllApps()
    this.events = this.#log.entries()
    this.ui = getUiState()
    this.expanded = new Set()
    this.overrides = getOverrides()
    this.overridesDirty = false
    this.search = ''
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.#applyPosition()

    const handle = (type: LogEntry['type']) => (event: Event) => {
      const detail = (event as CustomEvent).detail as { id?: string; name: string } | undefined

      // Snapshot before getAllApps so the entry survives removeApp() in the SDK unmount path
      if (type === 'MFE:UNMOUNTED' && detail?.id) {
        const existing = this.apps.find((a) => a.id === detail.id)
        if (existing) {
          this.#ghostApps.set(existing.id, { ...existing, unmountedAt: performance.now() })
        }
      }

      this.#log.push({
        type,
        name: detail?.name ?? '?',
        instanceId: detail?.id,
        timestamp: performance.now(),
        payload: detail,
      })

      const live = getAllApps()
      const liveIds = new Set(live.map((a) => a.id))
      // Drop ghosts that have remounted under the same ID
      for (const id of this.#ghostApps.keys()) {
        if (liveIds.has(id)) this.#ghostApps.delete(id)
      }
      this.apps = [...live, ...this.#ghostApps.values()]

      const errored = this.apps.find((app) => app.id === detail?.id && app.lastError)
      if (errored?.lastError) {
        this.#log.push({
          type: 'ERROR',
          name: errored.name,
          instanceId: errored.id,
          timestamp: errored.lastError.at,
          payload: errored.lastError,
        })
      }
    }

    eventBus.on(MFE_EVENTS.REGISTERED, handle('MFE:REGISTERED'))
    eventBus.on(MFE_EVENTS.BOOTSTRAPPED, handle('MFE:BOOTSTRAPPED'))
    eventBus.on(MFE_EVENTS.MOUNTED, handle('MFE:MOUNTED'))
    eventBus.on(MFE_EVENTS.UPDATED, handle('MFE:UPDATED'))
    eventBus.on(MFE_EVENTS.UNMOUNTED, handle('MFE:UNMOUNTED'))

    this.#unsubLog = this.#log.subscribe(() => {
      this.events = [...this.#log.entries()]
    })

    this.#onKeydown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        e.preventDefault()
        this.#updateUi({ collapsed: !this.ui.collapsed })
      }
    }
    document.addEventListener('keydown', this.#onKeydown)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#unsubLog?.()
    if (this.#onKeydown) document.removeEventListener('keydown', this.#onKeydown)
  }

  #applyPosition(): void {
    this.setAttribute('data-pos', this.ui.position)
  }

  #updateUi(patch: Partial<UiState>): void {
    this.ui = { ...this.ui, ...patch }
    setUiState(this.ui)
    this.#applyPosition()
  }

  #statusDotClass(): string {
    const hasError = this.apps.some((a) => a.lastError)
    if (hasError) return 'error'
    const hasMounted = this.apps.some((a) => a.status === 'mounted')
    if (hasMounted) return 'ok'
    return 'none'
  }

  /* ---- event handlers wired via @event on this element ---- */

  #onPositionChange = (e: Event) => {
    const detail = (e as CustomEvent<{ position: UiState['position'] }>).detail
    this.#updateUi({ position: detail.position })
  }

  #onReset = () => {
    resetAll()
    this.overrides = {}
    this.overridesDirty = true
    this.ui = getUiState()
    this.#applyPosition()
  }

  #onClose = () => {
    this.#updateUi({ collapsed: true })
  }

  #onTabSelect = (e: Event) => {
    const detail = (e as CustomEvent<{ panel: UiState['panel'] }>).detail
    this.#updateUi({ panel: detail.panel })
  }

  #onRowToggle = (e: Event) => {
    const { specifier } = (e as CustomEvent<{ specifier: string }>).detail
    const next = new Set(this.expanded)
    if (next.has(specifier)) next.delete(specifier)
    else next.add(specifier)
    this.expanded = next
  }

  #onMount = (e: Event) => {
    const { element } = (e as CustomEvent<{ element: WcfHostElement }>).detail
    void element.mountLifecycle()
  }

  #onUnmount = (e: Event) => {
    const { element } = (e as CustomEvent<{ element: WcfHostElement }>).detail
    void element.unmountLifecycle()
  }

  #onRemount = (e: Event) => {
    const { element } = (e as CustomEvent<{ element: WcfHostElement }>).detail
    void element.unmountLifecycle().then(() => element.mountLifecycle())
  }

  #onPropEdit = (e: Event) => {
    const { element, key, value } = (
      e as CustomEvent<{
        element?: HTMLElement
        key: string
        value: string
      }>
    ).detail
    if (element) {
      editProp(element, key, value)
      this.requestUpdate()
    }
  }

  #onPropRemove = (e: Event) => {
    const { element, key } = (
      e as CustomEvent<{
        element?: HTMLElement
        key: string
      }>
    ).detail
    if (element) {
      removeProp(element, key)
      this.requestUpdate()
    }
  }

  #onPropAdd = (e: Event) => {
    const { element, key, value } = (
      e as CustomEvent<{
        element?: HTMLElement
        key: string
        value: string
      }>
    ).detail
    if (element) {
      addProp(element, key, value)
      this.requestUpdate()
    }
  }

  #onOverrideAdd = (e: Event) => {
    const { key, value } = (e as CustomEvent<{ key: string; value: string }>).detail
    if (!key) return
    this.overrides = { ...this.overrides, [key]: value }
    setOverrides(this.overrides)
    this.overridesDirty = true
  }

  #onOverrideUpdate = (e: Event) => {
    const { specifier, value } = (e as CustomEvent<{ specifier: string; value: string }>).detail
    this.overrides = { ...this.overrides, [specifier]: value }
    setOverrides(this.overrides)
    this.overridesDirty = true
  }

  #onOverrideRemove = (e: Event) => {
    const { specifier } = (e as CustomEvent<{ specifier: string }>).detail
    const next: ImportmapOverrides = {}
    for (const [k, v] of Object.entries(this.overrides)) {
      if (k !== specifier) next[k] = v
    }
    this.overrides = next
    setOverrides(this.overrides)
    this.overridesDirty = true
  }

  #onReload = () => {
    location.reload()
  }

  #onSearch = (e: Event) => {
    const { query } = (e as CustomEvent<{ query: string }>).detail
    this.search = query
  }

  #onEventsClear = () => {
    this.#log.clear()
  }

  render() {
    if (this.ui.collapsed) {
      return html`
        <button
          class="toggle"
          title="Open WCF devtools (Alt+D)"
          @click=${() => {
            this.#updateUi({ collapsed: false })
          }}
        >
          <span class="status-dot ${this.#statusDotClass()}"></span>
          WCF
        </button>
      `
    }

    return html`
      <div
        class="panel"
        role="dialog"
        aria-label="WCF devtools"
        @wcf:position-change=${this.#onPositionChange}
        @wcf:reset=${this.#onReset}
        @wcf:close=${this.#onClose}
        @wcf:tab-select=${this.#onTabSelect}
        @wcf:row-toggle=${this.#onRowToggle}
        @wcf:mount=${this.#onMount}
        @wcf:unmount=${this.#onUnmount}
        @wcf:remount=${this.#onRemount}
        @wcf:prop-edit=${this.#onPropEdit}
        @wcf:prop-remove=${this.#onPropRemove}
        @wcf:prop-add=${this.#onPropAdd}
        @wcf:override-add=${this.#onOverrideAdd}
        @wcf:override-update=${this.#onOverrideUpdate}
        @wcf:override-remove=${this.#onOverrideRemove}
        @wcf:reload=${this.#onReload}
        @wcf:search=${this.#onSearch}
        @wcf:events-clear=${this.#onEventsClear}
      >
        <wcf-devtools-header .position=${this.ui.position}></wcf-devtools-header>
        <wcf-devtools-tabs
          .panel=${this.ui.panel}
          .appCount=${this.apps.length}
          .eventCount=${this.events.length}
          .overrideCount=${Object.keys(this.overrides).length}
        ></wcf-devtools-tabs>
        <div class="panel-body">
          ${this.ui.panel === 'apps'
            ? html`<wcf-apps-panel
                .apps=${this.apps}
                .expanded=${this.expanded}
                .overrides=${this.overrides}
              ></wcf-apps-panel>`
            : nothing}
          ${this.ui.panel === 'timeline'
            ? html`<wcf-timeline-panel .apps=${this.apps.filter((a) => !a.unmountedAt)}></wcf-timeline-panel>`
            : nothing}
          ${this.ui.panel === 'dom-tree'
            ? html`<wcf-dom-tree-panel .apps=${this.apps}></wcf-dom-tree-panel>`
            : nothing}
          ${this.ui.panel === 'events'
            ? html`<wcf-events-panel
                .events=${this.events}
                .search=${this.search}
              ></wcf-events-panel>`
            : nothing}
          ${this.ui.panel === 'overrides'
            ? html`<wcf-overrides-panel
                .overrides=${this.overrides}
                .baseImports=${getBaseImports()}
                .dirty=${this.overridesDirty}
              ></wcf-overrides-panel>`
            : nothing}
        </div>
      </div>
    `
  }
}

export function defineDevtoolsElement(): void {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, WcfDevtoolsPanel)
  }
}

export const DEVTOOLS_TAG = TAG
