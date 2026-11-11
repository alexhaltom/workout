import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createId } from './lib/id'
import { getPersonalBest } from './lib/personalBest'
import type { ParsedPlan } from './lib/planFormat'
import { applyPlan, planProgress, type ImportMode } from './lib/planImport'
import { loadData, saveData } from './lib/storage'
import type {
  AppData,
  CoachProfile,
  Exercise,
  PersonalBest,
  Routine,
  SetEntry,
  Units,
  WeeklyPlan,
  WorkoutSession,
} from './types'

type StoreValue = {
  data: AppData
  exercises: Exercise[]
  routines: Routine[]
  sessions: WorkoutSession[]
  activeSession: WorkoutSession | null
  plan: WeeklyPlan | null
  units: Units
  getExercise: (id: string) => Exercise | undefined
  getRoutine: (id: string) => Routine | undefined
  getPb: (exerciseId: string) => PersonalBest | null
  addExercise: (name: string) => Exercise
  upsertRoutine: (input: {
    id?: string
    name: string
    exerciseIds: string[]
  }) => Routine
  deleteRoutine: (id: string) => void
  /** Starts a routine; uses the given plan day, or the first unfinished one for this routine. */
  startWorkout: (routineId: string, planDayId?: string) => WorkoutSession
  importPlan: (parsed: ParsedPlan, mode: ImportMode) => void
  clearPlan: () => void
  setUnits: (units: Units) => void
  setProfile: (profile: CoachProfile) => void
  addSet: (
    exerciseId: string,
    reps: number,
    weight: number,
  ) => SetEntry | null
  finishWorkout: () => void
  cancelWorkout: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const getExercise = useCallback(
    (id: string) => data.exercises.find((e) => e.id === id),
    [data.exercises],
  )

  const getRoutine = useCallback(
    (id: string) => data.routines.find((r) => r.id === id),
    [data.routines],
  )

  const getPb = useCallback(
    (exerciseId: string) => getPersonalBest(data.sessions, exerciseId),
    [data.sessions],
  )

  const addExercise = useCallback((name: string) => {
    const trimmed = name.trim()
    const existing = loadData().exercises.find(
      (e) => e.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) return existing

    const exercise: Exercise = { id: createId(), name: trimmed }
    setData((prev) => {
      const match = prev.exercises.find(
        (e) => e.name.toLowerCase() === trimmed.toLowerCase(),
      )
      if (match) return prev
      return { ...prev, exercises: [...prev.exercises, exercise] }
    })
    return exercise
  }, [])

  const upsertRoutine = useCallback(
    (input: { id?: string; name: string; exerciseIds: string[] }) => {
      const routine: Routine = {
        id: input.id ?? createId(),
        name: input.name.trim(),
        exerciseIds: input.exerciseIds,
      }

      setData((prev) => {
        const exists = prev.routines.some((r) => r.id === routine.id)
        return {
          ...prev,
          routines: exists
            ? prev.routines.map((r) => (r.id === routine.id ? routine : r))
            : [...prev.routines, routine],
        }
      })

      return routine
    },
    [],
  )

  const deleteRoutine = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      routines: prev.routines.filter((r) => r.id !== id),
      activeSessionId:
        prev.activeSessionId &&
        prev.sessions.find((s) => s.id === prev.activeSessionId)?.routineId ===
          id
          ? null
          : prev.activeSessionId,
    }))
  }, [])

  const startWorkout = useCallback(
    (routineId: string, planDayId?: string) => {
      const routine = data.routines.find((r) => r.id === routineId)
      const plan = data.plan
      const progress = planProgress(plan, data.sessions)
      const day = planDayId
        ? plan?.days.find((d) => d.id === planDayId)
        : progress.find((d) => !d.session && d.day.routineId === routineId)?.day

      if (!routine && !day) {
        throw new Error('Routine not found')
      }

      const session: WorkoutSession = {
        id: createId(),
        routineId,
        routineName: routine?.name ?? day!.name,
        startedAt: new Date().toISOString(),
        completedAt: null,
        units: data.units,
        exercises: day
          ? day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: [],
              targets: ex.sets,
              ...(ex.note ? { note: ex.note } : {}),
            }))
          : routine!.exerciseIds.map((exerciseId) => ({
              exerciseId,
              sets: [],
            })),
        ...(day && plan
          ? { planId: plan.id, planDayId: day.id, planDayLabel: day.label }
          : {}),
      }

      setData((prev) => ({
        ...prev,
        sessions: [...prev.sessions, session],
        activeSessionId: session.id,
      }))

      return session
    },
    [data.routines, data.plan, data.sessions, data.units],
  )

  const importPlan = useCallback((parsed: ParsedPlan, mode: ImportMode) => {
    setData((prev) => applyPlan(prev, parsed, mode))
  }, [])

  const clearPlan = useCallback(() => {
    setData((prev) => ({ ...prev, plan: null }))
  }, [])

  const setUnits = useCallback((units: Units) => {
    setData((prev) => ({ ...prev, units }))
  }, [])

  const setProfile = useCallback((profile: CoachProfile) => {
    setData((prev) => ({ ...prev, profile }))
  }, [])

  const addSet = useCallback(
    (exerciseId: string, reps: number, weight: number) => {
      const set: SetEntry = {
        id: createId(),
        reps,
        weight,
        completedAt: new Date().toISOString(),
      }

      let added = false
      setData((prev) => {
        if (!prev.activeSessionId) return prev
        added = true
        return {
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== prev.activeSessionId) return session
            return {
              ...session,
              exercises: session.exercises.map((ex) =>
                ex.exerciseId === exerciseId
                  ? { ...ex, sets: [...ex.sets, set] }
                  : ex,
              ),
            }
          }),
        }
      })

      return added ? set : null
    },
    [],
  )

  const finishWorkout = useCallback(() => {
    setData((prev) => {
      if (!prev.activeSessionId) return prev
      return {
        ...prev,
        activeSessionId: null,
        sessions: prev.sessions.map((session) =>
          session.id === prev.activeSessionId
            ? { ...session, completedAt: new Date().toISOString() }
            : session,
        ),
      }
    })
  }, [])

  const cancelWorkout = useCallback(() => {
    setData((prev) => {
      if (!prev.activeSessionId) return prev
      return {
        ...prev,
        activeSessionId: null,
        sessions: prev.sessions.filter((s) => s.id !== prev.activeSessionId),
      }
    })
  }, [])

  const activeSession = useMemo(
    () =>
      data.sessions.find((s) => s.id === data.activeSessionId) ?? null,
    [data.sessions, data.activeSessionId],
  )

  const value = useMemo<StoreValue>(
    () => ({
      data,
      exercises: data.exercises,
      routines: data.routines,
      sessions: data.sessions,
      activeSession,
      plan: data.plan,
      units: data.units,
      getExercise,
      getRoutine,
      getPb,
      addExercise,
      upsertRoutine,
      deleteRoutine,
      startWorkout,
      importPlan,
      clearPlan,
      setUnits,
      setProfile,
      addSet,
      finishWorkout,
      cancelWorkout,
    }),
    [
      data,
      activeSession,
      getExercise,
      getRoutine,
      getPb,
      addExercise,
      upsertRoutine,
      deleteRoutine,
      startWorkout,
      importPlan,
      clearPlan,
      setUnits,
      setProfile,
      addSet,
      finishWorkout,
      cancelWorkout,
    ],
  )

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  )
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
