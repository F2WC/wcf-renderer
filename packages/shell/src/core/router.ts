import { match } from 'path-to-regexp'

interface Route {
    path: string;
    name: string;
    widgets?: string[];
    beforeEnter?: () => void;
    afterEnter?: () => void;
}

export default (routes: Route[], loadApp: ({name}: {name: string}) => Promise<any>) => {
    routes.forEach(async route => {
        if (!route.path) {
            throw new Error('Route path is required')
        }

        console.log(route.name)
        console.log(route.path)
        console.log(window.location.pathname)

        const matchFn = match(route.path)
        const result = matchFn(window.location.pathname)

        if(!result) return console.log(
            'No match found for route', route.path, 'in', window.location.pathname
        )

        route.beforeEnter?.()

        console.log(loadApp)

        const mfeComponent = await loadApp({name: route.name})

        mfeComponent.register()
        const element = document.createElement(mfeComponent.name)
        document.body.appendChild(element)
        await mfeComponent.bootstrap()
        await mfeComponent.mount()

        route.widgets?.forEach(async widget => {
            const widgetComponent = await loadApp({name: widget})
            widgetComponent.register()
        })

        console.log('Route matched:', route.name, 'for path', route.path)
    })
}
