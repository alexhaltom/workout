import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { downloadTextFile } from '../lib/download'
import {
  formatWorkoutMarkdown,
  workoutMarkdownFilename,
} from '../lib/markdown'
import { useStore } from '../store'
import type { WorkoutSession } from '../types'

const RECENT_LIMIT = 5

export function HomePage() {
  const navigate = useNavigate()
  const { routines, activeSession, sessions, startWorkout, getExercise } =
    useStore()
  const [showAllRecent, setShowAllRecent] = useState(false)
  const [exportedId, setExportedId] = useState<string | null>(null)
  const exportTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (exportTimer.current !== null) window.clearTimeout(exportTimer.current)
    }
  }, [])
  const completed = [...sessions]
    .filter((s) => s.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const recent = showAllRecent ? completed : completed.slice(0, RECENT_LIMIT)

  function handleExport(session: WorkoutSession) {
    const markdown = formatWorkoutMarkdown(
      session,
      (exerciseId) => getExercise(exerciseId)?.name ?? 'Exercise',
    )
    flushSync(() => {
      setExportedId(session.id)
    })
    downloadTextFile(workoutMarkdownFilename(session), markdown)
    if (exportTimer.current !== null) window.clearTimeout(exportTimer.current)
    exportTimer.current = window.setTimeout(() => {
      setExportedId((current) => (current === session.id ? null : current))
    }, 2000)
  }

  function handleStart(routineId: string) {
    flushSync(() => {
      startWorkout(routineId)
    })
    navigate('/workout')
  }

  return (
    <div className="page home">
      <section className="hero">
        <p className="hero__eyebrow">Workout tracker</p>
        <h1 className="hero__brand">
          SET<span>.</span>
        </h1>
        <p className="hero__lede">
          Build routines, log every set, rest on the clock, chase your personal
          bests.
        </p>
        {activeSession ? (
          <Link to="/workout" className="btn btn--primary">
            Resume {activeSession.routineName}
          </Link>
        ) : routines.length > 0 ? (
          <div className="hero__actions">
            {routines.slice(0, 3).map((routine) => (
              <button
                key={routine.id}
                type="button"
                className="btn btn--primary"
                onClick={() => handleStart(routine.id)}
              >
                Start {routine.name}
              </button>
            ))}
          </div>
        ) : (
          <Link to="/routines/new" className="btn btn--primary">
            Create your first routine
          </Link>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Routines</h2>
          <Link to="/routines" className="text-link">
            Manage
          </Link>
        </div>
        {routines.length === 0 ? (
          <p className="muted">No routines yet. Start with Push, Pull, Legs.</p>
        ) : (
          <ul className="routine-list">
            {routines.map((routine) => (
              <li key={routine.id}>
                <div>
                  <strong>{routine.name}</strong>
                  <span className="muted">
                    {routine.exerciseIds.length} exercises
                  </span>
                </div>
                {!activeSession && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => handleStart(routine.id)}
                  >
                    Start
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {completed.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>Recent</h2>
            {completed.length > RECENT_LIMIT && (
              <button
                type="button"
                className="text-link"
                onClick={() => setShowAllRecent((open) => !open)}
              >
                {showAllRecent
                  ? 'Show recent'
                  : `Show all ${completed.length}`}
              </button>
            )}
          </div>
          <ul className="history-list">
            {recent.map((session) => {
              const setCount = session.exercises.reduce(
                (n, e) => n + e.sets.length,
                0,
              )
              const exported = exportedId === session.id
              return (
                <li key={session.id}>
                  <div>
                    <strong>{session.routineName}</strong>
                    <span className="muted">
                      {new Date(session.completedAt!).toLocaleDateString()} ·{' '}
                      {setCount} sets
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small history-list__export"
                    aria-label={`Export ${session.routineName} as markdown`}
                    onClick={() => handleExport(session)}
                  >
                    {exported ? 'Exported' : 'Export'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
