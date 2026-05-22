import { css } from 'lit'

export const reset = css`
  :host {
    all: initial;
    font-family: var(--dt-font-ui), sans-serif;
    font-size: var(--dt-font-size-base);
    line-height: var(--dt-line-height);
    color: var(--dt-text-primary);
    box-sizing: border-box;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    margin: 0;
  }

  input {
    font: inherit;
    color: var(--dt-text-primary);
    background: var(--dt-bg-input);
    border: 1px solid var(--dt-border);
    border-radius: var(--dt-radius-xs);
    padding: 3px 6px;
    outline: none;
    transition:
      border-color var(--dt-dur-xs) var(--dt-ease),
      box-shadow var(--dt-dur-xs) var(--dt-ease);
  }

  input:focus-visible {
    border-color: var(--dt-border-focus);
    box-shadow: 0 0 0 3px var(--dt-accent-glow);
  }

  button:focus-visible {
    outline: 2px solid var(--dt-border-focus);
    outline-offset: 2px;
  }
`
