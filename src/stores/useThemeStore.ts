import { create } from 'zustand'
import type { ThemeStore } from '../interfaces/theme.interface'
import {
  DEFAULT_THEME_COLOR,
  applyThemeColor,
  initializeTheme,
  isDefaultThemeColor,
  normalizeHexColor,
  persistThemeColor,
  resetThemeColor,
} from '../lib/theme'

const initialColor = initializeTheme()

export const useThemeStore = create<ThemeStore>((set) => ({
  color: initialColor || DEFAULT_THEME_COLOR,

  setColor: (raw) => {
    const color = normalizeHexColor(raw)
    if (!color) return

    if (isDefaultThemeColor(color)) {
      resetThemeColor()
      set({ color: DEFAULT_THEME_COLOR })
      return
    }

    applyThemeColor(color)
    persistThemeColor(color)
    set({ color })
  },

  resetColor: () => {
    resetThemeColor()
    set({ color: DEFAULT_THEME_COLOR })
  },
}))
