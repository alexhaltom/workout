import type { WorkoutSession } from '../types'

export type ExerciseNameLookup = (exerciseId: string) => string

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatSetTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDuration(startedAt: string, completedAt: string): string | null {
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null

  const totalMinutes = Math.round(ms / 60_000)
  if (totalMinutes < 1) return 'under 1 min'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return hours === 1 ? '1 hr' : `${hours} hr`
  return `${hours} hr ${minutes} min`
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 100) / 100
  return String(rounded)
}

function oneLine(value: string): string {
  return value.replace(/\r?\n/g, ' ').trim()
}

function escapeCell(value: string): string {
  return oneLine(value).replace(/\|/g, '\\|')
}

function headingText(value: string, fallback: string): string {
  const cleaned = oneLine(value).replace(/^#+\s*/, '')
  return cleaned || fallback
}

export function workoutMarkdownFilename(session: WorkoutSession): string {
  const when = new Date(session.completedAt ?? session.startedAt)
  const date = [
    when.getFullYear(),
    String(when.getMonth() + 1).padStart(2, '0'),
    String(when.getDate()).padStart(2, '0'),
  ].join('-')
  const time = [
    String(when.getHours()).padStart(2, '0'),
    String(when.getMinutes()).padStart(2, '0'),
  ].join('')
  const slug = session.routineName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug || 'workout'}-${date}-${time}.md`
}

export function formatWorkoutMarkdown(
  session: WorkoutSession,
  exerciseName: ExerciseNameLookup,
): string {
  const finishedAt = session.completedAt ?? session.startedAt
  const duration = session.completedAt
    ? formatDuration(session.startedAt, session.completedAt)
    : null

  const lines: string[] = [
    `# ${headingText(session.routineName, 'Workout')}`,
    '',
    formatDate(finishedAt),
    '',
    `- Started: ${formatTime(session.startedAt)}`,
    `- Finished: ${session.completedAt ? formatTime(session.completedAt) : 'In progress'}`,
  ]

  if (duration) lines.push(`- Duration: ${duration}`)
  lines.push('')

  const logged = session.exercises.filter((exercise) => exercise.sets.length > 0)
  const skipped = session.exercises.filter((exercise) => exercise.sets.length === 0)

  let totalSets = 0
  let totalVolume = 0

  if (logged.length === 0) {
    lines.push('_No sets logged._', '')
  } else {
    for (const exercise of logged) {
      const name = headingText(
        exerciseName(exercise.exerciseId),
        'Exercise',
      )
      lines.push(`## ${name}`, '')
      lines.push(
        '| Set | Weight | Reps | Logged |',
        '| --- | ---: | ---: | --- |',
      )
      exercise.sets.forEach((set, index) => {
        totalSets += 1
        totalVolume += set.weight * set.reps
        lines.push(
          `| ${index + 1} | ${formatAmount(set.weight)} | ${formatAmount(set.reps)} | ${escapeCell(formatSetTime(set.completedAt))} |`,
        )
      })
      lines.push('')
    }

    if (skipped.length > 0) {
      const names = skipped
        .map((exercise) =>
          headingText(exerciseName(exercise.exerciseId), 'Exercise'),
        )
        .join(', ')
      lines.push(`_Skipped: ${names}_`, '')
    }

    lines.push(
      '---',
      '',
      `${totalSets} ${totalSets === 1 ? 'set' : 'sets'} · volume ${formatAmount(totalVolume)}`,
      '',
    )
  }

  return lines.join('\n')
}
