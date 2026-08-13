export const DEFAULT_THEME_COLOR = '#1d4ed8'

export const THEME_PRESETS = [
  { name: 'Blue', value: '#1d4ed8' },
  { name: 'Teal', value: '#0f766e' },
  { name: 'Sky', value: '#0369a1' },
  { name: 'Green', value: '#047857' },
  { name: 'Orange', value: '#c2410c' },
  { name: 'Red', value: '#b91c1c' },
  { name: 'Rose', value: '#be185d' },
  { name: 'Slate', value: '#334155' },
] as const

const THEME_KEY = 'Sportech_theme_color'

const THEME_CSS_VARS = [
  '--color-primary',
  '--color-primary-hover',
  '--color-secondary',
  '--color-accent',
  '--color-bg',
  '--color-line',
  '--color-primary-rgb',
  '--color-secondary-rgb',
  '--theme-wash-a',
  '--theme-wash-b',
  '--theme-wash-base',
  '--theme-wash-opacity',
] as const

function clamp(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)))
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized

  const value = Number.parseInt(full, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => clamp(channel).toString(16).padStart(2, '0'))
    .join('')}`
}

function toRgbChannels(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return `${r} ${g} ${b}`
}

function mix(
  hex: string,
  target: { r: number; g: number; b: number },
  amount: number,
) {
  const rgb = hexToRgb(hex)
  return rgbToHex(
    rgb.r + (target.r - rgb.r) * amount,
    rgb.g + (target.g - rgb.g) * amount,
    rgb.b + (target.b - rgb.b) * amount,
  )
}

export function isValidHexColor(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

export function normalizeHexColor(value: string) {
  const trimmed = value.trim()
  if (!isValidHexColor(trimmed)) return null
  const rgb = hexToRgb(trimmed)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

export function isDefaultThemeColor(color: string) {
  return normalizeHexColor(color)?.toLowerCase() === DEFAULT_THEME_COLOR
}

export function readStoredThemeColor() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored ? normalizeHexColor(stored) : null
  } catch {
    return null
  }
}

export function persistThemeColor(color: string) {
  try {
    localStorage.setItem(THEME_KEY, color)
  } catch {
    /* ignore */
  }
}

export function clearPersistedThemeColor() {
  try {
    localStorage.removeItem(THEME_KEY)
  } catch {
    /* ignore */
  }
}

function clearThemeCssOverrides() {
  const root = document.documentElement
  for (const property of THEME_CSS_VARS) {
    root.style.removeProperty(property)
  }
}

/** Restore original Sportech blue accents. */
export function resetThemeColor() {
  clearThemeCssOverrides()
  clearPersistedThemeColor()
  return DEFAULT_THEME_COLOR
}

export function applyThemeColor(color: string) {
  if (isDefaultThemeColor(color)) {
    resetThemeColor()
    return
  }

  const root = document.documentElement
  const hover = mix(color, { r: 0, g: 0, b: 0 }, 0.14)
  const accent = mix(color, { r: 255, g: 255, b: 255 }, 0.86)
  const secondary = mix(color, { r: 15, g: 118, b: 110 }, 0.4)
  const bg = mix(color, { r: 255, g: 255, b: 255 }, 0.94)
  const line = mix(color, { r: 216, g: 224, b: 234 }, 0.55)
  const washA = mix(color, { r: 255, g: 255, b: 255 }, 0.55)
  const washB = mix(secondary, { r: 255, g: 255, b: 255 }, 0.5)
  const washBase = mix(color, { r: 245, g: 248, b: 252 }, 0.82)

  root.style.setProperty('--color-primary', color)
  root.style.setProperty('--color-primary-hover', hover)
  root.style.setProperty('--color-secondary', secondary)
  root.style.setProperty('--color-accent', accent)
  root.style.setProperty('--color-bg', bg)
  root.style.setProperty('--color-line', line)
  root.style.setProperty('--color-primary-rgb', toRgbChannels(color))
  root.style.setProperty('--color-secondary-rgb', toRgbChannels(secondary))
  root.style.setProperty('--theme-wash-a', washA)
  root.style.setProperty('--theme-wash-b', washB)
  root.style.setProperty('--theme-wash-base', washBase)
  root.style.setProperty('--theme-wash-opacity', '0')
}

export function initializeTheme() {
  const stored = readStoredThemeColor()
  if (!stored || isDefaultThemeColor(stored)) {
    resetThemeColor()
    return DEFAULT_THEME_COLOR
  }
  applyThemeColor(stored)
  return stored
}
