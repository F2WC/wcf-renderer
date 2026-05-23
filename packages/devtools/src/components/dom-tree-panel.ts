import { LitElement, html, css } from 'lit'
import type { AppRegistryEntry, WcfHostElement } from 'web-component-framework-renderer-sdk'
import { tokens } from '@/styles/tokens.css.js'
import { reset } from '@/styles/reset.css.js'
import { highlightElement, clearHighlight } from '@/utils/dom.js'
import { shortId } from '@/utils/format.js'
import type { DomEntry } from '@/types/dom-tree-panel.ts'

function getWcfAncestors(
  el: WcfHostElement,
  wcfSet: Set<WcfHostElement>,
): { depth: number; parent: WcfHostElement | undefined } {
  let depth = 0
  let parent: WcfHostElement | undefined
  let node: Element | null = el.parentElement

  while (node) {
    if (wcfSet.has(node as WcfHostElement)) {
      depth++
      parent ??= node as WcfHostElement
    }
    node = node.parentElement
  }

  return { depth, parent }
}

function toTreeOrder(entries: DomEntry[]): DomEntry[] {
  const result: DomEntry[] = []
  const childrenOf = (parent: WcfHostElement) =>
    entries
      .filter((e) => e.wcfParent === parent)
      .sort((a, b) => a.specifier.localeCompare(b.specifier))

  function visit(entry: DomEntry) {
    result.push(entry)
    for (const child of childrenOf(entry.element)) visit(child)
  }

  const roots = entries
    .filter((e) => !e.wcfParent)
    .sort((a, b) => a.specifier.localeCompare(b.specifier))
  for (const root of roots) visit(root)

  return result
}

