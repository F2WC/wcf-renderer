/**
 * Simple console logger for the WCF SDK. All messages are prefixed with [WCF]:
 *
 * TODO: Add log levels that can be configured via config
 */
export type LogMethod = (message: string) => void

export class ConsoleWcfLogger {
  private readonly prefix = '[WCF]:'
  private readonly debugPrefix = '[WCF - DEBUG]:'

  log: LogMethod = (message) => {
    console.log(this.prefix, message)
  }

  info: LogMethod = (message) => {
    console.info(this.prefix, message)
  }

  warn: LogMethod = (message) => {
    console.warn(this.prefix, message)
  }

  error: LogMethod = (message) => {
    console.error(this.prefix, message)
  }

  debug: LogMethod = (message) => {
    console.info(`%c${this.debugPrefix}`, 'color: #00BFFF', message)
  }
}

/**
 * A ready-to-use singleton instance.
 */
export const wcfLogger = new ConsoleWcfLogger()
