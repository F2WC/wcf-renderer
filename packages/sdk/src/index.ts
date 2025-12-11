import { ConsoleWcfLogger } from '@/logger.js'
import { createLifecycleOrchestrator } from '@/core/lifecycle-orchestrator.js'
import { createMfeComponentClass } from '@/components/mfe-component.js'
import type { AppFactory, ExternalLifecycleFunctions, LifecycleFunctions, Options } from '@/types/index.js'

// Re-export types for public API
export type { MaybePromise } from '@/types/index.js'

/**
 * Creates a class for a self-contained web component for a micro-frontend.
 * This class can then be exported by the MFE and registered by the AppShell.
 *
 * @param appFactory A function that returns a new instance of the MFE's application.
 * @param options
 * @returns An HTMLElement class that can be registered with `customElements.define()`.
 */
export default function createMfe(
  appFactory: AppFactory,
  options: Options,
): ExternalLifecycleFunctions {
  const logger = new ConsoleWcfLogger()
  // Track lifecycle functions per element instance so multiple components can mount independently
  const lifecycleMap = new WeakMap<Element, Required<LifecycleFunctions>>()

  const MfeComponent = createMfeComponentClass(appFactory, options, lifecycleMap, logger)

  const registerCustomElement = () => {
    if (customElements.get(options.name)) {
      logger.debug(
        `MFE custom element "${options.name}" already defined skipping custom element registration.`,
      )
      return
    }
    const cssList = options.cssURLs?.join(', ') ?? ''
    logger.debug(
      `Registering MFE with name "${options.name}"` + (cssList ? ` and CSS URLs: ${cssList}` : ''),
    )
    customElements.define(options.name, MfeComponent)
  }


  return createLifecycleOrchestrator(options, lifecycleMap, logger, registerCustomElement)
}
