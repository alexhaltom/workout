import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'

export function RoutineEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { routines, exercises, getRoutine, addExercise, upsertRoutine } =
    useStore()
  const existing = id && id !== 'new' ? getRoutine(id) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [exerciseIds, setExerciseIds] = useState<string[]>(
    existing?.exerciseIds ?? [],
  )
  const [newExercise, setNewExercise] = useState('')
  const [error, setError] = useState('')

  const selected = useMemo(
    () =>
      exerciseIds
        .map((eid) => exercises.find((e) => e.id === eid))
        .filter(Boolean),
    [exerciseIds, exercises],
  )

  const available = exercises.filter((e) => !exerciseIds.includes(e.id))

  function handleAddExisting(exerciseId: string) {
    setExerciseIds((prev) => [...prev, exerciseId])
  }

  function handleCreateExercise(e: FormEvent) {
    e.preventDefault()
    if (!newExercise.trim()) return
    const exercise = addExercise(newExercise)
    setExerciseIds((prev) =>
      prev.includes(exercise.id) ? prev : [...prev, exercise.id],
    )
    setNewExercise('')
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setExerciseIds((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Give this routine a name.')
      return
    }
    if (exerciseIds.length === 0) {
      setError('Add at least one exercise.')
      return
    }

    upsertRoutine({
      id: existing?.id,
      name,
      exerciseIds,
    })
    navigate('/routines')
  }

  if (id && id !== 'new' && !existing) {
    return (
      <div className="page">
        <p>Routine not found.</p>
        <Link to="/routines">Back</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{existing ? 'Edit routine' : 'New routine'}</h1>
          <p className="muted">
            Name the day and stack the lifts you want to hit.
          </p>
        </div>
        <Link to="/routines" className="btn btn--ghost">
          Cancel
        </Link>
      </div>

      <form className="form-stack" onSubmit={handleSave}>
        <label className="field">
          <span>Routine name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push, Pull, Legs..."
            autoFocus
          />
        </label>

        <div className="field">
          <span>Exercises</span>
          {selected.length === 0 ? (
            <p className="muted">No exercises yet — add some below.</p>
          ) : (
            <ol className="ordered-exercises">
              {selected.map((exercise, index) =>
                exercise ? (
                  <li key={exercise.id}>
                    <span>{exercise.name}</span>
                    <div className="ordered-exercises__actions">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => moveExercise(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => moveExercise(index, 1)}
                        disabled={index === selected.length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--danger"
                        onClick={() =>
                          setExerciseIds((prev) =>
                            prev.filter((eid) => eid !== exercise.id),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ) : null,
              )}
            </ol>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            {existing ? 'Save changes' : 'Create routine'}
          </button>
        </div>
      </form>

      <div className="panel">
        <h2>Add exercise</h2>
        <form onSubmit={handleCreateExercise} className="inline-form">
          <input
            value={newExercise}
            onChange={(e) => setNewExercise(e.target.value)}
            placeholder="Bench Press, Lat Pulldown..."
          />
          <button type="submit" className="btn btn--secondary">
            Add new
          </button>
        </form>
        {available.length > 0 && (
          <div className="pick-list">
            <p className="muted">Or pick an existing lift:</p>
            <div className="chip-row">
              {available.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  className="chip"
                  onClick={() => handleAddExisting(exercise.id)}
                >
                  + {exercise.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!existing && routines.length === 0 && (
        <p className="hint">
          Tip: create three routines named Push, Pull, and Legs to get a classic
          split going.
        </p>
      )}
    </div>
  )
}
