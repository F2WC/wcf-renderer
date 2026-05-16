import { css, unsafeCSS } from 'lit'
import cssTokens from './tokens.css?inline'

export const tokens = css`
  ${unsafeCSS(cssTokens)}
`
