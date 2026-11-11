export type Units = 'lbs' | 'kg'

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

/** A set the coach planned. Weight 0 means bodyweight. */
export type PlannedSet = {
  weight: number
  reps: number
}

export type SessionExercise = {
  exerciseId: string
  sets: SetEntry[]
  /** Planned sets copied from the weekly plan when the workout started. */
  targets?: PlannedSet[]
  note?: string
}

export type WorkoutSession = {
  id: string
  routineId: string
  routineName: string
  startedAt: string
  completedAt: string | null
  exercises: SessionExercise[]
  planId?: string
  planDayId?: string
  planDayLabel?: string
  units?: Units
}

export type PersonalBest = {
  exerciseId: string
  weight: number
  reps: number
  completedAt: string
}

export type PlanExercise = {
  exerciseId: string
  sets: PlannedSet[]
  note?: string
}

export type PlanDay = {
  id: string
  /** Full label from the plan, e.g. "Day 2: Pull". */
  label: string
  /** Workout name, e.g. "Pull". Matches a routine. */
  name: string
  routineId: string
  exercises: PlanExercise[]
}

export type WeeklyPlan = {
  id: string
  title: string
  importedAt: string
  notes?: string
  days: PlanDay[]
}

export type CoachProfile = {
  goal: string
  daysPerWeek: string
  sessionLength: string
  experience: string
  equipment: string
  limitations: string
  currentLifts: string
  other: string
}

export type AppData = {
  exercises: Exercise[]
  routines: Routine[]
  sessions: WorkoutSession[]
  activeSessionId: string | null
  plan: WeeklyPlan | null
  units: Units
  profile: CoachProfile
}
