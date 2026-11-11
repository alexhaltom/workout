import type {
  AppData,
  Exercise,
  PlanDay,
  Routine,
  WeeklyPlan,
  WorkoutSession,
} from '../types'
import { createId } from './id'
import { normalizeName, type ParsedPlan } from './planFormat'

export type ImportMode = 'new-week' | 'update-week'

export type PlanPreviewDay = {
  label: string
  routineName: string
  routineIsNew: boolean
  alreadyDone: boolean
  exercises: {
    name: string
    matchedName: string | null
    sets: { weight: number; reps: number }[]
    note?: string
  }[]
}

function findExercise(exercises: Exercise[], name: string): Exercise | undefined {
  const key = normalizeName(name)
  return (
    exercises.find((e) => e.name.trim().toLowerCase() === name.trim().toLowerCase()) ??
    exercises.find((e) => normalizeName(e.name) === key)
  )
}

function findRoutine(routines: Routine[], name: string): Routine | undefined {
  const key = normalizeName(name)
  return routines.find((r) => normalizeName(r.name) === key)
}

export type DayStatus = {
  day: PlanDay
  session: WorkoutSession | null
}

/** Each plan day with the completed session that fulfilled it (if any). */
export function planProgress(
  plan: WeeklyPlan | null,
  sessions: WorkoutSession[],
): DayStatus[] {
  if (!plan) return []
  return plan.days.map((day) => ({
    day,
    session:
      sessions.find(
        (s) => s.planId === plan.id && s.planDayId === day.id && s.completedAt,
      ) ?? null,
  }))
}

export function nextPlanDay(
  plan: WeeklyPlan | null,
  sessions: WorkoutSession[],
): PlanDay | null {
  return planProgress(plan, sessions).find((d) => !d.session)?.day ?? null
}

/** Mid-week (some days done, some not) defaults to updating the current week. */
export function defaultImportMode(data: AppData): ImportMode {
  const progress = planProgress(data.plan, data.sessions)
  const done = progress.filter((d) => d.session).length
  return done > 0 && done < progress.length ? 'update-week' : 'new-week'
}

function doneDayKeys(data: AppData): Set<string> {
  return new Set(
    planProgress(data.plan, data.sessions)
      .filter((d) => d.session)
      .map((d) => normalizeName(d.day.label)),
  )
}

export function previewPlan(
  data: AppData,
  parsed: ParsedPlan,
  mode: ImportMode,
): PlanPreviewDay[] {
  const done = mode === 'update-week' ? doneDayKeys(data) : new Set<string>()
  return parsed.days.map((day) => ({
    label: day.label,
    routineName: day.name,
    routineIsNew: !findRoutine(data.routines, day.name),
    alreadyDone: done.has(normalizeName(day.label)),
    exercises: day.exercises.map((ex) => ({
      name: ex.name,
      matchedName: findExercise(data.exercises, ex.name)?.name ?? null,
      sets: ex.sets,
      note: ex.note,
    })),
  }))
}

/**
 * Apply an imported plan: create missing exercises, create/update one routine
 * per workout name, and store the plan. In update-week mode the plan id and
 * day ids are kept for matching day labels, so completed days stay completed.
 */
export function applyPlan(
  prev: AppData,
  parsed: ParsedPlan,
  mode: ImportMode,
): AppData {
  const exercises = [...prev.exercises]
  const routines = [...prev.routines]

  const exerciseIdFor = (name: string): string => {
    const found = findExercise(exercises, name)
    if (found) return found.id
    const created: Exercise = { id: createId(), name: name.trim() }
    exercises.push(created)
    return created.id
  }

  // Union of exercises per workout name, in plan order.
  const routineExercises = new Map<string, { name: string; ids: string[] }>()

  const draftDays = parsed.days.map((day) => {
    const planExercises = day.exercises.map((ex) => ({
      exerciseId: exerciseIdFor(ex.name),
      sets: ex.sets,
      ...(ex.note ? { note: ex.note } : {}),
    }))
    const key = normalizeName(day.name)
    const entry = routineExercises.get(key) ?? { name: day.name, ids: [] }
    for (const ex of planExercises) {
      if (!entry.ids.includes(ex.exerciseId)) entry.ids.push(ex.exerciseId)
    }
    routineExercises.set(key, entry)
    return { day, key, planExercises }
  })

  const routineIdByKey = new Map<string, string>()
  for (const [key, entry] of routineExercises) {
    const existing = findRoutine(routines, entry.name)
    if (existing) {
      const index = routines.indexOf(existing)
      routines[index] = { ...existing, exerciseIds: entry.ids }
      routineIdByKey.set(key, existing.id)
    } else {
      const routine: Routine = { id: createId(), name: entry.name, exerciseIds: entry.ids }
      routines.push(routine)
      routineIdByKey.set(key, routine.id)
    }
  }

  const keepIds = mode === 'update-week' && prev.plan
  const oldDays = keepIds ? prev.plan!.days : []

  const days: PlanDay[] = draftDays.map(({ day, key, planExercises }) => {
    const old = oldDays.find(
      (d) => normalizeName(d.label) === normalizeName(day.label),
    )
    return {
      id: old?.id ?? createId(),
      label: day.label,
      name: day.name,
      routineId: routineIdByKey.get(key)!,
      exercises: planExercises,
    }
  })

  const plan: WeeklyPlan = {
    id: keepIds ? prev.plan!.id : createId(),
    title: parsed.title,
    importedAt: new Date().toISOString(),
    ...(parsed.notes.length ? { notes: parsed.notes.join('\n') } : {}),
    days,
  }

  return {
    ...prev,
    exercises,
    routines,
    plan,
    units: parsed.units ?? prev.units,
  }
}
