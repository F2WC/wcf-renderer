import type { WcfHostElement } from 'web-component-framework-renderer-sdk'

export function findElementsForSpecifier(specifier: string): WcfHostElement[] {
  const escaped = CSS.escape(specifier)
  return Array.from(
    document.querySelectorAll<WcfHostElement>(
      `wcf-mfe[data-mfe-name="${escaped}"], wcf-widget[data-widget-name="${escaped}"]`,
    ),
  )
}

let highlighted: HTMLElement | undefined
let savedOutline: string | undefined

export function highlightElement(element: HTMLElement): void {
  clearHighlight()
  highlighted = element
  savedOutline = element.style.outline
  element.style.outline = '2px solid var(--dt-warn-text, #f59e0b)'
  element.style.outlineOffset = '2px'
}

export function clearHighlight(): void {
  if (highlighted) {
    highlighted.style.outline = savedOutline ?? ''
    highlighted.style.outlineOffset = ''
    highlighted = undefined
  }
}
