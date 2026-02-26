import type { ConsoleWcfLogger } from '@/logger.js'
import type { ExternalLifecycleFunctions, LifecycleFunctions, Options } from '@/types/index.js'
import type { MaybePromise } from '@/types/index.js'
import { registerCustomElement } from '@/core/createCustomElement.ts'

/**
 * Executes a callback on all custom elements matching the given tag name.
 * Throws an error if no elements are found.
 *
 * @param tagName The custom element tag name to query
 * @param callback The function to execute on each element
 * @throws Error if no custom elements are found with the given tag name
 */
export async function executeOnCustomElements(
  tagName: string,
  callback: (el: Element) => MaybePromise<void>,
): Promise<void> {
  const nodes = document.querySelectorAll(tagName)
  if (!nodes.length) throw new Error(`No custom elements found with tag name "${tagName}"`)
  for (const el of nodes) {
    await callback(el)
  }
}

/**
 * Creates the external lifecycle API that can be called to orchestrate
 * all instances of a given MFE custom element.
 *
 * @param options The MFE options containing the custom element name
 * @param lifecycleMap A WeakMap tracking lifecycle functions per element instance
 * @param logger Logger instance for debug/error messages
 * @param mfeComponent The custom element class to register
 * @returns External lifecycle functions (bootstrap, mount, unmount, register)
 */
export function createLifecycleOrchestrator(
  options: Options,
  lifecycleMap: WeakMap<Element, Required<LifecycleFunctions>>,
  logger: ConsoleWcfLogger,
  mfeComponent: typeof HTMLElement,
): ExternalLifecycleFunctions {
  return {
    name: options.name,
    register: registerCustomElement(mfeComponent, options, logger),
    bootstrap: async () => {
      if (!options.name) {
        logger.error('MFE name is missing.')
        return
      }

      try {
        await executeOnCustomElements(options.name, async (el) => {
          await lifecycleMap.get(el)?.bootstrap()
        })
      } catch {
        logger.debug(`No custom elements found for MFE ${options.name} to bootstrap`)
      }
    },
    mount: async () => {
      if (!options.name) {
        logger.error('MFE name is missing.')
        return
      }

      try {
        await executeOnCustomElements(options.name, async (el) => {
          await lifecycleMap.get(el)?.mount()
        })
      } catch {
        logger.debug(`No custom elements found for MFE ${options.name} to mount`)
      }
    },
    unmount: async () => {
      if (!options.name) {
        logger.error('MFE name is missing.')
        return
      }

      try {
        await executeOnCustomElements(options.name, async (el) => {
          await lifecycleMap.get(el)?.unmount()
        })
      } catch {
        logger.debug(`No custom elements found for MFE ${options.name} to unmount`)
      }
    },
  }
}
