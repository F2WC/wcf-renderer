import { LitElement, html, css } from 'lit'
import { tokens } from '../styles/tokens.css.ts'
import { reset } from '../styles/reset.css.ts'
import { formatWallTime, shortId, renderEventSummary } from '../utils/format.ts'
import { LogEntry } from '../state/event-log.ts'

class EventsPanel extends LitElement {
  static styles = [
    tokens,
    reset,
    css`
      :host {
        display: block;
        padding: var(--dt-space-2);
      }

      .toolbar {
        display: flex;
        gap: var(--dt-space-2);
        margin-bottom: var(--dt-space-2);
        align-items: center;
      }

      .search-input {
        flex: 1;
        width: 100%;
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

      .clear-btn {
        background: var(--dt-bg-chip);
        border: 1px solid var(--dt-border);
        border-radius: var(--dt-radius-xs);
        padding: 3px 10px;
        font: inherit;
        font-size: var(--dt-font-size-sm);
        color: var(--dt-text-primary);
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .clear-btn:hover {
        opacity: 0.85;
      }

      .events-list {
        display: flex;
        flex-direction: column;
      }

      .event {
        display: grid;
        grid-template-columns: max-content max-content 1fr max-content;
        gap: 8px;
        padding: 4px 6px;
        border-bottom: 1px solid var(--dt-border-subtle);
        align-items: baseline;
      }

      .event:hover {
        background: var(--dt-bg-chip);
      }

      .t {
        font-family: var(--dt-font-mono);
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
        white-space: nowrap;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 1px 6px;
        border-radius: 999px;
        font-size: var(--dt-font-size-xs);
        font-weight: 500;
        background: var(--dt-bg-chip);
        color: var(--dt-text-secondary);
        white-space: nowrap;
        font-family: var(--dt-font-mono);
        letter-spacing: 0;
      }

      .type-badge.registered {
        background: var(--dt-c-registered-bg);
        color: var(--dt-c-registered-text);
      }
      .type-badge.bootstrapped {
        background: var(--dt-c-bootstrapped-bg);
        color: var(--dt-c-bootstrapped-text);
      }
      .type-badge.mounted {
        background: var(--dt-c-mounted-bg);
        color: var(--dt-c-mounted-text);
      }
      .type-badge.updated {
        background: var(--dt-c-updated-bg);
        color: var(--dt-c-updated-text);
      }
      .type-badge.unmounted {
        background: var(--dt-c-unmounted-bg);
        color: var(--dt-c-unmounted-text);
      }
      .type-badge.error-type {
        background: var(--dt-c-error-bg, var(--dt-danger-bg));
        color: var(--dt-c-error-text, var(--dt-danger-text));
      }

      @keyframes event-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .event:first-child {
        animation: event-in var(--dt-dur-sm) var(--dt-ease) both;
      }

      .event-name {
        font-size: var(--dt-font-size-sm);
        display: flex;
        align-items: baseline;
        gap: 4px;
        flex-wrap: wrap;
        min-width: 0;
        overflow: hidden;
      }

      .instance-id {
        font-family: var(--dt-font-mono);
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
        white-space: nowrap;
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        gap: 8px;
        color: var(--dt-text-muted);
        font-size: var(--dt-font-size-sm);
      }

      .empty-icon {
        font-size: 1.5rem;
        opacity: 0.4;
        line-height: 1;
      }

      .diff {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 4px 6px;
        align-items: baseline;
        font-family: var(--dt-font-mono);
        font-size: var(--dt-font-size-xs);
      }

      .diff-key {
        color: var(--dt-diff-key);
      }

      .diff-from {
        color: var(--dt-diff-from);
        text-decoration: line-through;
        opacity: 0.8;
      }

      .diff-to {
        color: var(--dt-diff-to);
      }
    `,
  ]

  static properties = {
    events: { type: Array },
    search: { type: String },
  }

  declare events: readonly LogEntry[]
  declare search: string

  constructor() {
    super()
    this.events = []
    this.search = ''
  }

  #onSearchInput = (e: Event) => {
    const input = e.target as HTMLInputElement
    this.dispatchEvent(
      new CustomEvent('wcf:search', {
        bubbles: true,
        composed: true,
        detail: { query: input.value },
      }),
    )
  }

  #onClear = () => {
    this.dispatchEvent(
      new CustomEvent('wcf:events-clear', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  #eventTypeClass(type: string): string {
    switch (type) {
      case 'MFE:REGISTERED':
        return 'registered'
      case 'MFE:BOOTSTRAPPED':
        return 'bootstrapped'
      case 'MFE:MOUNTED':
        return 'mounted'
      case 'MFE:UPDATED':
        return 'updated'
      case 'MFE:UNMOUNTED':
        return 'unmounted'
      case 'ERROR':
        return 'error-type'
      default:
        return ''
    }
  }

  #shortType(type: string): string {
    return type.startsWith('MFE:') ? type.slice(4) : type
  }

  #filteredEvents(): LogEntry[] {
    const q = this.search.trim().toLowerCase()
    const all = [...this.events].reverse()
    if (!q) return all
    return all.filter((e) => e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q))
  }

  render() {
    const filtered = this.#filteredEvents()

    return html`
      <div class="toolbar">
        <input
          class="search-input"
          type="text"
          placeholder="Filter by name or type…"
          .value=${this.search}
          @input=${this.#onSearchInput}
        />
        <button class="clear-btn" @click=${this.#onClear}>Clear</button>
      </div>

      ${filtered.length === 0
        ? html`
            <div class="empty">
              <span class="empty-icon">○</span>
              <span>No events yet</span>
            </div>
          `
        : html`
            <div class="events-list">
              ${filtered.map(
                (entry) => html`
                  <div class="event">
                    <span class="t">${formatWallTime(entry.timestamp)}</span>
                    <span class="type-badge ${this.#eventTypeClass(entry.type)}">
                      ${this.#shortType(entry.type)}
                    </span>
                    <span class="event-name"> ${entry.name} ${renderEventSummary(entry)} </span>
                    <span class="instance-id">
                      ${entry.instanceId ? shortId(entry.instanceId) : ''}
                    </span>
                  </div>
                `,
              )}
            </div>
          `}
    `
  }
}

customElements.define('wcf-events-panel', EventsPanel)
