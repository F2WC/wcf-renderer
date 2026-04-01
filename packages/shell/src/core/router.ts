import { match } from 'path-to-regexp'

export interface Route {
  path: string
  name: string
  widgets?: string[]
  beforeEnter?: () => void
  afterEnter?: () => void
  children?: Route[]
}

export type Routes = Route[]

const handleMfe = (mfe: string) => {
  const element = document.createElement('wcf-mfe')
  element.setAttribute('data-mfe-name', mfe)
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

    route.beforeEnter?.()

    handleMfe(route.name)

    route.afterEnter?.()
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
