# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start all dev servers via Docker Compose (installs deps, builds packages, starts Vite watchers + Caddy)
npm run dev                      # alias for: docker-compose up --build

# Build all packages (Lerna)
npm run build

# Lint (ESLint + Prettier check)
npm run lint:script

# Auto-fix lint issues
npm run lint:script:fix

# Build a single package
npm run build --workspace=packages/sdk
npm run build --workspace=packages/devtools
```

**Dev environment is Docker-only.** `npm run dev` spins up:

- `installer` — one-shot `npm install` into a shared volume
- `sdk`, `shell-package`, `devtools`, `vite-plugin-wcf-react` — package watchers (each waits for its deps to be healthy via dist file healthchecks)
- `mfe-vue-one` (port 5174), `mfe-react-one` (port 5175), `shell-app` (port 5173) — Vite dev servers
- `caddy` — reverse proxy on **http://localhost:8080** routing all traffic:
  - `/mfe/vue/*` → `mfe-vue-one:5174`
  - `/mfe/react/*` → `mfe-react-one:5175`
  - everything else → `shell-app:5173`
  - `/importmap.json` → static file from `playground/caddy/srv/`

`node_modules` for each workspace are isolated in named Docker volumes so host installs don't conflict.

Tests are not yet implemented (`test` scripts are no-ops). Roadmap includes Vitest (unit) and Playwright (E2E).

## Architecture

**Monorepo** using npm workspaces + Lerna (build orchestration + versioning/publishing).

### Package Overview

```
packages/
  sdk/        → Core SDK: wraps any framework as a Web Component
  shell/      → Router: URL-based MFE routing and orchestration
  devtools/   → In-page devtools panel (Lit-based Web Component)

playground/
  shell/          → App Shell host app (Vite, internal port 5173)
  mfe-vue-one/    → Vue MFE example (Vite, internal port 5174)
  mfe-react-one/  → React MFE example (Vite, internal port 5175)
  caddy/          → Reverse proxy config; serves everything on http://localhost:8080
```

### Core Concept

Each MFE:

1. Calls `createMfe(appFactory, options)` from `packages/sdk`
2. Returns and exports lifecycle functions: `{ name, register, bootstrap, mount, unmount }`
3. Is registered as a native Custom Element (e.g. `<mfe-vue-one>`)

The App Shell uses `createRouter(routes, loadApp)` from `packages/shell` to match URLs to MFEs, dynamically import them via import maps, and call their lifecycle functions.

### SDK (`packages/sdk`)

- **`createMfe(appFactory, options)`** — Main API. Returns `ExternalLifecycleFunctions`.
- **`src/core/lifecycle-orchestrator.ts`** — Builds the external lifecycle API (register, bootstrap, mount, unmount).
- **`src/components/mfe-component.ts`** — Custom HTMLElement class. Implements `connectedCallback`/`disconnectedCallback` to drive the MFE lifecycle. Uses WeakMap for per-element state.
- **`src/components/widget-component.ts`** — `<wcf-widget>` for dynamic widget loading via `data-widget-name`.
- **`src/core/createEventBus.ts`** — Generic type-safe event bus; `MFE_EVENTS` (REGISTERED, BOOTSTRAPPED, MOUNTED, UNMOUNTED) are dispatched as window-level `CustomEvent`s.
- **`src/utils/props.ts`** — Parses JSON props from element `dataset`.
- **`src/utils/dom.ts`** — Creates CSS preload/link elements for MFE stylesheets.
- **`src/types/index.ts`** — All key TypeScript types: `LifecycleFunctions`, `AppFactory`, `Options`, `ComponentAttributes`, etc.

### Devtools (`packages/devtools`)

Built with [Lit](https://lit.dev/). Mounts as a fixed overlay `<wcf-devtools>` custom element.

**Public API (via `packages/devtools/src/index.ts`)**

- **`mountDevtools(options?)`** — Appends `<wcf-devtools>` to the target element (default: `document.body`). Returns an unmount handle. Idempotent.
- **`installImportmapHook()`** — Returns a `(raw: string) => string` transform for the shell's `transformImportmap` hook. Captures the base importmap and merges persisted overrides.

**Internal structure**

```
src/
  index.ts            → public API
  importmap-hook.ts   → importmap transform + base snapshot
  state/
    event-log.ts      → EventLog class (ring buffer, subscribe/push/clear)
    storage.ts        → localStorage helpers for overrides + UI state
  utils/
    format.ts         → shortId, formatWallTime, formatDuration, camelToKebab, previewValue
    dom.ts            → element queries, highlight/clearHighlight
    props.ts          → read/edit/add/remove data-prop-* attributes
  styles/
    tokens.css.ts     → CSS custom properties (colors, spacing, radii, motion, type)
    reset.css.ts      → shared :host reset + button/input base
  components/
    devtools-panel.ts → root LitElement — state owner, event wiring
    devtools-header.ts
    devtools-tabs.ts
    apps-panel.ts     → specifier list
    specifier-row.ts  → collapsible row per import specifier
    instance-card.ts  → per-element timing, actions, props
    props-editor.ts   → props list with @state draft inputs
    events-panel.ts   → filtered event log
    overrides-panel.ts
    override-row.ts   → single importmap override entry
  panel.ts            → thin barrel re-exporting defineDevtoolsElement + DEVTOOLS_TAG
```

**Architecture pattern**: root component owns all state; child components are presentational — state flows down as properties, mutations flow up as custom DOM events (`wcf:tab-select`, `wcf:ui-update`, `wcf:prop-edit`, `wcf:override-update`, etc.).

**Devtools commands**

```bash
npm run build --workspace=packages/devtools
```

### Shell (`packages/shell`)

- **`createRouter(routes, loadApp)`** — Matches current URL to a route, dynamically imports the MFE module, and calls `register() → bootstrap() → mount()`. Uses `path-to-regexp` for matching.
- Routes support: `path`, `name`, `widgets[]`, `beforeEnter/afterEnter` hooks, `children`.

### MFE Lifecycle Flow

```
App Shell (router) → dynamic import (import map)
  → MFE calls register()       → defines custom element
  → router creates element     → document.createElement(name)
  → bootstrap()                → one-time init
  → mount(rootContainer)       → renders framework app
  → unmount()                  → cleanup on route leave
```

### TypeScript Conventions

- Path alias: `@/*` → `./src/*` in both SDK and shell packages
- Module resolution: `NodeNext`
- Private class fields: `#fieldName` for encapsulation
- `MaybePromise<T>` pattern for all lifecycle functions (can be sync or async)
- Build: `tsup` (ESM + CJS output + `.d.ts` declarations)

### Code Style

- No semicolons, single quotes, 100-char line width (see `.prettierrc.json`)
- ESLint configured in `eslint.config.mjs`
