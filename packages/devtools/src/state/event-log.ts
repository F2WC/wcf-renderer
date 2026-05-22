export type LogEventType =
  | 'MFE:REGISTERED'
  | 'MFE:BOOTSTRAPPED'
  | 'MFE:MOUNTED'
  | 'MFE:UPDATED'
  | 'MFE:UNMOUNTED'
  | 'ERROR'

export interface LogEntry {
  id: number
  type: LogEventType
  name: string
  instanceId?: string
  timestamp: number
  payload?: unknown
}

const BUFFER_SIZE = 500

export class EventLog {
  #entries: LogEntry[] = []
  #counter = 0
  #subscribers = new Set<() => void>()

  push(entry: Omit<LogEntry, 'id'>): void {
    this.#counter += 1
    this.#entries.push({ ...entry, id: this.#counter })
    if (this.#entries.length > BUFFER_SIZE) {
      this.#entries.splice(0, this.#entries.length - BUFFER_SIZE)
    }
    this.#notify()
  }

  entries(): readonly LogEntry[] {
    return this.#entries
  }

  clear(): void {
    this.#entries = []
    this.#notify()
  }

  subscribe(fn: () => void): () => void {
    this.#subscribers.add(fn)
    return () => this.#subscribers.delete(fn)
  }

  #notify(): void {
    for (const fn of this.#subscribers) fn()
  }
}
