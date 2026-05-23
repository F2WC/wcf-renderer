import { createRouter } from 'web-component-framework-renderer-shell'

await createRouter([
    {
        name: '@mf/vue',
        path: '/',
        props: { msg: 'Hello Vue!' },
        children: [
            {
                name: '@mf/vue',
                path: '/child/:msg',
                beforeEnter: (route, paramData) => {
                    console.log('Before entering child route with route:', route)
                    console.log('Before entering child route with params:', paramData)
                }
            }
        ]
    },
    {
        name: '@mf/vue',
        path: '/about',
    }
])
