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
