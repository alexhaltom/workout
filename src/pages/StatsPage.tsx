import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getAllPersonalBests,
  getExerciseProgress,
  getWeeklyWorkoutCounts,
  getWorkoutSummary,
} from '../lib/stats'
import { useStore } from '../store'

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(volume >= 10000 ? 0 : 1)}k`
  }
  return String(Math.round(volume))
}

function Sparkline({
  values,
}: {
  values: number[]
}) {
  if (values.length === 0) {
    return <div className="sparkline sparkline--empty" />
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)

  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 80 - 10
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      className="sparkline"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        points={points}
      />
    </svg>
  )
}

export function StatsPage() {
  const { sessions, exercises, getExercise } = useStore()

  const summary = useMemo(() => getWorkoutSummary(sessions), [sessions])
  const weekly = useMemo(() => getWeeklyWorkoutCounts(sessions), [sessions])
  const personalBests = useMemo(
    () => getAllPersonalBests(sessions, exercises),
    [sessions, exercises],
  )
  const progress = useMemo(
    () => getExerciseProgress(sessions, exercises),
    [sessions, exercises],
  )

  const maxWeek = Math.max(...weekly.map((w) => w.count), 1)
  const hasData = summary.totalWorkouts > 0

  return (
    <div className="page stats">
      <div className="page__header">
        <div>
          <h1>Stats</h1>
          <p className="muted">Workouts, volume, and personal bests over time.</p>
        </div>
      </div>

      {!hasData ? (
        <div className="empty">
          <p>No completed workouts yet — finish a session to see progress here.</p>
          <Link to="/" className="btn btn--secondary">
            Go train
          </Link>
        </div>
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-tile">
              <span className="stat-tile__label">Workouts</span>
              <strong className="stat-tile__value">{summary.totalWorkouts}</strong>
            </article>
            <article className="stat-tile">
              <span className="stat-tile__label">This week</span>
              <strong className="stat-tile__value">
                {summary.thisWeekWorkouts}
              </strong>
            </article>
            <article className="stat-tile">
              <span className="stat-tile__label">Sets logged</span>
              <strong className="stat-tile__value">{summary.totalSets}</strong>
            </article>
            <article className="stat-tile">
              <span className="stat-tile__label">Total volume</span>
              <strong className="stat-tile__value">
                {formatVolume(summary.totalVolume)}
              </strong>
              <span className="stat-tile__hint">weight × reps</span>
            </article>
          </section>

          <section className="section panel stats-panel">
            <div className="section__head">
              <h2>Weekly workouts</h2>
              <span className="muted">Last 8 weeks</span>
            </div>
            <div className="week-chart" role="img" aria-label="Weekly workout counts">
              {weekly.map((week) => (
                <div key={week.weekStart} className="week-chart__col">
                  <div className="week-chart__bar-wrap">
                    <div
                      className="week-chart__bar"
                      style={{
                        height: `${Math.max((week.count / maxWeek) * 100, week.count > 0 ? 8 : 0)}%`,
                      }}
                      title={`${week.count} workouts`}
                    />
                  </div>
                  <span className="week-chart__count">{week.count}</span>
                  <span className="week-chart__label">{week.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="section panel stats-panel">
            <div className="section__head">
              <h2>Personal bests</h2>
            </div>
            {personalBests.length === 0 ? (
              <p className="muted">No PBs yet.</p>
            ) : (
              <ul className="pb-list">
                {personalBests.map((pb) => (
                  <li key={pb.exerciseId}>
                    <div>
                      <strong>
                        {getExercise(pb.exerciseId)?.name ?? 'Exercise'}
                      </strong>
                      <span className="muted">
                        {new Date(pb.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="pb-list__lift">
                      {pb.weight} × {pb.reps}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section panel stats-panel">
            <div className="section__head">
              <h2>Lift progress</h2>
              <span className="muted">Session max weight</span>
            </div>
            {progress.length === 0 ? (
              <p className="muted">Log the same lift across sessions to see trends.</p>
            ) : (
              <ul className="progress-list">
                {progress.map((row) => (
                  <li key={row.exerciseId}>
                    <div className="progress-list__meta">
                      <strong>{row.name}</strong>
                      <span className="muted">
                        PB {row.pb.weight} × {row.pb.reps} · {row.sessionsLogged}{' '}
                        sessions
                      </span>
                    </div>
                    <Sparkline
                      values={row.recentMaxWeights.map((point) => point.weight)}
                    />
                    <span className="progress-list__latest">
                      {row.recentMaxWeights.at(-1)?.weight ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {summary.lastWorkoutAt && (
            <p className="hint">
              Last workout:{' '}
              {new Date(summary.lastWorkoutAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
        </>
      )}
    </div>
  )
}
