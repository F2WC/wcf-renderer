import createRouter from 'web-component-framework-renderer-shell'

const routes = [
  {
    path: '/{*path}',
    name: '@mf/vue',
    widgets: ['@mf/react']
  },
  {
    path: '/react',
    name: '@mf/react',
  }
]

createRouter(routes, ({ name }) => {
  return import(/* @vite-ignore */ name);
})

