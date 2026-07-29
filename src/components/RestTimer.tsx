import { useEffect, useState, type CSSProperties } from 'react'

const REST_SECONDS = 90

type RestTimerProps = {
  triggerKey: string | null
}

export function RestTimer({ triggerKey }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [runningForKey, setRunningForKey] = useState<string | null>(null)

  useEffect(() => {
    if (!triggerKey || triggerKey === runningForKey) return
    setRunningForKey(triggerKey)
    setSecondsLeft(REST_SECONDS)
  }, [triggerKey, runningForKey])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return

    const id = window.setTimeout(() => {
      setSecondsLeft((s) => (s === null ? null : s - 1))
    }, 1000)

    return () => window.clearTimeout(id)
  }, [secondsLeft])

  if (secondsLeft === null) return null

  const done = secondsLeft <= 0
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const progress = done ? 0 : secondsLeft / REST_SECONDS

  return (
    <div className={`rest-timer ${done ? 'rest-timer--done' : ''}`} role="status">
      <div
        className="rest-timer__ring"
        style={{ '--progress': progress } as CSSProperties}
      >
        <div className="rest-timer__face">
          <span className="rest-timer__label">{done ? 'Ready' : 'Rest'}</span>
          <span className="rest-timer__time">{done ? '0:00' : display}</span>
        </div>
      </div>
      <button
        type="button"
        className="btn btn--ghost rest-timer__skip"
        onClick={() => setSecondsLeft(null)}
      >
        {done ? 'Dismiss' : 'Skip rest'}
      </button>
    </div>
  )
}
