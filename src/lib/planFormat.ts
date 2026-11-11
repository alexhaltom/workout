import type { PlannedSet, Units } from '../types'

export type ParsedExercise = {
  name: string
  sets: PlannedSet[]
  note?: string
}

export type ParsedDay = {
  /** Full heading, e.g. "Day 2: Pull". */
  label: string
  /** Workout / routine name, e.g. "Pull". */
  name: string
  exercises: ParsedExercise[]
}

export type ParsedPlan = {
  title: string
  units: Units | null
  notes: string[]
  days: ParsedDay[]
  warnings: string[]
}

const MAX_SETS_PER_LINE = 20
const DAY_PATTERN = /^(?:day|session|workout)\s*\d+\b/i
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/
const BULLET = /^\s*(?:[-*+•]|\d+[.)])\s+(.*)$/
const UNITS_LINE = /^\s*(?:[-*]\s*)?\**units?\**\s*:\s*\**\s*(lbs?|pounds?|kgs?|kilos?|kilograms?)\b/i
const NOTES_LINE = /^\s*(?:[-*]\s*)?\**(?:notes?|focus|cues?|tips?)\**\s*:\s*(.+)$/i

/** Strip markdown emphasis/code markers. */
function clean(value: string): string {
  return value.replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim()
}

function dayName(label: string): string {
  const match = label.match(
    /^(?:day|session|workout)\s*\d+\s*(?:[:\-–—.|]|\s)\s*(.+)$/i,
  )
  const name = match ? match[1].trim() : label
  return name || label
}

const W = '(\\d+(?:\\.\\d+)?|bw)'
const R = '(\\d+)(?:\\s*-\\s*\\d+)?'
const SETS_REPS_AT_WEIGHT = new RegExp(`^(\\d+)\\s*x\\s*${R}\\s*@\\s*${W}(.*)$`)
const WEIGHT_REPS_SETS = new RegExp(`^${W}\\s*x\\s*${R}\\s*x\\s*(\\d+)(.*)$`)
const WEIGHT_REPS = new RegExp(`^${W}\\s*x\\s*${R}(.*)$`)
const REPS_AT_WEIGHT = new RegExp(`^${R}\\s*@\\s*${W}(.*)$`)
const SETS_REPS_BW = new RegExp(`^(\\d+)\\s*x\\s*${R}(.*)$`)

function toWeight(value: string): number {
  return value === 'bw' ? 0 : Number(value)
}

function normalizeSetText(text: string): string {
  return clean(text)
    .toLowerCase()
    .replace(/[×✕✖]/g, 'x')
    .replace(/(\d)\s*\*\s*(\d)/g, '$1 x $2')
    .replace(/\b(?:body\s*weight|bodyweight)\b/g, 'bw')
    .replace(/\bsets?\s+of\b/g, 'x')
    .replace(/(\d)\s*(?:lbs?|pounds?|kgs?|kilos?|kilograms?)\b\.?/g, '$1')
    .replace(/(\d)\s*(?:reps?|repetitions?)\b/g, '$1')
    .replace(/(\d)\s*sets?\b/g, '$1')
    .replace(/(\d)\s+at\s+(?=\d|bw\b)/g, '$1 @ ')
    .replace(/\s+/g, ' ')
    .trim()
}

function remainderNote(rest: string): string | undefined {
  const note = rest.replace(/^[\s,;:()—–\-/]+|[\s)]+$/g, '').trim()
  return note || undefined
}

/** Parse one set line like "135 x 8", "3 x 10 @ 95", "BW x 12". */
export function parseSetLine(
  text: string,
): { sets: PlannedSet[]; note?: string } | null {
  const s = normalizeSetText(text)
  let m: RegExpMatchArray | null

  const repeat = (count: number, weight: number, reps: number) =>
    Array.from({ length: Math.min(count, MAX_SETS_PER_LINE) }, () => ({
      weight,
      reps,
    }))

  if ((m = s.match(SETS_REPS_AT_WEIGHT))) {
    return {
      sets: repeat(Number(m[1]), toWeight(m[3]), Number(m[2])),
      note: remainderNote(m[4]),
    }
  }
  if ((m = s.match(WEIGHT_REPS_SETS))) {
    return {
      sets: repeat(Number(m[3]), toWeight(m[1]), Number(m[2])),
      note: remainderNote(m[4]),
    }
  }
  if ((m = s.match(REPS_AT_WEIGHT))) {
    return {
      sets: [{ weight: toWeight(m[2]), reps: Number(m[1]) }],
      note: remainderNote(m[3]),
    }
  }
  if ((m = s.match(WEIGHT_REPS))) {
    // "3 x 10 bw" style: sets x reps of bodyweight
    const rest = m[3] ?? ''
    if (/^\s*bw\b/.test(rest) && m[1] !== 'bw') {
      return {
        sets: repeat(Number(m[1]), 0, Number(m[2])),
        note: remainderNote(rest.replace(/^\s*bw/, '')),
      }
    }
    return {
      sets: [{ weight: toWeight(m[1]), reps: Number(m[2]) }],
      note: remainderNote(rest),
    }
  }
  if ((m = s.match(SETS_REPS_BW))) {
    return { sets: repeat(Number(m[1]), 0, Number(m[2])), note: remainderNote(m[3]) }
  }
  return null
}

type Heading = { level: number; text: string; line: number }

