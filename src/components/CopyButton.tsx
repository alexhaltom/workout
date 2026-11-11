import { useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/clipboard'

type Props = {
  getText: () => string
  label: string
  copiedLabel?: string
  className?: string
}

export function CopyButton({
  getText,
  label,
  copiedLabel = 'Copied!',
  className = 'btn btn--primary',
}: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  async function handleClick() {
    const ok = await copyText(getText())
    setState(ok ? 'copied' : 'failed')
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2200)
  }

  return (
    <button type="button" className={className} onClick={handleClick} aria-live="polite">
      {state === 'copied'
        ? copiedLabel
        : state === 'failed'
          ? 'Copy failed — try Download'
          : label}
    </button>
  )
}
