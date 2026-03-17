import type { ComponentProps } from '@/types/index.js'

/**
 * Reads component props from `data-prop-*` attributes on the element.
 * Attribute names are converted from kebab-case to camelCase.
 * Returns undefined if no matching attributes are found.
 *
 * @param element The custom element to read attributes from
 * @returns Parsed component props or undefined
 */
export function getComponentProps(element: HTMLElement): ComponentProps | undefined {
  const props: ComponentProps = {}
  let found = false

  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-prop-')) {
      const key = attr.name
        .slice('data-prop-'.length)
        .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
      props[key] = attr.value
      found = true
    }
  }

  return found ? props : undefined
}
