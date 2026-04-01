import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import createMfe from 'web-component-framework-renderer-sdk'

const cssURL = 'http://localhost:4173/mfe-react-one/dist/index.css'

export default createMfe(
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
    name: '@widget/react',
    cssURLs: cssURL ? [cssURL] : undefined,
  },
)
