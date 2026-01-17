import { ConsoleWcfLogger } from '@/logger.js'
import { createLifecycleOrchestrator } from '@/core/lifecycle-orchestrator.js'
import { createMfeComponentClass } from '@/components/mfe-component.js'
import type {
  AppFactory,
  ExternalLifecycleFunctions,
  LifecycleFunctions,
  Options,
} from '@/types/index.js'
import { eventBus, MFE_EVENTS } from '@/utils/events.ts'

// Re-export types and EvenBus for public API
export type { MaybePromise, ExternalLifecycleFunctions } from '@/types/index.js'
export { eventBus, MFE_EVENTS }

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
  const lifecycleMap = new WeakMap<Element, Required<LifecycleFunctions>>()
  const MfeComponent = createMfeComponentClass(appFactory, options, lifecycleMap, logger)

  return createLifecycleOrchestrator(options, lifecycleMap, logger, MfeComponent)
}
