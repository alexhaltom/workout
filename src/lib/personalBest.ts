import type { PersonalBest, WorkoutSession } from '../types'

/** Best set = highest weight; ties broken by highest reps. */
export function getPersonalBest(
  sessions: WorkoutSession[],
  exerciseId: string,
): PersonalBest | null {
  let best: PersonalBest | null = null

  for (const session of sessions) {
    const exercise = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (!exercise) continue

    for (const set of exercise.sets) {
      if (
        !best ||
        set.weight > best.weight ||
        (set.weight === best.weight && set.reps > best.reps)
      ) {
        best = {
          exerciseId,
          weight: set.weight,
          reps: set.reps,
          completedAt: set.completedAt,
        }
      }
    }
  }

  return best
}

export function getLastSet(
  sessions: WorkoutSession[],
  exerciseId: string,
): { weight: number; reps: number } | null {
  let latest: { weight: number; reps: number; at: string } | null = null

  for (const session of sessions) {
    const exercise = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (!exercise) continue

    for (const set of exercise.sets) {
      if (!latest || set.completedAt > latest.at) {
        latest = {
          weight: set.weight,
          reps: set.reps,
          at: set.completedAt,
        }
      }
    }
  }

  return latest ? { weight: latest.weight, reps: latest.reps } : null
}
