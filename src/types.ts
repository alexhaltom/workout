export type Exercise = {
  id: string
  name: string
}

export type Routine = {
  id: string
  name: string
  exerciseIds: string[]
}

export type SetEntry = {
  id: string
  reps: number
  weight: number
  completedAt: string
}

export type SessionExercise = {
  exerciseId: string
  sets: SetEntry[]
}

export type WorkoutSession = {
  id: string
  routineId: string
  routineName: string
  startedAt: string
  completedAt: string | null
  exercises: SessionExercise[]
}

export type PersonalBest = {
  exerciseId: string
  weight: number
  reps: number
  completedAt: string
}

export type AppData = {
  exercises: Exercise[]
  routines: Routine[]
  sessions: WorkoutSession[]
  activeSessionId: string | null
}
