export type ImportmapOverrides = Record<string, string>

export interface UiState {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  collapsed: boolean
  panel: 'apps' | 'timeline' | 'dom-tree' | 'events' | 'overrides'
}
