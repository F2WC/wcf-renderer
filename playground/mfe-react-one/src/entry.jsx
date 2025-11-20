import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import createMfe from 'web-component-framework-renderer-sdk'

const reactLifecycles = createMfe(
  ({ rootContainer }) => {
    const root = createRoot(rootContainer)
    return {
      mount: () => {
        root.render(
          <StrictMode>
            <App />
          </StrictMode>,
        )
      },
      unmount: () => {
        root.unmount()
      },
    }
  },
  {
    name: 'mfe-react-one',
    cssURLs: [],
  },
)

export const { bootstrap } = reactLifecycles
export const { mount } = reactLifecycles
export const { unmount } = reactLifecycles
