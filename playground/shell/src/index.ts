import createRouter, { type Routes } from 'web-component-framework-renderer-shell'

const routes: Routes = [
  {
    path: '/{*path}',
    name: '@mf/vue',
    widgets: ['@mf/react'],
    beforeEnter: () => {
      console.log('Entering Vue route');
    },
    afterEnter: () => {
      console.log('After enter Vue route');
    },
    children: [
      {
        path: '/react',
        name: '@mf/react',
      }
    ]
  },
]

createRouter(routes, ({ name }) => {
  return import(/* @vite-ignore */ name);
})

