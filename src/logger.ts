/**
 * Simple console logger for the WCF SDK. All messages are prefixed with [WCF]:
 */
export type LogMethod = (...args: any[]) => void;

export class ConsoleWcfLogger {
  private readonly prefix = '[WCF]:';

  log: LogMethod = (...args) => {
    // eslint-disable-next-line no-console
    console.log(this.prefix, ...args);
  };

  info: LogMethod = (...args) => {
    // eslint-disable-next-line no-console
    console.info(this.prefix, ...args);
  };

  warn: LogMethod = (...args) => {
    // eslint-disable-next-line no-console
    console.warn(this.prefix, ...args);
  };

  error: LogMethod = (...args) => {
    // eslint-disable-next-line no-console
    console.error(this.prefix, ...args);
  };

  debug: LogMethod = (...args) => {
    // eslint-disable-next-line no-console
    console.debug(this.prefix, ...args);
  };
}

/**
 * A ready-to-use singleton instance.
 */
export const wcfLogger = new ConsoleWcfLogger();