class DomTreePanel extends LitElement {
  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
        padding: var(--dt-space-2);
        font-size: var(--dt-font-size-sm);
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        gap: 6px;
        color: var(--dt-text-muted);
        text-align: center;
      }

      .empty-icon {
        font-size: 1.6rem;
        opacity: 0.4;
        line-height: 1;
      }

      .route-bar {
        display: flex;
        align-items: center;
        gap: var(--dt-space-2);
        background: var(--dt-bg-row);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-sm);
        padding: 5px 8px;
        margin-bottom: var(--dt-space-2);
        font-size: var(--dt-font-size-xs);
      }

      .route-label {
        color: var(--dt-text-muted);
        flex-shrink: 0;
      }

      .route-path {
        font-family: var(--dt-font-mono), monospace;
        color: var(--dt-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tree-entry {
        border: 1px solid var(--dt-border-subtle);
        border-radius: var(--dt-radius-sm);
        background: var(--dt-bg-panel);
        margin-bottom: var(--dt-space-1);
        overflow: hidden;
        cursor: default;
        transition: border-color var(--dt-dur-xs) var(--dt-ease);
      }

      .tree-entry:hover {
        border-color: var(--dt-border);
      }

      .entry-head {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 6px 8px;
      }

      .depth-indent {
        display: flex;
        align-items: center;
        gap: 3px;
        flex-shrink: 0;
      }

      .depth-pip {
        width: 3px;
        height: 14px;
        border-radius: 2px;
        background: var(--dt-border);
        flex-shrink: 0;
      }

      .tag-chip {
        font-family: var(--dt-font-mono), monospace;
        font-size: var(--dt-font-size-xs);
        color: var(--dt-accent);
        background: var(--dt-accent-dim);
        border-radius: var(--dt-radius-xs);
        padding: 1px 5px;
        flex-shrink: 0;
      }

      .specifier-name {
        flex: 1;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--dt-text-primary);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 1px 6px;
        border-radius: 999px;
        font-size: var(--dt-font-size-xs);
        font-weight: 500;
        flex-shrink: 0;
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

      .badge.error {
        background: var(--dt-danger-bg);
        color: var(--dt-danger-text);
      }

      .entry-parent {
        padding: 0 8px 6px calc(8px + var(--depth-offset, 0px));
        font-size: var(--dt-font-size-xs);
        font-family: var(--dt-font-mono), monospace;
        color: var(--dt-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .entry-parent-arrow {
        color: var(--dt-text-muted);
        margin-right: 3px;
      }

      .entry-parent-name {
        color: var(--dt-accent);
      }

      .instance-id {
        font-family: var(--dt-font-mono), monospace;
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
        flex-shrink: 0;
      }

      .refresh-btn {
        background: none;
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        padding: 3px 8px;
        font: inherit;
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-secondary);
        cursor: pointer;
      }

      .refresh-btn:hover {
        color: var(--dt-text-primary);
        border-color: var(--dt-accent);
      }

      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--dt-space-2);
      }

      .count-label {
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
      }
    `,
  ]

  static properties = {
    apps: { type: Array },
    _entries: { state: true },
  }

  declare apps: AppRegistryEntry[]
  declare _entries: DomEntry[]

  constructor() {
    super()
    this.apps = []
    this._entries = []
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.#scanDom()
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('apps')) this.#scanDom()
  }

  #scanDom(): void {
    const found = Array.from(document.querySelectorAll<WcfHostElement>('wcf-mfe, wcf-widget'))
    const wcfSet = new Set(found)

    this._entries = found.map((el) => {
      const specifier =
        el.getAttribute('data-mfe-name') ??
        el.getAttribute('data-widget-name') ??
        el.tagName.toLowerCase()
      const wcfId = el.getAttribute('data-wcf-id')
      const instance = wcfId ? this.apps.find((a) => a.id === wcfId) : undefined
      const { depth, parent } = getWcfAncestors(el, wcfSet)

      return {
        element: el,
        specifier,
        wcfDepth: depth,
        wcfParent: parent,
        instance,
      }
    })
  }

  #renderEntry(entry: DomEntry) {
    const status = entry.instance?.unmountedAt
      ? 'unmounted'
      : (entry.instance?.status ?? 'registered')
    const hasError = !!entry.instance?.lastError
    const tagName = entry.element.tagName.toLowerCase()
    const depthPips = Math.min(entry.wcfDepth, 5)

    return html`
      <div
        class="tree-entry"
        @mouseenter=${() => {
          highlightElement(entry.element)
        }}
        @mouseleave=${() => {
          clearHighlight()
        }}
      >
        <div class="entry-head">
          ${depthPips > 0
            ? html`<div class="depth-indent">
                ${Array.from({ length: depthPips }, () => html`<div class="depth-pip"></div>`)}
              </div>`
            : ''}
          <span class="tag-chip">&lt;${tagName}&gt;</span>
          <span class="specifier-name" title="${entry.specifier}">${entry.specifier}</span>
          ${entry.instance
            ? html`<span class="instance-id">${shortId(entry.instance.id)}</span>`
            : ''}
          <span class="badge ${hasError ? 'error' : status}">${hasError ? 'error' : status}</span>
        </div>
      </div>
    `
  }

  render() {
    const route = window.location.pathname + window.location.search

    if (this._entries.length === 0 && this.apps.length === 0) {
      return html`
        <div class="empty">
          <span class="empty-icon">🌳</span>
          <span>No wcf-mfe or wcf-widget elements in the DOM.</span>
        </div>
      `
    }

    const sorted = toTreeOrder(this._entries)

    return html`
      <div class="route-bar">
        <span class="route-label">route</span>
        <span class="route-path">${route}</span>
      </div>
      <div class="toolbar">
        <span class="count-label"
          >${sorted.length} element${sorted.length !== 1 ? 's' : ''} found</span
        >
        <button
          class="refresh-btn"
          @click=${() => {
            this.#scanDom()
          }}
        >
          ↻ Refresh
        </button>
      </div>
      ${sorted.length === 0
        ? html`<div class="empty"><span>No elements found in the current DOM.</span></div>`
        : sorted.map((entry) => this.#renderEntry(entry))}
    `
  }
}

if (!customElements.get('wcf-dom-tree-panel')) {
  customElements.define('wcf-dom-tree-panel', DomTreePanel)
}
