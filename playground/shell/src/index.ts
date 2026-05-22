import { createRouter } from 'web-component-framework-renderer-shell'

await createRouter([
    {
        name: '@mf/vue',
        path: '/',
        props: { msg: 'Hello Vue!' },
    },
    {
        name: '@mf/vue',
        path: '/about',
    }
])
