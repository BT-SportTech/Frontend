export interface ThemeStoreState {
  color: string
}

export interface ThemeStoreActions {
  setColor: (color: string) => void
  resetColor: () => void
}

export type ThemeStore = ThemeStoreState & ThemeStoreActions
