import { match } from 'path-to-regexp'
import { ExternalLifecycleFunctions } from 'web-component-framework-renderer-sdk'
export interface Route {
  path: string
  name: string
  widgets?: string[]
  beforeEnter?: () => void
  afterEnter?: () => void
  children?: Route[]
}

export type Routes = Route[]

export type LoadApp = ({ name }: { name: string }) => Promise<ExternalLifecycleFunctions>

const handleMfe = async (mfe: string, loadApp: LoadApp) => {
  const mfeComponent = await loadApp({ name: mfe })
  mfeComponent.register()
  const element = document.createElement(mfeComponent.name)
  document.body.appendChild(element)
  await mfeComponent.bootstrap()
  await mfeComponent.mount()
}

const handleWidgets = async (widgets: string[], loadApp: LoadApp) => {
  await Promise.all(
    widgets.map(async (widget) => {
      const widgetComponent = await loadApp({ name: widget })
      widgetComponent.register()
    }),
  )
}

class NoMatchError extends Error {}

const handleRoutes = async (routes: Routes, loadApp: LoadApp, basePath = '') => {
  for (const route of routes) {
    if (!route.path) {
      throw new Error('Route path is required')
    }

    const fullPath = `${basePath}${route.path}`.replace(/\/+/g, '/')
    const matchFn = match(fullPath, { end: !route.children })
    const result = matchFn(window.location.pathname)

    if (!result) continue

    if (route.children) {
      try {
        await handleRoutes(route.children, loadApp, fullPath)
        return
      } catch (e) {
        if (!(e instanceof NoMatchError)) throw e
      }
    }

    // If it's an exact match or children didn't match but this route matches (and we are here)
    const exactMatchFn = match(fullPath, { end: true })
    if (!exactMatchFn(window.location.pathname)) {
      continue
    }

    route.beforeEnter?.()

    await handleMfe(route.name, loadApp)

    if (route.widgets) {
      await handleWidgets(route.widgets, loadApp)
    }

    route.afterEnter?.()
    return
  }

  throw new NoMatchError()
}

export default async (routes: Routes, loadApp: LoadApp) => {
  try {
    await handleRoutes(routes, loadApp)
  } catch (e) {
    if (e instanceof NoMatchError) {
      throw new Error('No route matched')
    }
    throw e
  }
}
