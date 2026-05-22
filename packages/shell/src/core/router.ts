import { match } from 'path-to-regexp'
import type {ComponentProps} from 'web-component-framework-renderer-sdk'

export interface Route {
  path: string
  name: string
  props?: ComponentProps
  beforeEnter?: () => Promise<void>
  afterEnter?: () => Promise<void>
  children?: Route[]
}

export type Routes = Route[]

const handleMfe = (route: Route) => {
  const element = document.createElement('wcf-mfe')
  element.setAttribute('data-mfe-name', route.name)
  if(route.props) {
    Object.entries(route.props).forEach(([key, value]) => {
      if(typeof value === 'object') value = JSON.stringify(value)
      element.setAttribute(`data-prop-${key}`, value)
    })
  }
  document.body.appendChild(element)
}

class NoMatchError extends Error {}

const handleRoutes = async (routes: Routes, basePath = '') => {
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
        await handleRoutes(route.children, fullPath)
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

    await route.beforeEnter?.()

    handleMfe(route)

    await route.afterEnter?.()
    return
  }

  throw new NoMatchError()
}

export default async (routes: Routes) => {
  try {
    await handleRoutes(routes)
  } catch (e) {
    if (e instanceof NoMatchError) {
      throw new Error('No route matched')
    }
    throw e
  }
}
