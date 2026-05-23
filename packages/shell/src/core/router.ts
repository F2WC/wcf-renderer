import { match, type ParamData } from 'path-to-regexp'
import type { ComponentProps } from 'web-component-framework-renderer-sdk'

export type MaybePromise<T> = T | Promise<T>

export interface Route {
  path: string
  name: string
  props?: ComponentProps
  beforeEnter?: (route: Omit<Route, 'beforeEnter' | 'afterEnter' | 'children'>, paramData: ParamData) => MaybePromise<void>
  afterEnter?: (route: Omit<Route, 'beforeEnter' | 'afterEnter' | 'children'>, paramData: ParamData) => MaybePromise<void>
  children?: Route[]
}

export type Routes = Route[]

const handleMfe = (route: Route, paramData: ParamData) => {
  const element = document.createElement('wcf-mfe')
  element.setAttribute('data-mfe-name', route.name)
  Object.entries(paramData).forEach(([key, value]) => {
    if (Array.isArray(value)) value = JSON.stringify(value)
    if (value)
      element.setAttribute(`data-prop-${key}`, value)
  })

  // Props have a higher priority than params, meaning if the same value is present in both, the prop wins.
  if (route.props) {
    Object.entries(route.props).forEach(([key, value]) => {
      if (typeof value === 'object') value = JSON.stringify(value)
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

    if (route.children) {
      try {
        await handleRoutes(route.children, fullPath)
        return
      } catch (e) {
        if (!(e instanceof NoMatchError)) throw e
      }
    }

    if (!result) continue

    // If it's an exact match or children didn't match but this route matches (and we are here)
    const exactMatchFn = match(fullPath, { end: true })
    if (!exactMatchFn(window.location.pathname)) {
      continue
    }

    const strippedRoute = {...route}
    delete strippedRoute.children
    delete strippedRoute.beforeEnter
    delete strippedRoute.afterEnter

    await route.beforeEnter?.(strippedRoute, result.params)

    handleMfe(route, result.params)

    await route.afterEnter?.(strippedRoute, result.params)
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
