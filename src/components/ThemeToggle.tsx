import { useEffect, useState } from 'react'
import { applyTheme, getThemePref, setThemePref, type ThemePref } from '../lib/theme'

const NEXT: Record<ThemePref, ThemePref> = { dark: 'light', light: 'auto', auto: 'dark' }
const LABEL: Record<ThemePref, string> = { dark: 'Dark', light: 'Light', auto: 'Auto' }

function Icon({ pref }: { pref: ThemePref }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (pref === 'dark') {
    return (
      <svg {...common}>
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
    )
  }
  if (pref === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>(getThemePref)

  useEffect(() => {
    if (pref !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => applyTheme('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [pref])

  function handleClick() {
    const next = NEXT[pref]
    setPref(next)
    setThemePref(next)
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleClick}
      aria-label={`Theme: ${LABEL[pref]}. Switch to ${LABEL[NEXT[pref]]}.`}
      title={`Theme: ${LABEL[pref]}`}
    >
      <Icon pref={pref} />
      <span>{LABEL[pref]}</span>
    </button>
  )
}
