import type { Exercise, PersonalBest, WorkoutSession } from '../types'
import { getPersonalBest } from './personalBest'

export type WorkoutSummary = {
  totalWorkouts: number
  totalSets: number
  totalVolume: number
  thisWeekWorkouts: number
  lastWorkoutAt: string | null
}

export type WeeklyCount = {
  weekStart: string
  label: string
  count: number
}

export type ExerciseProgress = {
  exerciseId: string
  name: string
  pb: PersonalBest
  sessionsLogged: number
  recentMaxWeights: { date: string; weight: number }[]
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - diff)
  return d
}

function weekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function getCompletedSessions(
  sessions: WorkoutSession[],
): WorkoutSession[] {
  return sessions.filter((s) => s.completedAt !== null)
}

export function getWorkoutSummary(sessions: WorkoutSession[]): WorkoutSummary {
  const completed = getCompletedSessions(sessions)
  const weekStart = startOfWeek(new Date()).getTime()

  let totalSets = 0
  let totalVolume = 0
  let thisWeekWorkouts = 0
  let lastWorkoutAt: string | null = null

  for (const session of completed) {
    const completedAt = session.completedAt!
    if (!lastWorkoutAt || completedAt > lastWorkoutAt) {
      lastWorkoutAt = completedAt
    }
    if (new Date(completedAt).getTime() >= weekStart) {
      thisWeekWorkouts += 1
    }

    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        totalSets += 1
        totalVolume += set.weight * set.reps
      }
    }
  }

  return {
    totalWorkouts: completed.length,
    totalSets,
    totalVolume,
    thisWeekWorkouts,
    lastWorkoutAt,
  }
}

export function getWeeklyWorkoutCounts(
  sessions: WorkoutSession[],
  weeks = 8,
): WeeklyCount[] {
  const completed = getCompletedSessions(sessions)
  const currentWeek = startOfWeek(new Date())
  const buckets: WeeklyCount[] = []

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = new Date(currentWeek)
    weekStart.setDate(currentWeek.getDate() - i * 7)
    buckets.push({
      weekStart: weekStart.toISOString(),
      label: weekLabel(weekStart),
      count: 0,
    })
  }

  for (const session of completed) {
    const completedAt = new Date(session.completedAt!)
    const sessionWeek = startOfWeek(completedAt).getTime()
    const bucket = buckets.find(
      (b) => new Date(b.weekStart).getTime() === sessionWeek,
    )
    if (bucket) bucket.count += 1
  }

  return buckets
}

export function getAllPersonalBests(
  sessions: WorkoutSession[],
  exercises: Exercise[],
): PersonalBest[] {
  return exercises
    .map((exercise) => getPersonalBest(sessions, exercise.id))
    .filter((pb): pb is PersonalBest => pb !== null)
    .sort((a, b) => b.weight - a.weight || b.reps - a.reps)
}

export function getExerciseProgress(
  sessions: WorkoutSession[],
  exercises: Exercise[],
): ExerciseProgress[] {
  const completed = getCompletedSessions(sessions)

  return exercises
    .map((exercise) => {
      const pb = getPersonalBest(sessions, exercise.id)
      if (!pb) return null

      const sessionMaxes: { date: string; weight: number }[] = []

      for (const session of completed) {
        const entry = session.exercises.find(
          (e) => e.exerciseId === exercise.id,
        )
        if (!entry || entry.sets.length === 0) continue

        const maxWeight = Math.max(...entry.sets.map((s) => s.weight))
        sessionMaxes.push({
          date: session.completedAt!,
          weight: maxWeight,
        })
      }

      sessionMaxes.sort((a, b) => a.date.localeCompare(b.date))

      return {
        exerciseId: exercise.id,
        name: exercise.name,
        pb,
        sessionsLogged: sessionMaxes.length,
        recentMaxWeights: sessionMaxes.slice(-8),
      }
    })
    .filter((row): row is ExerciseProgress => row !== null)
    .sort((a, b) => b.pb.weight - a.pb.weight)
}
