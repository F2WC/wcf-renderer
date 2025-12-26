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

const handleRoutes = async (routes: Routes, loadApp: LoadApp) => {
  for (const route of routes) {
    if (!route.path) {
      throw new Error('Route path is required')
    }

    const matchFn = match(route.path)
    const result = matchFn(window.location.pathname)

    if (!result) throw new NoMatchError()

    /*+
        TODO: Children need to take the route of the parent into account and only when there is an exact match should they be executed.
              If one route would match already but still has children, the children needs to be checked first if they would also match.
              If they also match, the children should be executed and the rest of the code needs to be skipped.
              If none of the children match, the parent needs to be executed if it matches, and this going up the tree until a match is found.
              If no match at all is found, the router should throw an error.
        if(route.children) {
            try {
                await handleRoutes(route.children, loadApp)
            } catch (e) {
                if (e instanceof NoMatchError) continue
                return
            }
        }
    */
    route.beforeEnter?.()

    await handleMfe(route.name, loadApp)

    if (route.widgets) {
      await handleWidgets(route.widgets, loadApp)
    }

    route.afterEnter?.()
  }
}

export default async (routes: Routes, loadApp: LoadApp) => {
  await handleRoutes(routes, loadApp)
}
