import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import createMfe from 'web-component-framework-renderer-sdk'

const cssURL = 'http://localhost:4173/mfe-vue-one/dist/index.css'

// Create the web component class using the SDK
const vueLifecycles = createMfe(
  ({ rootContainer, props }) => {
    const app = createApp(App, props)
    app.use(router)
    return {
      mount: () => {
        app.mount(rootContainer)
      },
      unmount: () => {
        app.unmount()
      },
    }
  },
  {
    name: '@mf/vue',
    cssURLs: cssURL ? [cssURL] : undefined,
  },
)

export const { name } = vueLifecycles
export const { bootstrap } = vueLifecycles
export const { mount } = vueLifecycles
export const { unmount } = vueLifecycles
