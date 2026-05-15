import { LitElement, html, css, nothing, type TemplateResult } from 'lit'
import {
  eventBus,
  MFE_EVENTS,
  getAllApps,
  type AppRegistryEntry,
  type WcfHostElement,
} from 'web-component-framework-renderer-sdk'
import { EventLog, type LogEntry } from './event-log.ts'
import { getBaseImports } from './importmap-hook.ts'
import {
  getOverrides,
  setOverrides,
  getUiState,
  setUiState,
  resetAll,
  type ImportmapOverrides,
  type UiState,
} from './storage.ts'

const TAG = 'wcf-devtools'

function shortId(id: string): string {
  return id.slice(0, 8)
}

function formatWallTime(perfNow?: number): string {
  if (perfNow === undefined) return '–'
  const date = new Date(performance.timeOrigin + perfNow)
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

function formatDuration(start?: number, end?: number): string {
  if (start === undefined || end === undefined) return '–'
  return `${(end - start).toFixed(1)}ms`
}

function camelToKebab(input: string): string {
  return input.replace(/[A-Z]/g, (match) => '-' + match.toLowerCase())
}

function previewValue(value: unknown): string {
  if (value === undefined) return '∅'
  if (typeof value === 'string')
    return JSON.stringify(value.length > 24 ? value.slice(0, 24) + '…' : value)
  if (typeof value === 'number' || typeof value === 'boolean' || value === null)
    return JSON.stringify(value)
  try {
    const serialized = JSON.stringify(value) as string | undefined
    return serialized ?? '[unserializable]'
  } catch {
    return '[unserializable]'
  }
}

function renderEventSummary(entry: LogEntry): TemplateResult | typeof nothing {
  if (entry.type !== 'MFE:UPDATED') return nothing
  const payload = entry.payload as
    | { changed?: Record<string, { from: unknown; to: unknown }> }
    | undefined
  if (!payload?.changed) return nothing
  const changedEntries = Object.entries(payload.changed)
  if (changedEntries.length === 0) return nothing
  return html`<span class="diff">
    ${changedEntries.map(
      ([key, change]) =>
        html`<span class="diff-key">${key}</span>:
          <span class="diff-from">${previewValue(change.from)}</span> →
          <span class="diff-to">${previewValue(change.to)}</span>`,
    )}
  </span>`
}

class WcfDevtoolsPanel extends LitElement {
  static styles = css`
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      color: #e6e6e6;
      font-size: 12px;
      line-height: 1.4;
    }
    :host([data-pos='bottom-right']) {
      bottom: 16px;
      right: 16px;
    }
    :host([data-pos='bottom-left']) {
      bottom: 16px;
      left: 16px;
    }
    :host([data-pos='top-right']) {
      top: 16px;
      right: 16px;
    }
    :host([data-pos='top-left']) {
      top: 16px;
      left: 16px;
    }

    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .toggle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1f2937;
      color: #fff;
      border: 1px solid #374151;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .toggle:hover {
      background: #111827;
    }

    .panel {
      width: 520px;
      max-height: 70vh;
      background: #0f172a;
      color: #e6e6e6;
      border: 1px solid #1f2937;
      border-radius: 8px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      background: #111827;
      border-bottom: 1px solid #1f2937;
      gap: 8px;
    }
    .header .title {
      font-weight: 600;
      flex: 1;
    }
    .header select,
    .header button {
      background: #1f2937;
      color: #e6e6e6;
      border: 1px solid #374151;
      border-radius: 4px;
      padding: 3px 6px;
      font-size: 11px;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid #1f2937;
      background: #0b1220;
    }
    .tab {
      flex: 1;
      padding: 8px 10px;
      text-align: center;
      background: transparent;
      color: #9ca3af;
      border: 0;
      border-bottom: 2px solid transparent;
    }
    .tab[aria-selected='true'] {
      color: #fff;
      border-bottom-color: #60a5fa;
    }
    .body {
      overflow: auto;
      padding: 10px;
      flex: 1;
    }
    .banner {
      background: #422006;
      color: #facc15;
      border: 1px solid #713f12;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 10px;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .banner button {
      background: #facc15;
      color: #111827;
      border: 0;
      border-radius: 3px;
      padding: 3px 8px;
      font-weight: 600;
    }

    .row {
      border: 1px solid #1f2937;
      border-radius: 4px;
      margin-bottom: 6px;
      background: #111827;
    }
    .row-head {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 6px 8px;
      cursor: pointer;
    }
    .row-head:hover {
      background: #1f2937;
    }
    .badge {
      padding: 1px 6px;
      border-radius: 999px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.registered {
      background: #334155;
      color: #cbd5e1;
    }
    .badge.bootstrapped {
      background: #1e3a8a;
      color: #bfdbfe;
    }
    .badge.mounted {
      background: #14532d;
      color: #bbf7d0;
    }
    .badge.available {
      background: #312e81;
      color: #c7d2fe;
    }
    .badge.error {
      background: #7f1d1d;
      color: #fecaca;
    }
    .instance {
      width: 350px;
      box-sizing: border-box;
      margin-top: 8px;
      padding: 8px;
      border: 1px solid #1f2937;
      border-radius: 4px;
      background: #0b1220;
      overflow-x: auto;
    }
    .instance-head {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    .instance-body {
      display: grid;
      grid-template-columns: max-content auto;
      gap: 4px 12px;
    }
    .instance-body .label {
      color: #94a3b8;
    }
    .instance-body .value {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: nowrap;
    }
    .override-row[data-overridden] {
      box-shadow: inset 3px 0 0 #f59e0b;
      padding-left: 4px;
    }
    .override-row button.revert {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 3px;
      padding: 0 8px;
      color: #fbbf24;
    }
    .row-name {
      font-weight: 600;
      flex: 1;
    }
    .row-id {
      color: #64748b;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }
    .row-body {
      overflow-x: auto;
      padding: 8px;
      border-top: 1px solid #1f2937;
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 12px;
    }
    .row-body .label {
      color: #94a3b8;
    }
    .row-body .value {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .error {
      color: #fca5a5;
      grid-column: 1 / -1;
      background: #450a0a;
      padding: 4px 6px;
      border-radius: 3px;
    }
    .actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }
    .actions button {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 3px;
      padding: 3px 8px;
      color: #e6e6e6;
    }
    .actions button.danger {
      background: #450a0a;
      border-color: #7f1d1d;
      color: #fecaca;
    }

    .props {
      grid-column: 1 / -1;
      margin-top: 6px;
      border-top: 1px dashed #1f2937;
      padding-top: 6px;
    }
    .props h4 {
      margin: 0 0 4px;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .props-warning {
      color: #fbbf24;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .prop-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 4px;
      margin-bottom: 4px;
    }
    .prop-row input {
      background: #0b1220;
      color: #e6e6e6;
      border: 1px solid #1f2937;
      border-radius: 3px;
      padding: 3px 6px;
      font: inherit;
    }
    .prop-row button {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 3px;
      padding: 0 8px;
      color: #fecaca;
    }

    .event {
      display: grid;
      grid-template-columns: max-content max-content 1fr max-content;
      gap: 8px;
      padding: 4px 6px;
      border-bottom: 1px solid #1f2937;
      align-items: baseline;
    }
    .event .t {
      color: #64748b;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }
    .event .type {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 999px;
      background: #1f2937;
    }
    .event[data-error] .type {
      background: #7f1d1d;
      color: #fecaca;
    }
    .diff {
      margin-left: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      color: #94a3b8;
    }
    .diff-key {
      color: #cbd5e1;
    }
    .diff-from {
      color: #fca5a5;
      text-decoration: line-through;
    }
    .diff-to {
      color: #86efac;
    }

    .override-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 4px;
      margin-bottom: 4px;
    }
    .override-row input {
      background: #0b1220;
      color: #e6e6e6;
      border: 1px solid #1f2937;
      border-radius: 3px;
      padding: 3px 6px;
      font: inherit;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .search {
      width: 100%;
      background: #0b1220;
      color: #e6e6e6;
      border: 1px solid #1f2937;
      border-radius: 3px;
      padding: 4px 6px;
      font: inherit;
      margin-bottom: 6px;
    }

    .empty {
      color: #64748b;
      text-align: center;
      padding: 16px;
    }
  `

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
  #unsubLog: (() => void) | undefined
  #highlighted: HTMLElement | undefined
  #savedOutline: string | undefined

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
      this.#log.push({
        type,
        name: detail?.name ?? '?',
        instanceId: detail?.id,
        timestamp: performance.now(),
        payload: detail,
      })
      this.apps = getAllApps()
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
      this.events = this.#log.entries()
    })
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#unsubLog?.()
    this.#clearHighlight()
  }

  #applyPosition(): void {
    this.setAttribute('data-pos', this.ui.position)
  }

  #updateUi(patch: Partial<UiState>): void {
    this.ui = { ...this.ui, ...patch }
    setUiState(this.ui)
    this.#applyPosition()
  }

  #toggleRow(id: string): void {
    const nextExpanded = new Set(this.expanded)
    if (nextExpanded.has(id)) nextExpanded.delete(id)
    else nextExpanded.add(id)
    this.expanded = nextExpanded
  }

  #findElementsForSpecifier(specifier: string): WcfHostElement[] {
    const escaped = CSS.escape(specifier)
    return Array.from(
      document.querySelectorAll<WcfHostElement>(
        `wcf-mfe[data-mfe-name="${escaped}"], wcf-widget[data-widget-name="${escaped}"]`,
      ),
    )
  }

  #highlightElement(element: HTMLElement): void {
    this.#clearHighlight()
    this.#highlighted = element
    this.#savedOutline = element.style.outline
    element.style.outline = '2px solid #f59e0b'
    element.style.outlineOffset = '2px'
  }

  #clearHighlight(): void {
    if (this.#highlighted) {
      this.#highlighted.style.outline = this.#savedOutline ?? ''
      this.#highlighted.style.outlineOffset = ''
      this.#highlighted = undefined
    }
  }

  #mount(element: WcfHostElement): void {
    void element.mountLifecycle()
  }

  #unmount(element: WcfHostElement): void {
    void element.unmountLifecycle()
  }

  #remount(element: WcfHostElement): void {
    void element.unmountLifecycle().then(() => element.mountLifecycle())
  }

  #editProp(element: HTMLElement, key: string, value: string): void {
    element.setAttribute('data-prop-' + camelToKebab(key), value)
    this.requestUpdate()
  }

  #removeProp(element: HTMLElement, key: string): void {
    element.removeAttribute('data-prop-' + camelToKebab(key))
    this.requestUpdate()
  }

  #addProp(element: HTMLElement, key: string, value: string): void {
    if (!key) return
    this.#editProp(element, key, value)
  }

  #readPropsFromElement(element: HTMLElement): Record<string, string> {
    const props: Record<string, string> = {}
    for (const attr of Array.from(element.attributes)) {
      if (!attr.name.startsWith('data-prop-')) continue
      const key = attr.name
        .slice('data-prop-'.length)
        .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
      props[key] = attr.value
    }
    return props
  }

  #findInstanceForElement(element: HTMLElement): AppRegistryEntry | undefined {
    const wcfId = element.getAttribute('data-wcf-id')
    if (!wcfId) return undefined
    return this.apps.find((app) => app.id === wcfId)
  }

  #saveOverrides(): void {
    setOverrides(this.overrides)
    this.overridesDirty = true
  }

  #addOverride(key: string, value: string): void {
    if (!key) return
    this.overrides = { ...this.overrides, [key]: value }
    this.#saveOverrides()
  }

  #removeOverride(keyToRemove: string): void {
    const remaining: ImportmapOverrides = {}
    for (const [key, value] of Object.entries(this.overrides)) {
      if (key !== keyToRemove) remaining[key] = value
    }
    this.overrides = remaining
    this.#saveOverrides()
  }

  #updateOverride(key: string, value: string): void {
    this.overrides = { ...this.overrides, [key]: value }
    this.#saveOverrides()
  }

  render(): TemplateResult {
    if (this.ui.collapsed) {
      return html`
        <button class="toggle" title="Open WCF devtools" @click=${this.#openPanel}>WCF</button>
      `
    }

    return html`
      <div class="panel" role="dialog" aria-label="WCF devtools">
        ${this.#renderHeader()} ${this.#renderTabs()}
        <div class="body">${this.#renderTabBody()}</div>
      </div>
    `
  }

  #openPanel = (): void => {
    this.#updateUi({ collapsed: false })
  }
  #closePanel = (): void => {
    this.#updateUi({ collapsed: true })
  }

  #renderHeader(): TemplateResult {
    return html`
      <div class="header">
        <span class="title">WCF devtools</span>
        <select
          aria-label="Panel position"
          @change=${(event: Event) => {
            this.#updateUi({
              position: (event.target as HTMLSelectElement).value as UiState['position'],
            })
          }}
        >
          ${(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map(
            (position) =>
              html`<option value=${position} ?selected=${position === this.ui.position}>
                ${position}
              </option>`,
          )}
        </select>
        <button
          @click=${() => {
            resetAll()
            this.overrides = {}
            this.overridesDirty = true
          }}
        >
          Reset
        </button>
        <button @click=${this.#closePanel}>×</button>
      </div>
    `
  }

  #renderTabs(): TemplateResult {
    const tabs: { id: UiState['panel']; label: string }[] = [
      { id: 'apps', label: `Apps (${String(this.apps.length)})` },
      { id: 'events', label: `Events (${String(this.events.length)})` },
      { id: 'overrides', label: `Overrides (${String(Object.keys(this.overrides).length)})` },
    ]
    return html`
      <div class="tabs" role="tablist">
        ${tabs.map(
          (tab) => html`
            <button
              class="tab"
              role="tab"
              aria-selected=${this.ui.panel === tab.id}
              @click=${() => {
                this.#updateUi({ panel: tab.id })
              }}
            >
              ${tab.label}
            </button>
          `,
        )}
      </div>
    `
  }

  #renderTabBody(): TemplateResult {
    if (this.ui.panel === 'apps') return this.#renderApps()
    if (this.ui.panel === 'events') return this.#renderEvents()
    return this.#renderOverrides()
  }

  #renderApps(): TemplateResult {
    const baseSpecifiers = Object.keys(getBaseImports())
    const overrideSpecifiers = Object.keys(this.overrides)
    const instanceSpecifiers = this.apps.map((app) => app.name)
    const allSpecifiers = Array.from(
      new Set([...baseSpecifiers, ...overrideSpecifiers, ...instanceSpecifiers]),
    ).sort()

    if (allSpecifiers.length === 0) {
      return html`<div class="empty">
        Importmap is empty and no instances have been registered.
      </div>`
    }
    return html`${allSpecifiers.map((specifier) => this.#renderSpecifierRow(specifier))}`
  }

  #aggregateStatus(elements: WcfHostElement[]): 'available' | AppRegistryEntry['status'] {
    const statuses = elements.map(
      (element) => this.#findInstanceForElement(element)?.status ?? 'available',
    )
    if (statuses.includes('mounted')) return 'mounted'
    if (statuses.includes('bootstrapped')) return 'bootstrapped'
    if (statuses.includes('registered')) return 'registered'
    return 'available'
  }

  #renderSpecifierRow(specifier: string): TemplateResult {
    const elements = this.#findElementsForSpecifier(specifier)
    const isExpanded = this.expanded.has(specifier)
    const status = this.#aggregateStatus(elements)
    const hasError = elements.some(
      (element) => this.#findInstanceForElement(element)?.lastError !== undefined,
    )
    return html`
      <div class="row">
        <div
          class="row-head"
          @click=${() => {
            this.#toggleRow(specifier)
          }}
        >
          <span class="badge ${status}">${status}</span>
          <span class="row-name">${specifier}</span>
          ${elements.length > 1
            ? html`<span class="row-id">×${String(elements.length)}</span>`
            : nothing}
          ${hasError ? html`<span class="badge error">error</span>` : nothing}
          <span>${isExpanded ? '▾' : '▸'}</span>
        </div>
        ${isExpanded ? this.#renderSpecifierBody(elements) : nothing}
      </div>
    `
  }

  #renderSpecifierBody(elements: WcfHostElement[]): TemplateResult {
    if (elements.length === 0) {
      return html`
        <div class="row-body">
          <div class="empty">
            No <code>&lt;wcf-mfe&gt;</code> / <code>&lt;wcf-widget&gt;</code> in the DOM for this
            specifier.
          </div>
        </div>
      `
    }
    return html`
      <div class="row-body">${elements.map((element) => this.#renderInstanceCard(element))}</div>
    `
  }

  #renderInstanceCard(element: WcfHostElement): TemplateResult {
    const wcfId = element.getAttribute('data-wcf-id') ?? undefined
    const instance = this.#findInstanceForElement(element)
    const status = instance?.status ?? 'available'
    const props = this.#readPropsFromElement(element)
    return html`
      <div
        class="instance"
        @mouseenter=${() => {
          this.#highlightElement(element)
        }}
        @mouseleave=${() => {
          this.#clearHighlight()
        }}
      >
        <div class="instance-head">
          <span class="badge ${status}">${status}</span>
          <span class="row-id">${wcfId ? shortId(wcfId) : '—'}</span>
        </div>
        <div class="instance-body">
          ${instance
            ? html`
                <span class="label">registered</span>
                <span class="value">${formatWallTime(instance.registeredAt)}</span>
                <span class="label">bootstrap</span>
                <span class="value">
                  ${formatDuration(instance.registeredAt, instance.bootstrappedAt)}
                </span>
                <span class="label">mount</span>
                <span class="value">
                  ${formatDuration(instance.bootstrappedAt, instance.mountedAt)}
                </span>
                <span class="label">TTI</span>
                <span class="value">
                  ${formatDuration(instance.registeredAt, instance.mountedAt)}
                </span>
                ${instance.lastError
                  ? html`<div class="error">
                      [${instance.lastError.phase}] ${instance.lastError.message}
                    </div>`
                  : nothing}
              `
            : nothing}
          <div class="actions">
            ${instance
              ? html`
                  <button
                    @click=${() => {
                      this.#remount(element)
                    }}
                  >
                    Remount
                  </button>
                  <button
                    class="danger"
                    @click=${() => {
                      this.#unmount(element)
                    }}
                  >
                    Unmount
                  </button>
                `
              : html`<button
                  @click=${() => {
                    this.#mount(element)
                  }}
                >
                  Mount
                </button>`}
          </div>
          ${instance ? this.#renderProps(element, instance.supportsUpdate, props) : nothing}
        </div>
      </div>
    `
  }

  #renderProps(
    element: HTMLElement,
    supportsUpdate: boolean,
    props: Record<string, string>,
  ): TemplateResult {
    return html`
      <div class="props">
        <h4>Props</h4>
        ${supportsUpdate
          ? nothing
          : html`<div class="props-warning">
              This MFE doesn't implement update() — edits won't take effect.
            </div>`}
        ${Object.entries(props).map(
          ([key, value]) => html`
            <div class="prop-row">
              <input readonly value=${key} />
              <input
                .value=${value}
                @change=${(event: Event) => {
                  this.#editProp(element, key, (event.target as HTMLInputElement).value)
                }}
              />
              <button
                @click=${() => {
                  this.#removeProp(element, key)
                }}
              >
                ×
              </button>
            </div>
          `,
        )}
        ${this.#renderAddProp(element)}
      </div>
    `
  }

  #renderAddProp(element: HTMLElement): TemplateResult {
    let draftKey = ''
    let draftValue = ''
    return html`
      <div class="prop-row">
        <input
          placeholder="newKey (camelCase)"
          @input=${(event: Event) => {
            draftKey = (event.target as HTMLInputElement).value
          }}
        />
        <input
          placeholder="value"
          @input=${(event: Event) => {
            draftValue = (event.target as HTMLInputElement).value
          }}
        />
        <button
          @click=${(event: Event) => {
            this.#addProp(element, draftKey, draftValue)
            const row = (event.target as HTMLElement).parentElement
            row?.querySelectorAll('input').forEach((input) => (input.value = ''))
            draftKey = ''
            draftValue = ''
          }}
        >
          +
        </button>
      </div>
    `
  }

  #renderEvents(): TemplateResult {
    const query = this.search.toLowerCase()
    const filtered = this.events.filter(
      (entry) =>
        !query ||
        entry.name.toLowerCase().includes(query) ||
        entry.type.toLowerCase().includes(query),
    )
    return html`
      <input
        class="search"
        placeholder="Search events..."
        .value=${this.search}
        @input=${(event: Event) => (this.search = (event.target as HTMLInputElement).value)}
      />
      <div>
        <button
          style="background:#1f2937;color:#e6e6e6;border:1px solid #374151;border-radius:3px;padding:3px 8px;margin-bottom:6px"
          @click=${() => {
            this.#log.clear()
          }}
        >
          Clear
        </button>
      </div>
      ${filtered.length === 0
        ? html`<div class="empty">No events.</div>`
        : html`${filtered
            .slice()
            .reverse()
            .map(
              (entry) => html`
                <div class="event" ?data-error=${entry.type === 'ERROR'}>
                  <span class="t">${formatWallTime(entry.timestamp)}</span>
                  <span class="type">${entry.type}</span>
                  <span>${entry.name}${renderEventSummary(entry)}</span>
                  <span class="row-id"> ${entry.instanceId ? shortId(entry.instanceId) : ''} </span>
                </div>
              `,
            )}`}
    `
  }

  #renderOverrides(): TemplateResult {
    const baseImports = getBaseImports()
    const baseSpecifiers = Object.keys(baseImports)
    const overrideSpecifiers = Object.keys(this.overrides)
    const allSpecifiers = Array.from(new Set([...baseSpecifiers, ...overrideSpecifiers])).sort()

    return html`
      ${this.overridesDirty
        ? html`
            <div class="banner">
              <span>Reload to apply importmap changes.</span>
              <button
                @click=${() => {
                  location.reload()
                }}
              >
                Reload
              </button>
            </div>
          `
        : nothing}
      ${allSpecifiers.length === 0
        ? html`<div class="empty">Importmap is empty. Add a specifier below.</div>`
        : allSpecifiers.map((specifier) => this.#renderOverrideRow(specifier, baseImports))}
      ${this.#renderAddOverride()}
    `
  }

  #renderOverrideRow(specifier: string, baseImports: Record<string, string>): TemplateResult {
    const isOverridden = Object.hasOwn(this.overrides, specifier)
    const isCustom = !Object.hasOwn(baseImports, specifier)
    const currentUrl = isOverridden
      ? this.overrides[specifier]
      : isCustom
        ? ''
        : baseImports[specifier]
    return html`
      <div class="override-row" ?data-overridden=${isOverridden}>
        <input readonly value=${specifier} />
        <input
          .value=${currentUrl}
          @change=${(event: Event) => {
            this.#updateOverride(specifier, (event.target as HTMLInputElement).value)
          }}
        />
        ${isOverridden
          ? html`<button
              class="revert"
              title=${isCustom ? 'Remove this specifier' : 'Revert to base URL'}
              @click=${() => {
                this.#removeOverride(specifier)
              }}
            >
              ${isCustom ? '×' : '↺'}
            </button>`
          : html`<span></span>`}
      </div>
    `
  }

  #renderAddOverride(): TemplateResult {
    let draftKey = ''
    let draftValue = ''
    return html`
      <div class="override-row">
        <input
          placeholder="specifier (e.g. @mfe/vue-one)"
          @input=${(event: Event) => {
            draftKey = (event.target as HTMLInputElement).value
          }}
        />
        <input
          placeholder="url (e.g. https://.../entry.js)"
          @input=${(event: Event) => {
            draftValue = (event.target as HTMLInputElement).value
          }}
        />
        <button
          @click=${(event: Event) => {
            this.#addOverride(draftKey, draftValue)
            const row = (event.target as HTMLElement).parentElement
            row?.querySelectorAll('input').forEach((input) => (input.value = ''))
            draftKey = ''
            draftValue = ''
          }}
        >
          +
        </button>
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
