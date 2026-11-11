export type ThemePref = 'dark' | 'light' | 'auto'

const KEY = 'set-theme'
const META_COLORS = { dark: '#090b0f', light: '#f4f1eb' }

export function getThemePref(): ThemePref {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'light' || value === 'auto' || value === 'dark') return value
  } catch {
    // storage unavailable: fall back to the default
  }
  return 'dark'
}

function resolved(pref: ThemePref): 'dark' | 'light' {
  if (pref !== 'auto') return pref
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function applyTheme(pref: ThemePref): void {
  document.documentElement.dataset.theme = pref
  const color = META_COLORS[resolved(pref)]
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', color))
}

export function setThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(KEY, pref)
  } catch {
    // ignore: the theme still applies for this visit
  }
  applyTheme(pref)
}
