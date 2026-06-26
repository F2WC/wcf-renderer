import { LitElement, html, css } from 'lit'
import type { AppRegistryEntry } from 'web-component-framework-renderer-sdk'
import { tokens } from '@/styles/tokens.css.js'
import { reset } from '@/styles/reset.css.js'
import { shortId, formatDuration } from '@/utils/format.js'

class TimelinePanel extends LitElement {
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

      .legend {
        display: flex;
        align-items: center;
        gap: var(--dt-space-3);
        margin-bottom: var(--dt-space-2);
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-secondary);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .legend-swatch {
        width: 10px;
        height: 10px;
        border-radius: var(--dt-radius-xs);
        flex-shrink: 0;
      }

      .legend-swatch.bootstrap {
        background: var(--dt-c-bootstrapped-text);
        opacity: 0.65;
      }

      .legend-swatch.mount {
        background: var(--dt-c-mounted-text);
        opacity: 0.7;
      }

      .legend-max {
        margin-left: auto;
        font-family: var(--dt-font-mono), monospace;
        color: var(--dt-text-muted);
      }

      .group-header {
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        padding: var(--dt-space-2) 0 4px;
        border-bottom: 1px solid var(--dt-border-subtle);
        margin-bottom: 4px;
      }

      .timeline-row {
        display: grid;
        grid-template-columns: 130px 1fr 54px;
        align-items: center;
        gap: var(--dt-space-2);
        padding: 5px 0;
        border-bottom: 1px solid var(--dt-border-subtle);
      }

      .timeline-row:last-child {
        border-bottom: none;
      }

      .row-label {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .mfe-name {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--dt-text-primary);
      }

      .instance-id {
        font-family: var(--dt-font-mono), monospace;
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
      }

      .timeline-track {
        height: 14px;
        display: flex;
        border-radius: var(--dt-radius-xs);
        background: var(--dt-bg-chip);
        overflow: hidden;
        position: relative;
      }

      .bar {
        height: 100%;
        min-width: 2px;
        transition: width var(--dt-dur-sm) var(--dt-ease);
      }

      .bar.bootstrap {
        background: var(--dt-c-bootstrapped-text);
        opacity: 0.55;
      }

      .bar.mount {
        background: var(--dt-c-mounted-text);
        opacity: 0.65;
      }

      .bar.error {
        background: var(--dt-danger-text);
        opacity: 0.7;
      }

      .track-pending {
        display: flex;
        align-items: center;
        padding: 0 6px;
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-muted);
      }

      .row-tti {
        font-family: var(--dt-font-mono), monospace;
        font-size: var(--dt-font-size-xs);
        color: var(--dt-text-secondary);
        text-align: right;
        white-space: nowrap;
      }

      .row-tti.fast {
        color: var(--dt-c-mounted-text);
      }

      .row-tti.slow {
        color: var(--dt-warn-text);
      }
    `,
  ]

  static properties = {
    apps: { type: Array },
  }

  declare apps: AppRegistryEntry[]

  constructor() {
    super()
    this.apps = []
  }

  #maxTTI(): number {
    let max = 0
    for (const app of this.apps) {
      if (!app.registeredAt) continue
      const end = app.mountedAt ?? app.bootstrappedAt ?? app.registeredAt
      max = Math.max(max, end - app.registeredAt)
    }
    return max || 1
  }

  #ttiClass(ms: number, maxMs: number): string {
    if (ms <= 0) return ''
    const ratio = ms / maxMs
    if (ratio < 0.33) return 'fast'
    if (ratio > 0.75) return 'slow'
    return ''
  }

  #renderRow(app: AppRegistryEntry, maxMs: number) {
    const hasError = !!app.lastError
    const bootstrapMs =
      app.registeredAt && app.bootstrappedAt ? app.bootstrappedAt - app.registeredAt : 0
    const mountMs = app.bootstrappedAt && app.mountedAt ? app.mountedAt - app.bootstrappedAt : 0
    const totalMs = bootstrapMs + mountMs

    const bootstrapPct = (bootstrapMs / maxMs) * 100
    const mountPct = (mountMs / maxMs) * 100

    const trackContent =
      totalMs === 0
        ? html`<span class="track-pending">pending…</span>`
        : html`
            <div
              class="bar bootstrap ${hasError ? 'error' : ''}"
              style="width: ${bootstrapPct.toFixed(2)}%"
              title="Bootstrap: ${formatDuration(bootstrapMs)}"
            ></div>
            <div
              class="bar mount ${hasError ? 'error' : ''}"
              style="width: ${mountPct.toFixed(2)}%"
              title="Mount: ${formatDuration(mountMs)}"
            ></div>
          `

    return html`
      <div class="timeline-row">
        <div class="row-label">
          <span class="mfe-name" title="${app.name}">${app.name}</span>
          <span class="instance-id">${shortId(app.id)}</span>
        </div>
        <div class="timeline-track">${trackContent}</div>
        <div class="row-tti ${this.#ttiClass(totalMs, maxMs)}">
          ${totalMs > 0 ? formatDuration(totalMs) : '—'}
        </div>
      </div>
    `
  }

  render() {
    if (this.apps.length === 0) {
      return html`
        <div class="empty">
          <span class="empty-icon">⏱</span>
          <span>No MFE instances recorded yet.</span>
        </div>
      `
    }

    const byName = new Map<string, AppRegistryEntry[]>()
    for (const app of this.apps) {
      const list = byName.get(app.name) ?? []
      list.push(app)
      byName.set(app.name, list)
    }

    const maxMs = this.#maxTTI()
    const multiGroup = byName.size > 1

    return html`
      <div class="legend">
        <span class="legend-item"> <span class="legend-swatch bootstrap"></span>Bootstrap </span>
        <span class="legend-item"> <span class="legend-swatch mount"></span>Mount </span>
        <span class="legend-max">max ${formatDuration(maxMs)}</span>
      </div>
      ${[...byName.entries()].map(
        ([name, instances]) => html`
          ${multiGroup ? html`<div class="group-header">${name}</div>` : ''}
          ${instances.map((app) => this.#renderRow(app, maxMs))}
        `,
      )}
    `
  }
}

if (!customElements.get('wcf-timeline-panel')) {
  customElements.define('wcf-timeline-panel', TimelinePanel)
}
