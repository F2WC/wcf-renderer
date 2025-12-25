import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import createMfe from 'web-component-framework-renderer-sdk'

const reactLifecycles = createMfe(
  ({ rootContainer, props }) => {
    const root = createRoot(rootContainer)
    return {
      mount: () => {
        root.render(
          <StrictMode>
            <App initialCount={props?.initialCount ?? 0}/>
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
      cssURLs: ['http://localhost:8080/react/index.css'],
  },
)


export const { name } = reactLifecycles
export const { register } = reactLifecycles
export const { bootstrap } = reactLifecycles
export const { mount } = reactLifecycles
export const { unmount } = reactLifecycles
