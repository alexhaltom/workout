import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RestTimer } from '../components/RestTimer'
import { useStore } from '../store'

export function WorkoutPage() {
  const navigate = useNavigate()
  const {
    activeSession,
    getExercise,
    getPb,
    addSet,
    finishWorkout,
    cancelWorkout,
  } = useStore()

  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [timerKey, setTimerKey] = useState<string | null>(null)
  const [justLogged, setJustLogged] = useState(false)

  useEffect(() => {
    if (!activeSession) {
      navigate('/')
      return
    }
    if (!activeExerciseId) {
      setActiveExerciseId(activeSession.exercises[0]?.exerciseId ?? null)
    }
  }, [activeSession, activeExerciseId, navigate])

  useEffect(() => {
    if (!activeExerciseId || !activeSession) return
    const pb = getPb(activeExerciseId)
    const current = activeSession.exercises.find(
      (e) => e.exerciseId === activeExerciseId,
    )
    const lastInSession = current?.sets[current.sets.length - 1]

    if (lastInSession) {
      setWeight(String(lastInSession.weight))
      setReps(String(lastInSession.reps))
    } else if (pb) {
      setWeight(String(pb.weight))
      setReps(String(pb.reps))
    } else {
      setWeight('')
      setReps('')
    }
    setJustLogged(false)
    // Prefill only when switching lifts, not after every logged set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExerciseId])

  if (!activeSession || !activeExerciseId) {
    return null
  }

  const activeExercise = activeSession.exercises.find(
    (e) => e.exerciseId === activeExerciseId,
  )
  const exerciseName = getExercise(activeExerciseId)?.name ?? 'Exercise'
  const pb = getPb(activeExerciseId)

  function handleLogSet(e: FormEvent) {
    e.preventDefault()
    const repsNum = Number(reps)
    const weightNum = Number(weight)
    if (!Number.isFinite(repsNum) || repsNum <= 0) return
    if (!Number.isFinite(weightNum) || weightNum < 0) return

    const set = addSet(activeExerciseId!, repsNum, weightNum)
    if (set) {
      setTimerKey(set.id)
      setJustLogged(true)
    }
  }

  function handleFinish() {
    finishWorkout()
    navigate('/')
  }

  function handleCancel() {
    if (confirm('Cancel this workout and discard logged sets?')) {
      cancelWorkout()
      navigate('/')
    }
  }

  return (
    <div className="page workout">
      <div className="page__header">
        <div>
          <p className="eyebrow">In session</p>
          <h1>{activeSession.routineName}</h1>
          <p className="muted">
            Started{' '}
            {new Date(activeSession.startedAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn--ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={handleFinish}>
            Finish
          </button>
        </div>
      </div>

      <div className="workout-layout">
        <aside className="workout-nav">
          <h2>Today&apos;s lifts</h2>
          <ul>
            {activeSession.exercises.map((ex, index) => {
              const name = getExercise(ex.exerciseId)?.name ?? 'Exercise'
              const isActive = ex.exerciseId === activeExerciseId
              return (
                <li key={ex.exerciseId}>
                  <button
                    type="button"
                    className={`workout-nav__item ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveExerciseId(ex.exerciseId)}
                  >
                    <span className="workout-nav__n">{index + 1}</span>
                    <span className="workout-nav__name">{name}</span>
                    <span className="workout-nav__sets">{ex.sets.length}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <section className="workout-stage">
          <div className="lift-header">
            <h2>{exerciseName}</h2>
            {pb ? (
              <p className="pb-badge">
                PB <strong>{pb.weight}</strong> × <strong>{pb.reps}</strong>
              </p>
            ) : (
              <p className="muted">No personal best yet — set the bar.</p>
            )}
          </div>

          <form className="set-form" onSubmit={handleLogSet}>
            <label className="field">
              <span>Weight</span>
              <input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={pb ? String(pb.weight) : '0'}
              />
            </label>
            <label className="field">
              <span>Reps</span>
              <input
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={pb ? String(pb.reps) : '0'}
              />
            </label>
            <button type="submit" className="btn btn--primary set-form__submit">
              Log set
            </button>
          </form>

          {pb && !justLogged && (activeExercise?.sets.length ?? 0) === 0 && (
            <p className="hint">
              Suggested from your PB: {pb.weight} × {pb.reps}
            </p>
          )}

          <RestTimer triggerKey={timerKey} />

          <div className="sets-log">
            <h3>Sets this session</h3>
            {(activeExercise?.sets.length ?? 0) === 0 ? (
              <p className="muted">No sets logged yet.</p>
            ) : (
              <ol className="sets-list">
                {activeExercise!.sets.map((set, index) => (
                  <li key={set.id}>
                    <span className="sets-list__n">Set {index + 1}</span>
                    <span>
                      {set.weight} × {set.reps}
                    </span>
                    <span className="muted">
                      {new Date(set.completedAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>

      <p className="workout-footer">
        <Link to="/">Home</Link>
      </p>
    </div>
  )
}
