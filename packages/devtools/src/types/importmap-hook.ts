export interface Importmap {
  imports?: Record<string, string>
  scopes?: Record<string, Record<string, string>>
}
