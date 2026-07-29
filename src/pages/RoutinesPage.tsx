import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export function RoutinesPage() {
  const navigate = useNavigate()
  const { routines, getExercise, deleteRoutine, activeSession, startWorkout } =
    useStore()

  function handleStart(routineId: string) {
    flushSync(() => {
      startWorkout(routineId)
    })
    navigate('/workout')
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Routines</h1>
          <p className="muted">Push, Pull, Legs — or whatever split you run.</p>
        </div>
        <Link to="/routines/new" className="btn btn--primary">
          New routine
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="empty">
          <p>No routines yet.</p>
          <Link to="/routines/new" className="btn btn--secondary">
            Create Push / Pull / Legs
          </Link>
        </div>
      ) : (
        <ul className="routine-cards">
          {routines.map((routine) => (
            <li key={routine.id} className="routine-card">
              <div className="routine-card__top">
                <h2>{routine.name}</h2>
                <div className="routine-card__actions">
                  <Link
                    to={`/routines/${routine.id}`}
                    className="btn btn--ghost"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn--ghost btn--danger"
                    onClick={() => {
                      if (
                        confirm(`Delete "${routine.name}"? This cannot be undone.`)
                      ) {
                        deleteRoutine(routine.id)
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <ol className="exercise-chip-list">
                {routine.exerciseIds.map((id, index) => (
                  <li key={id}>
                    <span className="exercise-chip__n">{index + 1}</span>
                    {getExercise(id)?.name ?? 'Unknown'}
                  </li>
                ))}
              </ol>
              {!activeSession && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => handleStart(routine.id)}
                >
                  Start workout
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
