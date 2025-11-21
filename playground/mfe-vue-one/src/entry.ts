import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import createMfe from 'web-component-framework-renderer-sdk'

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
    name: 'mfe-vue-one',
    cssURLs: ['http://localhost:8080/vue/index.css'],
  },
)

export const { bootstrap } = vueLifecycles
export const { mount } = vueLifecycles
export const { unmount } = vueLifecycles
