# Copilot Instructions for `web-component-framework-renderer`

## Build, test, and lint commands

Run commands from the repository root unless noted.

### Setup and development

- `npm run setup`  
  Installs dependencies in root and each `playground/*` app (via `setup.sh`).
- `docker compose up --build`  
  Recommended local dev flow; runs SDK/shell builds in watch mode and serves MFEs + shell.

### Build

- `npm run build`  
  Runs `lerna run build` across `packages/*` (`sdk` and `shell`).
- `npx lerna run build --scope web-component-framework-renderer-sdk`
- `npx lerna run build --scope web-component-framework-renderer-shell`  
  Use scoped commands when changing only one package.

### Lint / formatting

- `npm run lint:script`
- `npm run lint:script:fix`

Root ESLint ignores `playground/**`; lint playground apps with their local scripts:

- `(cd playground/mfe-react-one && npm run lint)`
- `(cd playground/mfe-vue-one && npm run lint)`
- `(cd playground/shell && npm run lint:script)`

### Tests

- `npm test` (delegates to `lerna run test`)
- `npx lerna run test --scope web-component-framework-renderer-sdk` (single package)
- `npx lerna run test --scope web-component-framework-renderer-shell` (single package)

Current state: package `test` scripts are placeholders (`"Error: no test specified"`). There is no implemented per-file/single-test runner yet.

## High-level architecture

- This is a monorepo where reusable runtime code lives in `packages/` and runnable examples live in `playground/`.
- `packages/sdk` is the core runtime:
  - `createMfe(...)` wraps framework apps as custom elements and returns `{ name, register, bootstrap, mount, unmount }`.
  - `wcf-widget` is registered globally and can lazy-load another MFE by module name via `data-widget-name`.
  - lifecycle events are emitted on `window` (`MFE:REGISTERED`, `MFE:BOOTSTRAPPED`, `MFE:MOUNTED`, `MFE:UNMOUNTED`).
- `packages/shell` provides router/orchestration:
  - routes are matched with `path-to-regexp`;
  - matched route `name` is loaded via a provided `loadApp` function;
  - loaded lifecycle is registered, then bootstrapped/mounted.
- `playground/shell` wires runtime loading:
  - uses an import map (`@mf/vue`, `@mf/react`) in `playground/shell/index.html`;
  - calls `createRouter(routes, ({ name }) => import(name))`.
- `playground/mfe-vue-one` and `playground/mfe-react-one` each export SDK lifecycle bindings from `src/entry.*` and are served by nginx from `/vue/index.js` and `/react/index.js`.

## Key repository conventions

- Keep the MFE naming chain aligned across files:
  1. import-map key (e.g. `@mf/react`),
  2. route `name` in shell routes,
  3. `data-widget-name` when using `<wcf-widget>`.
- Custom element tag names (e.g. `mfe-react-one`) are defined in each MFE’s `createMfe(..., { name })` options and used by the shell when creating DOM elements.
- MFE entry modules must export named lifecycle members (`name`, `register`, `bootstrap`, `mount`, `unmount`) because shell loading expects that contract.
- Props are passed as JSON via `data-props`; auto-mount behavior is enabled by presence of `data-auto-mount`.
- SDK code uses `@/*` path aliases and explicit import extensions (`.js` / `.ts`) with NodeNext settings; preserve this style when editing imports.
- CSS for MFEs is managed via `cssURLs` in SDK options; stylesheet/preload links are attached on mount and removed on unmount.
