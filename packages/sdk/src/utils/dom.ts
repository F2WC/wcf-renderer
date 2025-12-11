/**
 * Creates and appends a stylesheet link element to the document head.
 * Skips creation if a stylesheet with the same href already exists.
 *
 * @param cssUrl The URL of the CSS file to load
 * @param id A unique identifier to tag the link element
 */
export function createStyleElement(cssUrl: string, id: string): void {
  const styleAlreadyExists = document.head.querySelector(
    `link[href="${cssUrl}"][rel="stylesheet"]`,
  )
  if (styleAlreadyExists) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = cssUrl
  link.crossOrigin = 'anonymous'
  link.setAttribute(`data-wcf-${id}`, '')
  document.head.appendChild(link)
}

/**
 * Removes all stylesheet link elements tagged with the given id.
 *
 * @param id The unique identifier used to tag stylesheet elements
 */
export function deleteStyleElements(id: string): void {
  const links = document.querySelectorAll(`link[data-wcf-${id}][rel="stylesheet"]`)
  links.forEach((link) => {
    link.remove()
  })
}

/**
 * Creates and appends a preload link element to the document head.
 * Skips creation if a preload link with the same href already exists.
 *
 * @param cssUrl The URL of the CSS file to preload
 * @param id A unique identifier to tag the link element
 */
export function createPreloadLink(cssUrl: string, id: string): void {
  const preloadAlreadyExists = document.head.querySelector(
    `link[href="${cssUrl}"][rel="preload"]`,
  )
  if (preloadAlreadyExists) return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = cssUrl
  link.as = 'style'
  link.crossOrigin = 'anonymous'
  link.setAttribute(`data-wcf-${id}`, '')
  document.head.appendChild(link)
}
