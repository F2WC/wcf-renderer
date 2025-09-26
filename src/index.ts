import wcfRenderer from './plugin.ts'
import {ConsoleWcfLogger} from "@/logger.js";

/**
 * A generic interface for a micro-frontend application instance from any framework.
 * It must have `mount` and `unmount` methods.
 */
interface FrameworkApplication {
  mount(rootContainer: string | Element): any;
  unmount(): void;
}

interface LifecycleFunctions {
  mount: () => void;
  unmount: () => void;
}

interface Options {
  name: string;
  cssURLs?: string[];
}

interface ComponentAttributes {
  props?: string;
}

type ComponentProps = Record<string, unknown>;

/**
 * A factory function, provided by the MFE, that creates and returns a fresh
 * instance of its application. It can receive props from the AppShell.
 */
type AppFactory<T extends FrameworkApplication> = (props?: Record<string, any>) => T;

/**
 * Creates a class for a self-contained web component for a micro-frontend.
 * This class can then be exported by the MFE and registered by the AppShell.
 *
 * @param appFactory A function that returns a new instance of the MFE's application.
 * @param options
 * @returns An HTMLElement class that can be registered with `customElements.define()`.
 */
export default function createMfe<T extends FrameworkApplication>(
  appFactory: AppFactory<T>,
  {
    name,
    cssURLs = [],
  }: Options
) {
  let lifeCycleFunctions: LifecycleFunctions = {
    mount: () => {},
    unmount: () => {},
  };

  class MfeComponent extends HTMLElement {
    #appInstance: FrameworkApplication | null = null;
    #internals: ElementInternals;
    #isMounted: boolean = false;
    #logger: ConsoleWcfLogger = new ConsoleWcfLogger()

    constructor() {
      super();
      this.#internals = this.attachInternals();
    }

    connectedCallback() {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      const host = this.#internals.shadowRoot.host as HTMLElement;
      const dataset = host.dataset as ComponentAttributes;
      const componentProps: ComponentProps = JSON.parse(dataset.props);

      // Create and append a <link> tag for each absolute CSS URL.
      cssURLs.forEach(cssUrl => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        shadowRoot.appendChild(link);
      });

      const mountPoint = document.createElement('div');
      shadowRoot.appendChild(mountPoint);

      const mount = () => {
        if(this.#isMounted) {
          this.#logger.warn('MFE is already mounted.');
          return;
        }
        this.#appInstance = appFactory(componentProps);
        this.#appInstance.mount(mountPoint)
        this.#isMounted = true;
      };
      const unmount = () => {
        this.#appInstance.unmount();
        this.#isMounted = false;
      };

      lifeCycleFunctions = {
        mount,
        unmount,
      };
    }

    disconnectedCallback() {
      if (this.#appInstance) {
        this.#appInstance.unmount();
        this.#appInstance = null;
        this.#isMounted = false;
      }
    }
  }

  customElements.define(name, MfeComponent);

  return {
    ...lifeCycleFunctions
  };
}

export {
  wcfRenderer,
}
