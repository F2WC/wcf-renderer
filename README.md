# Web Component Framework Renderer

> [!WARNING]  
> This project is still under heavy development and not yet feature complete. The description does not match the current
> capabilities that have been implemented yet. Check the roadmap to see the current progress.

A tiny SDK and set of conventions for rendering multiple front-end frameworks (React, Vue, and in the future
Angular and others) side‑by‑side on the same web page via Web Components/Micro‑Frontend (MFE) patterns.

The goal is to make each framework-specific MFE look and behave like a normal Custom Element while being orchestrated
by a lightweight App Shell. This enables incremental migration, mixed‑stack feature teams, and independent deployment.

## Highlights

- Framework‑agnostic rendering surface powered by Web Components
- Works with multiple frameworks (React, Vue; Angular and others planned)
- Vite + TypeScript developer experience

> Status: Early/experimental. APIs may change frequently until the first stable release.

## How it works (high level)

- Each MFE is packaged with the SDK and exposes itself as a Custom Element (e.g., `<react-profile-card>` or `<vue-comments-list>`).
- The App Shell mounts/unmounts these elements, supplies props/context, and wires up navigation and cross‑MFE communication.
- Under the hood, the SDK adapts the target framework to the Web Component lifecycle without leaking framework details to the Shell or to other MFEs.

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+

### Clone

```bash
git clone <repository-url>
cd web-component-framework-renderer
```

### Install dependencies

```bash
npm install
```

### Run the local dev stack

```bash
npm run dev
```

- App Shell: http://localhost:5173
- Vue MFE module entry: http://localhost:5174/src/entry.ts
- React MFE module entry: http://localhost:5175/src/entry.jsx
- Stop with `Ctrl+C`.

### Develop

The recommended way to develop is local-only with Nx orchestration. One command starts all required watchers/servers:

- `packages/sdk` builds in watch mode
- `packages/shell` builds in watch mode
- `playground/mfe-vue-one` and `playground/mfe-react-one` run Vite dev servers
- `playground/shell` runs Vite dev server with auto-reload

Typical flow:

1. Start with `npm run dev`.
2. Edit code in your IDE; changes are picked up automatically.

Tips:

- Keep all dev servers on fixed ports (`5173`, `5174`, `5175`).
- Import maps are environment-driven in `playground/shell/.env`.

### Lint & Format

```bash
npm run lint:script
```

```bash
npm run lint:script:fix
```

## Roadmap / TODO

This is a living roadmap, nothing here is set in stone that it will come, but most likely there is still a lot of stuff
missing in this list for example proper SSR support. First i want to focus on the MVP and continue from there.

SDK

1. [ ] Define a clear MFE contract: attributes/props schema, events, and lifecycle signatures; versioned and documented.
2. [ ] Extend the type‑safe event bus with namespacing and wildcard listeners (the base implementation exists).
3. [ ] Expose a Vite plugin that generates an import map for the project containing entry files for JS and CSS.
4. [x] Add an application registry API: `getMountedApps()`, `getAppStatus()`, `getAppNames()` for runtime introspection.
5. [ ] Add structured lifecycle error handling: pluggable error handlers for bootstrap/mount/unmount failures.
6. [ ] Add lifecycle timeouts: configurable max durations for bootstrap, mount, and unmount.
7. [ ] Explore CSS isolation strategies (Shadow DOM, CSS layers, scoped selectors).
8. [x] Make lifecycle functions MaybePromise
9. [x] Move CSS links to head and also add preload
10. [x] Remove CSS when MFE unmounts

Shell / Router

1. [ ] Build out the programmatic router API (similar to Vue Router's `createRouter()`): typed route definitions with nested routes, guards (`beforeEnter`/`afterEnter`), named routes, and lazy‑loaded MFE resolvers — usable standalone without any HTML layout.
2. [ ] Add a navigation helper: `navigateToUrl()` for programmatic cross‑MFE navigation.
3. [ ] Add loading state support: show a placeholder while an MFE module is being fetched.
4. [ ] Add 404/fallback route handling: a dedicated "not found" route or default fallback.
5. [ ] Add `import-map-overrides` integration or equivalent dev override mechanism (run one MFE locally while using deployed versions of others).

Layout Engine

The layout engine is a higher‑level companion to the programmatic router. It parses a declarative HTML template and converts it into a router configuration, then hands it off to the programmatic router to drive navigation and mounting.

1. [ ] Implement HTML template parsing: read `<wcf-router>` and `<wcf-route path="...">` elements, extract `<wcf-mfe>` children per route, and produce a typed route config compatible with the programmatic router.
2. [ ] Support inline loading, error, and 404 slots directly in the HTML template (e.g. `<template slot="loading">`, `<template slot="error">`).
3. [ ] Mount the layout engine's generated router into a target container; the programmatic router then owns all navigation from that point on.

Monorepo and Repository

1. [x] Split the repo into `packages/` with at least `sdk/` and `shell/`.
2. [x] Enable workspaces and a monorepo tool (Lerna) for builds, versioning, and pipelines.
3. [x] Update the repository to include all project files, not just the SDK.

Quality, Tooling, and Operations

1. [ ] Add E2E tests (Playwright) to verify multi‑framework rendering, navigation, and cross‑MFE events.
2. [ ] Add unit tests for SDK adapters and Web Component lifecycle (Vitest).
3. [ ] Set performance budgets and a lazy‑loading strategy per route/MFE; prefetch/module federation where applicable.
4. [ ] Accessibility checklist and examples; ARIA patterns for composite components.
5. [ ] Telemetry hooks: standardized events for mounts, errors, timings; pluggable reporter (console/datadog).
6. [ ] Example gallery: minimal React/Vue MFEs with identical UI to demonstrate parity.
7. [ ] Documentation site (VitePress) with live examples and API references.
8. [ ] Continuous Integration: lint, typecheck, build, test, and preview deployments on each PR.
9. [ ] Release strategy: semantic‑release with conventional commits and automated changelogs.
10. [ ] Publish packages to npm under an org scope; include example consumers.