function pickLevels(headings: Heading[]): {
  titleLevel: number | null
  dayLevel: number | null
  exerciseLevel: number | null
} {
  const levels = [...new Set(headings.map((h) => h.level))].sort((a, b) => a - b)
  if (levels.length === 0) return { titleLevel: null, dayLevel: null, exerciseLevel: null }

  const dayHeading = headings.find((h) => DAY_PATTERN.test(h.text))
  if (dayHeading) {
    const dayLevel = dayHeading.level
    const deeper = levels.filter((l) => l > dayLevel)
    const shallower = levels.filter((l) => l < dayLevel)
    return {
      titleLevel: shallower.length ? shallower[0] : null,
      dayLevel,
      exerciseLevel: deeper.length ? deeper[0] : null,
    }
  }

  if (levels.length >= 3) {
    return { titleLevel: levels[0], dayLevel: levels[1], exerciseLevel: levels[2] }
  }
  if (levels.length === 2) {
    const topCount = headings.filter((h) => h.level === levels[0]).length
    // One top heading = a title over a single workout's exercises.
    return topCount === 1
      ? { titleLevel: levels[0], dayLevel: null, exerciseLevel: levels[1] }
      : { titleLevel: null, dayLevel: levels[0], exerciseLevel: levels[1] }
  }
  return { titleLevel: null, dayLevel: null, exerciseLevel: levels[0] }
}

function parseUnits(value: string): Units {
  return value.toLowerCase().startsWith('k') ? 'kg' : 'lbs'
}

/**
 * Parse the SET. weekly plan format. Lenient about the chatter chatbots add
 * around it (code fences, intro text, bold, units suffixes).
 */
export function parsePlanMarkdown(input: string): ParsedPlan {
  const lines = input.replace(/\r\n?/g, '\n').split('\n')
  const headings: Heading[] = []
  lines.forEach((raw, index) => {
    const m = raw.match(HEADING)
    if (m) headings.push({ level: m[1].length, text: clean(m[2]), line: index })
  })

  const { titleLevel, dayLevel, exerciseLevel } = pickLevels(headings)

  const plan: ParsedPlan = {
    title: '',
    units: null,
    notes: [],
    days: [],
    warnings: [],
  }

  let day: ParsedDay | null = null
  let exercise: ParsedExercise | null = null

  const ensureDay = (): ParsedDay => {
    if (!day) {
      const label = plan.title || 'Workout'
      day = { label, name: label, exercises: [] }
      plan.days.push(day)
    }
    return day
  }

  const addNote = (target: ParsedExercise, note: string) => {
    target.note = target.note ? `${target.note}; ${note}` : note
  }

  lines.forEach((raw, index) => {
    const line = raw.trim()
    if (!line || /^(```|~~~)/.test(line) || /^[-*_]{3,}$/.test(line)) return

    const unitsMatch = line.match(UNITS_LINE)
    if (unitsMatch) {
      plan.units = parseUnits(unitsMatch[1])
      return
    }

    const heading = headings.find((h) => h.line === index)
    if (heading) {
      if (heading.level === titleLevel && !plan.title) {
        plan.title = heading.text.replace(/^plan\s*:\s*/i, '')
      } else if (heading.level === dayLevel) {
        day = { label: heading.text, name: dayName(heading.text), exercises: [] }
        plan.days.push(day)
        exercise = null
      } else if (heading.level === exerciseLevel) {
        exercise = { name: heading.text, sets: [] }
        ensureDay().exercises.push(exercise)
      }
      return
    }

    const bullet = line.match(BULLET)
    const body = clean(bullet ? bullet[1] : line)
    const notesMatch = body.match(NOTES_LINE) ?? line.match(NOTES_LINE)

    if (!exercise) {
      if (notesMatch && !day) plan.notes.push(clean(notesMatch[1]))
      return
    }

    if (notesMatch) {
      addNote(exercise, clean(notesMatch[1]))
      return
    }

    const parsed = parseSetLine(body)
    if (parsed && parsed.sets.length > 0) {
      exercise.sets.push(...parsed.sets)
      if (parsed.note) addNote(exercise, parsed.note)
    } else if (bullet) {
      plan.warnings.push(
        `Couldn't read "${body}" under ${exercise.name} — kept it as a note.`,
      )
      addNote(exercise, body)
    }
  })

  // Merge duplicate exercises within a day, drop empty days.
  plan.days = plan.days.filter((d) => {
    const merged: ParsedExercise[] = []
    for (const ex of d.exercises) {
      const existing = merged.find(
        (m) => normalizeName(m.name) === normalizeName(ex.name),
      )
      if (existing) {
        existing.sets.push(...ex.sets)
        if (ex.note) addNote(existing, ex.note)
      } else {
        merged.push(ex)
      }
    }
    d.exercises = merged
    for (const ex of merged) {
      if (ex.sets.length === 0) {
        plan.warnings.push(`${d.label} › ${ex.name} has no sets I could read.`)
      }
    }
    if (merged.length === 0) {
      plan.warnings.push(`Skipped "${d.label}" — no exercises found.`)
      return false
    }
    return true
  })

  if (!plan.title) plan.title = 'Weekly plan'
  return plan
}

/** Loose name key so "Bench press" matches "Bench Press" and "Squats" matches "Squat". */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\bdumbbells?\b/g, 'db')
    .replace(/\bbarbell\b/g, 'bb')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => (word.length > 2 && !word.endsWith('ss') && word.endsWith('s') ? word.slice(0, -1) : word))
    .join(' ')
}
