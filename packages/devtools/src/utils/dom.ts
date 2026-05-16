import type { WcfHostElement } from 'web-component-framework-renderer-sdk'

export function findElementsForSpecifier(specifier: string): WcfHostElement[] {
  const escaped = CSS.escape(specifier)
  return Array.from(
    document.querySelectorAll<WcfHostElement>(
      `wcf-mfe[data-mfe-name="${escaped}"], wcf-widget[data-widget-name="${escaped}"]`,
    ),
  )
}

let overlay: HTMLDivElement | undefined

export function highlightElement(element: HTMLElement): void {
  clearHighlight()
  const rect = element.getBoundingClientRect()
  overlay = document.createElement('div')
  overlay.style.cssText = [
    'position:fixed',
    `top:${rect.top.toFixed(2)}px`,
    `left:${rect.left.toFixed(2)}px`,
    `width:${rect.width.toFixed(2)}px`,
    `height:${rect.height.toFixed(2)}px`,
    'box-shadow:inset 0 0 0 2px #f59e0b',
    'pointer-events:none',
    'z-index:2147483646',
  ].join(';')
  document.body.appendChild(overlay)
}

export function clearHighlight(): void {
  overlay?.remove()
  overlay = undefined
}
