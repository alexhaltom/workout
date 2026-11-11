import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { readClipboardText } from '../lib/clipboard'
import { parsePlanMarkdown } from '../lib/planFormat'
import {
  defaultImportMode,
  planProgress,
  previewPlan,
  type ImportMode,
} from '../lib/planImport'
import { useStore } from '../store'

function formatSets(sets: { weight: number; reps: number }[], units: string): string {
  if (sets.length === 0) return 'no sets'
  const groups: { weight: number; reps: number; count: number }[] = []
  for (const set of sets) {
    const last = groups[groups.length - 1]
    if (last && last.weight === set.weight && last.reps === set.reps) last.count += 1
    else groups.push({ ...set, count: 1 })
  }
  return groups
    .map((g) => {
      const weight = g.weight === 0 ? 'BW' : `${g.weight} ${units}`
      return g.count > 1 ? `${g.count}×${g.reps} @ ${weight}` : `${weight} × ${g.reps}`
    })
    .join(', ')
}

export function ImportPage() {
  const navigate = useNavigate()
  const { data, importPlan } = useStore()
  const [text, setText] = useState('')
  const [pasteHint, setPasteHint] = useState<string | null>(null)
  const [mode, setMode] = useState<ImportMode>(() => defaultImportMode(data))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const parsed = useMemo(() => (text.trim() ? parsePlanMarkdown(text) : null), [text])
  const preview = useMemo(
    () => (parsed ? previewPlan(data, parsed, mode) : []),
    [data, parsed, mode],
  )

  const progress = planProgress(data.plan, data.sessions)
  const doneCount = progress.filter((d) => d.session).length
  const canUpdateWeek = Boolean(data.plan) && doneCount > 0
  const units = parsed?.units ?? data.units

  async function handlePaste() {
    const clip = await readClipboardText()
    if (clip && clip.trim()) {
      setText(clip)
      setPasteHint(null)
    } else {
      setPasteHint('Your browser blocked clipboard access — long-press the box below and choose Paste.')
      textareaRef.current?.focus()
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setText(await file.text())
    e.target.value = ''
  }

  function handleImport() {
    if (!parsed || parsed.days.length === 0) return
    importPlan(parsed, mode)
    navigate('/')
  }

  const newExercises = preview.flatMap((d) => d.exercises.filter((e) => !e.matchedName))
  const newRoutines = [...new Set(preview.filter((d) => d.routineIsNew).map((d) => d.routineName))]

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">AI coach</p>
          <h1>Import plan</h1>
          <p className="muted">
            Copy the plan your AI coach wrote and paste it here.
          </p>
        </div>
        <Link to="/coach" className="btn btn--ghost">
          Setup kit
        </Link>
      </div>

      <div className="form-stack">
        <div className="button-row">
          <button type="button" className="btn btn--primary" onClick={handlePaste}>
            Paste from clipboard
          </button>
          <label className="btn btn--secondary file-button">
            Open .md file
            <input type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" onChange={handleFile} />
          </label>
          {text && (
            <button type="button" className="btn btn--ghost" onClick={() => setText('')}>
              Clear
            </button>
          )}
        </div>
        {pasteHint && <p className="muted">{pasteHint}</p>}

        <label className="field">
          <span>Plan text</span>
          <textarea
            ref={textareaRef}
            className="plan-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'# Week 1: Strength base\nUnits: lbs\n\n## Day 1: Push\n### Barbell Bench Press\n- 135 x 8\n- 3 x 6 @ 155'}
            spellCheck={false}
          />
        </label>
      </div>

      {parsed && parsed.days.length === 0 && (
        <div className="panel">
          <p className="error">No workout days found.</p>
          <p className="muted">
            Make sure the reply uses <code>## Day 1: Name</code> for days and{' '}
            <code>### Exercise</code> for exercises with set bullets like{' '}
            <code>- 135 x 8</code>. If your coach used a different format, ask it
            to “resend the full week in the SET. plan format”.
          </p>
        </div>
      )}

      {parsed && parsed.days.length > 0 && (
        <>
          <div className="panel">
            <div className="section__head">
              <h2>{parsed.title}</h2>
              <span className="muted">
                {parsed.days.length} day{parsed.days.length === 1 ? '' : 's'} · {units}
              </span>
            </div>

            {parsed.units && parsed.units !== data.units && (
              <p className="notice">
                This plan is in {parsed.units}. Importing switches the app from{' '}
                {data.units} to {parsed.units}.
              </p>
            )}

            {canUpdateWeek && (
              <fieldset className="mode-picker">
                <legend>You've done {doneCount} of {progress.length} days of “{data.plan!.title}”.</legend>
                <label>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'update-week'}
                    onChange={() => setMode('update-week')}
                  />
                  <span>
                    <strong>Update this week</strong> — keep finished days checked off
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'new-week'}
                    onChange={() => setMode('new-week')}
                  />
                  <span>
                    <strong>Start a new week</strong> — all days start fresh
                  </span>
                </label>
              </fieldset>
            )}

            <ol className="plan-preview">
              {preview.map((day) => (
                <li key={day.label}>
                  <div className="plan-preview__day">
                    <strong>{day.label}</strong>
                    {day.alreadyDone && <span className="tag tag--ok">done</span>}
                    {day.routineIsNew && <span className="tag">new routine</span>}
                  </div>
                  <ul>
                    {day.exercises.map((ex) => (
                      <li key={ex.name}>
                        <span className="plan-preview__lift">
                          {ex.matchedName ?? ex.name}
                          {!ex.matchedName && <span className="tag">new</span>}
                        </span>
                        <span className="muted">{formatSets(ex.sets, units)}</span>
                        {ex.note && <span className="plan-preview__note">{ex.note}</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>

            {parsed.warnings.length > 0 && (
              <ul className="warning-list">
                {parsed.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}

            {(newExercises.length > 0 || newRoutines.length > 0) && (
              <p className="muted">
                Importing will add{' '}
                {[
                  newExercises.length > 0 &&
                    `${newExercises.length} new exercise${newExercises.length === 1 ? '' : 's'}`,
                  newRoutines.length > 0 &&
                    `${newRoutines.length} routine${newRoutines.length === 1 ? '' : 's'} (${newRoutines.join(', ')})`,
                ]
                  .filter(Boolean)
                  .join(' and ')}
                . Existing routines with the same name get this week's exercises.
              </p>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--primary" onClick={handleImport}>
              Import {parsed.days.length}-day plan
            </button>
          </div>
        </>
      )}
    </div>
  )
}
