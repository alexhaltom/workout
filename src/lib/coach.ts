import type { AppData, CoachProfile, Units, WorkoutSession } from '../types'
import { formatWorkoutMarkdown, type ExerciseNameLookup } from './markdown'
import { planProgress } from './planImport'

const BLANK = '_(not specified — ask me if it matters)_'

function exampleWeights(units: Units) {
  return units === 'kg'
    ? { bench: [60, 70, 75], row: 50, ohp: 40 }
    : { bench: [135, 155, 165], row: 115, ohp: 85 }
}

export function planFormatExample(units: Units): string {
  const w = exampleWeights(units)
  return [
    '```markdown',
    '# Week 1: Strength base',
    `Units: ${units}`,
    '',
    '## Day 1: Push',
    '### Barbell Bench Press',
    `- ${w.bench[0]} x 8`,
    `- ${w.bench[1]} x 6`,
    `- ${w.bench[2]} x 5`,
    '- Note: pause briefly on the chest',
    '### Overhead Press',
    `- 3 x 8 @ ${w.ohp}`,
    '### Push-up',
    '- 2 x 15 @ BW',
    '',
    '## Day 2: Pull',
    '### Barbell Row',
    `- 4 x 8 @ ${w.row}`,
    '```',
  ].join('\n')
}

export function planFormatRules(units: Units): string {
  return `## SET. plan format (required)

Whenever you give me a plan, put the **entire week** in **one** markdown code block so I can copy it in one tap and import it into the app. Use exactly this structure:

${planFormatExample(units)}

Rules:
- \`#\` — week title, once at the top. Next line: \`Units: ${units}\`.
- \`##\` — one training day: \`Day N: Workout name\`. Reuse the same workout name when a workout repeats (e.g. two \`Upper\` days).
- \`###\` — one exercise. Use standard full names and keep them identical from week to week. If I've listed exercise names I already use, reuse them exactly.
- One bullet per set: \`- 185 x 5\` means 185 ${units} for 5 reps.
- Identical sets: \`- 3 x 10 @ 135\` means 3 sets of 10 reps at 135 ${units}.
- Bodyweight: \`BW\` in place of a weight, e.g. \`- 3 x 12 @ BW\`.
- Use a single rep number, not a range. Only list warm-up sets if you want me to log them.
- Optional cue: \`- Note: ...\` under the exercise.
- No tables, emojis, or extra formatting inside the code block. Put explanations outside it.`
}

function profileLine(label: string, value: string): string {
  return `- ${label}: ${value.trim() || BLANK}`
}

export function buildSetupPrompt(
  data: AppData,
  exerciseName: ExerciseNameLookup,
  options: { includeHistory: boolean; historyCount?: number },
): string {
  const p: CoachProfile = data.profile
  const units = data.units
  const parts: string[] = []

  parts.push(`# SET. AI coach setup

You are my strength and conditioning coach. I track workouts in an app called SET. It imports the weekly plans you write and exports my actual results so I can paste them back to you. Follow these instructions for this whole conversation.

## About me
${profileLine('Goal', p.goal)}
${profileLine('Training days per week', p.daysPerWeek)}
${profileLine('Time per session', p.sessionLength)}
${profileLine('Experience', p.experience)}
${profileLine('Equipment', p.equipment)}
${profileLine('Injuries / limitations', p.limitations)}
${profileLine('Current lifts / recent bests', p.currentLifts)}
${profileLine('Other', p.other)}
- Units: ${units}`)

  if (data.exercises.length > 0) {
    parts.push(`## Exercise names I already use
Reuse these exact names when you program these lifts:
${data.exercises.map((e) => `- ${e.name}`).join('\n')}`)
  }

  if (options.includeHistory) {
    const recent = data.sessions
      .filter((s) => s.completedAt)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
      .slice(0, options.historyCount ?? 6)
      .reverse()
    if (recent.length > 0) {
      parts.push(
        `## My recent workouts\n\n${recent
          .map((s) => formatWorkoutMarkdown(s, exerciseName, { headingOffset: 2 }))
          .join('\n')}`,
      )
    }
  }

  parts.push(`## What to do now
1. If something above is blank or unclear and it matters for safe, effective programming, ask me up to 3 short questions first.
2. Otherwise, write my plan for this week in the SET. plan format below. Choose conservative starting weights when you are unsure — I'll report back and you'll adjust.

${planFormatRules(units)}

## Check-ins
After each workout I'll paste my results: planned vs. actual for every set, and whether I hit the target.
- Reply briefly: what went well and what to watch next session.
- If an upcoming day this week should change, send the **full updated week** in the same format (all days, including ones I've finished).
- When I tell you the week is complete, write **next week's** plan in the same format, progressing weights and reps based on my actual results.`)

  return parts.join('\n\n') + '\n'
}

export function buildFormatReference(units: Units): string {
  return `# SET. plan format reference

Give this to any AI chatbot or agent (or add it to a ChatGPT custom GPT, Claude Project, or Gemini Gem's instructions) so its plans import cleanly into SET.

${planFormatRules(units)}
`
}

function weekSessions(data: AppData): WorkoutSession[] {
  if (!data.plan) return []
  return data.sessions
    .filter((s) => s.planId === data.plan!.id && s.completedAt)
    .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
}

/** Text to paste back to the coach after a workout. */
export function buildCheckIn(
  data: AppData,
  session: WorkoutSession,
  exerciseName: ExerciseNameLookup,
): string {
  const progress =
    data.plan && session.planId === data.plan.id
      ? planProgress(data.plan, data.sessions)
      : []
  const total = progress.length
  const done = progress.filter((d) => d.session).length
  const remaining = progress.filter((d) => !d.session).map((d) => d.day.label)

  if (total > 0 && remaining.length === 0) {
    return buildWeekSummary(data, exerciseName)
  }

  const index = progress.findIndex((d) => d.day.id === session.planDayId)
  const heading =
    total > 0 && index >= 0
      ? `# SET. check-in: ${session.planDayLabel ?? session.routineName} (${done} of ${total} done this week)`
      : `# SET. check-in: ${session.routineName}`

  const lines = [heading, '', formatWorkoutMarkdown(session, exerciseName, { headingOffset: 1 })]
  if (remaining.length > 0) {
    lines.push(`Still to do this week: ${remaining.join(', ')}.`, '')
    lines.push(
      'Coach: quick feedback please. Only send the full updated week plan if an upcoming day should change.',
    )
  } else {
    lines.push('Coach: quick feedback please.')
  }
  return lines.join('\n') + '\n'
}

/** Whole-week results plus a request for next week's plan. */
export function buildWeekSummary(
  data: AppData,
  exerciseName: ExerciseNameLookup,
): string {
  const plan = data.plan
  if (!plan) return ''
  const progress = planProgress(plan, data.sessions)
  const missed = progress.filter((d) => !d.session).map((d) => d.day.label)
  const sessions = weekSessions(data)

  const lines = [
    `# SET. week complete: ${plan.title}`,
    '',
    `${sessions.length} workout${sessions.length === 1 ? '' : 's'} logged${missed.length ? `; skipped ${missed.join(', ')}` : ''}.`,
    '',
    ...sessions.map((s) => formatWorkoutMarkdown(s, exerciseName, { headingOffset: 1 })),
    `Coach: the week is complete. Review my results and write next week's plan in the SET. plan format (one code block, all days).`,
  ]
  return lines.join('\n') + '\n'
}
