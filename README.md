# Web Component Framework Renderer

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

- Docker Desktop 4.x or newer (includes Docker Compose v2)
- Bash (for running the setup script)
- Node.js 20+ and npm 10+ (only needed to run the local setup script; the app itself runs in Docker)

### Clone & setup

```bash
git clone <repository-url>
cd web-component-framework-renderer
# Install local dependencies so your editor/TypeScript tooling works
npm run setup    # or: bash ./setup.sh
```

### Run the stack (Docker)

```bash
docker compose up --build
```

- App Shell dev server: http://localhost:5173
- The first startup may take a while. The shell waits until both MFEs have produced their first build before starting Vite.
- Stop with Ctrl+C. To run in background, add `-d`.

### Develop

The recommended way to develop is via Docker. The repository is mounted into the containers, and each service runs in watch mode:

- `packages/sdk` builds in watch mode
- `playground/mfe-vue-one` and `playground/mfe-react-one` build in watch mode
- `playground/shell` (Vite) reloads when MFEs output to `dist/`

Typical flow:

1. Run `npm run setup` once locally so node_modules are available for your editor and local tooling.
2. Start the dev stack with `docker compose up --build`.
3. Edit code in your IDE; changes are picked up automatically by the running containers.

Tips:

- View logs for a single service: `docker compose logs -f app-shell` (or any service)
- Restart one service: `docker compose restart mfe-vue-one`
- Clean dev volumes (node_modules inside containers): `docker compose down -v`

### Lint & Format

```bash
npm run lint:script
```

```bash
npm run lint:script:fix
```

## Roadmap / TODO (consolidated)

Legend: Items marked with AI* were suggested by the assistant. Your original items have been rephrased for clarity; where they overlap with AI* entries, they are merged and called out below.

App Shell

- Create an App Shell package responsible for routing, orchestration.
- Move the current `/src` and related root host files into a `shell/` subfolder.
- Provide a very easy local startup: a single command to run the shell and watch packages.
  - Docker‑based dev compose for one‑command local boot. AI\*

SDK

- Define a clear MFE contract: attributes/props schema, events, and lifecycle signatures; versioned and documented.
- Implement a type‑safe event bus with namespacing and wildcard listeners; generate TS types from the contract.

Monorepo and Repository

- Split the repo into `packages/` with at least `sdk/` and `shell/`.
- Enable workspaces and a monorepo tool (Lerna) for builds, versioning, and pipelines.
- Update the repository to include all project files, not just the SDK.

Quality, Tooling, and Operations

- Add E2E tests (Playwright) to verify multi‑framework rendering, navigation, and cross‑MFE events.
- Add unit tests for SDK adapters and Web Component lifecycle (Vitest).
- Set performance budgets and a lazy‑loading strategy per route/MFE; prefetch/module federation where applicable.
- Accessibility checklist and examples; ARIA patterns for composite components.
- Telemetry hooks: standardized events for mounts, errors, timings; pluggable reporter (console/datadog).
- Example gallery: minimal React/Vue MFEs with identical UI to demonstrate parity.
- Documentation site (VitePress) with live examples and API references.
- Continuous Integration: lint, typecheck, build, test, and preview deployments on each PR.
- Release strategy: semantic‑release with conventional commits and automated changelogs.
- Publish packages to npm under an org scope; include example consumers.
- MAYBE: Establish Shadow DOM and CSS isolation strategy; document opt‑in/out and shared design tokens.

## Monorepo plan (draft)

Target structure once the Shell exists and packages are split:

```
/
├── packages/
│   ├── sdk/             # Core SDK used by framework adapters and MFEs
│   ├── shell/           # App Shell (router, layout, orchestration)
└── playground/
    ├── vue/             # Eaxmple vue entry
    ├── react/           # Eaxmple react entry
    └── shell/           # Example shell app wiring several MFEs together
```

Tooling:

- npm workspaces + Lerna
- Shared TS config, ESLint, and build scripts

## Local development (quick start ideas)

- Single command: `npm run dev` should start the shell and watch all packages in parallel
- `docker compose up` to run a preconfigured dev environment

## License

ISC
