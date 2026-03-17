import {createApp, reactive} from 'vue'
import App from './App.vue'
import router from './router'
import createMfe from 'web-component-framework-renderer-sdk'

const cssURL = 'http://localhost:4173/mfe-vue-one/dist/index.css'

export default createMfe(
  ({ rootContainer, props }) => {
    const app = createApp(App)
    const reactiveProps = reactive(props ?? {})
    app.provide('mfeProps', reactiveProps)
    app.use(router)
    return {
      mount: () => {
        app.mount(rootContainer)
      },
      unmount: () => {
        app.unmount()
      },
      update: (newProps) => {
        Object.assign(reactiveProps, newProps)
      },
    }
  },
  {
    name: '@mf/vue',
    cssURLs: cssURL ? [cssURL] : undefined,
  },
)
