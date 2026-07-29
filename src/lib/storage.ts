import type { AppData } from '../types'

const STORAGE_KEY = 'set-tracker-data-v1'

const defaultData: AppData = {
  exercises: [],
  routines: [],
  sessions: [],
  activeSessionId: null,
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(defaultData)
    const parsed = JSON.parse(raw) as AppData
    return {
      ...structuredClone(defaultData),
      ...parsed,
      exercises: parsed.exercises ?? [],
      routines: parsed.routines ?? [],
      sessions: parsed.sessions ?? [],
      activeSessionId: parsed.activeSessionId ?? null,
    }
  } catch {
    return structuredClone(defaultData)
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
