import type { AppData, CoachProfile } from '../types'

const STORAGE_KEY = 'set-tracker-data-v1'

export const emptyProfile: CoachProfile = {
  goal: '',
  daysPerWeek: '',
  sessionLength: '',
  experience: '',
  equipment: '',
  limitations: '',
  currentLifts: '',
  other: '',
}

const defaultData: AppData = {
  exercises: [],
  routines: [],
  sessions: [],
  activeSessionId: null,
  plan: null,
  units: 'lbs',
  profile: emptyProfile,
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(defaultData)
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      ...structuredClone(defaultData),
      ...parsed,
      exercises: parsed.exercises ?? [],
      routines: parsed.routines ?? [],
      sessions: parsed.sessions ?? [],
      activeSessionId: parsed.activeSessionId ?? null,
      plan: parsed.plan ?? null,
      units: parsed.units === 'kg' ? 'kg' : 'lbs',
      profile: { ...emptyProfile, ...(parsed.profile ?? {}) },
    }
  } catch {
    return structuredClone(defaultData)
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
