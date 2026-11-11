import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { CopyButton } from '../components/CopyButton'
import { buildWeekSummary } from '../lib/coach'
import { downloadTextFile } from '../lib/download'
import {
  formatWorkoutMarkdown,
  workoutMarkdownFilename,
} from '../lib/markdown'
import { planProgress } from '../lib/planImport'
import { useStore } from '../store'
import type { WorkoutSession } from '../types'

const RECENT_LIMIT = 5

export function HomePage() {
  const navigate = useNavigate()
  const {
    data,
    routines,
    activeSession,
    sessions,
    startWorkout,
    getExercise,
    plan,
    clearPlan,
  } = useStore()
  const progress = planProgress(plan, sessions)
  const nextDay = progress.find((d) => !d.session)?.day ?? null
  const weekDone = progress.length > 0 && !nextDay
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

  function handleStart(routineId: string, planDayId?: string) {
    flushSync(() => {
      startWorkout(routineId, planDayId)
    })
    navigate('/workout')
  }

  const exerciseName = (exerciseId: string) =>
    getExercise(exerciseId)?.name ?? 'Exercise'

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
            Resume {activeSession.planDayLabel ?? activeSession.routineName}
          </Link>
        ) : nextDay ? (
          <div className="hero__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => handleStart(nextDay.routineId, nextDay.id)}
            >
              Start {nextDay.label}
            </button>
          </div>
        ) : weekDone ? (
          <div className="hero__actions">
            <CopyButton
              label="Copy week for coach"
              getText={() => buildWeekSummary(data, exerciseName)}
            />
            <Link to="/import" className="btn btn--secondary">
              Import next week
            </Link>
          </div>
        ) : routines.length === 0 ? (
          <div className="hero__actions">
            <Link to="/coach" className="btn btn--primary">
              Set up with an AI coach
            </Link>
            <Link to="/routines/new" className="btn btn--ghost">
              Build a routine myself
            </Link>
          </div>
        ) : (
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
        )}
      </section>

      {plan ? (
        <section className="section">
          <div className="section__head">
            <div>
              <h2>This week</h2>
              <span className="muted">{plan.title}</span>
            </div>
            <Link to="/import" className="text-link">
              Import plan
            </Link>
          </div>
          <ul className="routine-list plan-days">
            {progress.map(({ day, session }) => {
              const isNext = nextDay?.id === day.id
              return (
                <li key={day.id} className={session ? 'is-done' : isNext ? 'is-next' : ''}>
                  <div>
                    <strong>
                      {session ? '✓ ' : ''}
                      {day.label}
                    </strong>
                    <span className="muted">
                      {session
                        ? `Done ${new Date(session.completedAt!).toLocaleDateString(undefined, { weekday: 'short' })}`
                        : `${day.exercises.length} exercise${day.exercises.length === 1 ? '' : 's'} · ${day.exercises.reduce((n, e) => n + e.sets.length, 0)} sets`}
                    </span>
                  </div>
                  {session ? (
                    <Link to={`/results/${session.id}`} className="btn btn--ghost btn--small">
                      Results
                    </Link>
                  ) : (
                    !activeSession && (
                      <button
                        type="button"
                        className={`btn ${isNext ? 'btn--primary' : 'btn--ghost'}`}
                        onClick={() => handleStart(day.routineId, day.id)}
                      >
                        Start
                      </button>
                    )
                  )}
                </li>
              )
            })}
          </ul>
          <div className="button-row plan-actions">
            <CopyButton
              className="btn btn--ghost btn--small"
              label={weekDone ? 'Copy week for coach' : 'Copy week so far'}
              getText={() => buildWeekSummary(data, exerciseName)}
            />
            <button
              type="button"
              className="btn btn--ghost btn--small btn--danger"
              onClick={() => {
                if (confirm('Remove this week’s plan? Your logged workouts stay.')) clearPlan()
              }}
            >
              Remove plan
            </button>
          </div>
        </section>
      ) : (
        routines.length > 0 && (
          <section className="section">
            <div className="panel coach-cta">
              <div>
                <h2>Train with an AI coach</h2>
                <p className="muted">
                  Get a weekly plan from ChatGPT, Claude, Gemini, or any agent. Targets
                  load set by set, and results copy back in one tap.
                </p>
              </div>
              <Link to="/coach" className="btn btn--secondary">
                Set up
              </Link>
            </div>
          </section>
        )
      )}

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
                    <Link to={`/results/${session.id}`}>
                      <strong>{session.planDayLabel ?? session.routineName}</strong>
                    </Link>
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
