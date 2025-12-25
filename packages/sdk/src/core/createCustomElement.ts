import {eventBus, MFE_EVENTS} from "@/utils/events.ts";
import {Options} from "@/types/index.ts";
import {ConsoleWcfLogger} from "@/logger.ts";

export const registerCustomElement = (MfeComponent: typeof HTMLElement, options: Options, logger: ConsoleWcfLogger) => {
    return () => {
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
        eventBus.emit(MFE_EVENTS.REGISTERED, { name: options.name })
    }
}
