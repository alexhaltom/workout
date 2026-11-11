import { Link, Navigate, useParams } from 'react-router-dom'
import { CopyButton } from '../components/CopyButton'
import { buildCheckIn } from '../lib/coach'
import { downloadTextFile } from '../lib/download'
import { formatWorkoutMarkdown, workoutMarkdownFilename } from '../lib/markdown'
import { planProgress } from '../lib/planImport'
import { useStore } from '../store'

export function ResultsPage() {
  const { id } = useParams()
  const { data, sessions, getExercise, plan } = useStore()
  const session = sessions.find((s) => s.id === id)

  if (!session) return <Navigate to="/" replace />

  const exerciseName = (exerciseId: string) => getExercise(exerciseId)?.name ?? 'Exercise'
  const progress =
    plan && session.planId === plan.id ? planProgress(plan, sessions) : []
  const done = progress.filter((d) => d.session).length
  const weekComplete = progress.length > 0 && done === progress.length

  let setCount = 0
  let planned = 0
  let hit = 0
  for (const ex of session.exercises) {
    setCount += ex.sets.length
    ex.targets?.forEach((t, i) => {
      planned += 1
      const actual = ex.sets[i]
      if (actual && actual.weight >= t.weight && actual.reps >= t.reps) hit += 1
    })
  }

  return (
    <div className="page results">
      <div className="page__header">
        <div>
          <p className="eyebrow">{session.completedAt ? 'Workout complete' : 'In progress'}</p>
          <h1>{session.planDayLabel ?? session.routineName}</h1>
          <p className="muted">
            {new Date(session.completedAt ?? session.startedAt).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="stats-grid results__stats">
        <div className="stat-tile">
          <span className="stat-tile__label">Sets</span>
          <span className="stat-tile__value">{setCount}</span>
        </div>
        {planned > 0 && (
          <div className="stat-tile">
            <span className="stat-tile__label">Targets hit</span>
            <span className="stat-tile__value">
              {hit}/{planned}
            </span>
          </div>
        )}
        {progress.length > 0 && (
          <div className="stat-tile">
            <span className="stat-tile__label">This week</span>
            <span className="stat-tile__value">
              {done}/{progress.length}
            </span>
          </div>
        )}
      </div>

      <section className="panel coach-step">
        <h2>{weekComplete ? 'Week done — get next week’s plan' : 'Check in with your AI coach'}</h2>
        <p className="muted">
          {weekComplete
            ? 'Copy your whole week and paste it into your coach chat. It already asks for next week’s plan in the SET. format.'
            : 'Copy your results and paste them into the same chat that wrote your plan.'}
        </p>
        <div className="button-row">
          <CopyButton
            label={weekComplete ? 'Copy week for coach' : 'Copy results for coach'}
            getText={() => buildCheckIn(data, session, exerciseName)}
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              downloadTextFile(
                workoutMarkdownFilename(session),
                formatWorkoutMarkdown(session, exerciseName),
              )
            }
          >
            Download .md
          </button>
        </div>
        <p className="muted">
          Coach sent back a plan?{' '}
          <Link to="/import" className="text-link">
            Import it
          </Link>
        </p>
      </section>

      <p className="workout-footer">
        <Link to="/">Home</Link>
      </p>
    </div>
  )
}
