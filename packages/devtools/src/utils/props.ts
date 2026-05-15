import { camelToKebab } from './format.ts'

export function readPropsFromElement(element: HTMLElement): Record<string, string> {
  const props: Record<string, string> = {}
  for (const attr of Array.from(element.attributes)) {
    if (!attr.name.startsWith('data-prop-')) continue
    const key = attr.name
      .slice('data-prop-'.length)
      .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
    props[key] = attr.value
  }
  return props
}

export function editProp(element: HTMLElement, key: string, value: string): void {
  element.setAttribute('data-prop-' + camelToKebab(key), value)
}

export function removeProp(element: HTMLElement, key: string): void {
  element.removeAttribute('data-prop-' + camelToKebab(key))
}

export function addProp(element: HTMLElement, key: string, value: string): void {
  if (!key) return
  editProp(element, key, value)
}
