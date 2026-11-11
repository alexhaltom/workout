import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CopyButton } from '../components/CopyButton'
import { buildFormatReference, buildSetupPrompt } from '../lib/coach'
import { downloadTextFile } from '../lib/download'
import { useStore } from '../store'
import type { CoachProfile } from '../types'

const FIELDS: {
  key: keyof CoachProfile
  label: string
  placeholder: string
  multiline?: boolean
}[] = [
  { key: 'goal', label: 'Main goal', placeholder: 'Build strength, lose fat, first powerlifting meet…' },
  { key: 'daysPerWeek', label: 'Days per week', placeholder: '4 (Mon, Tue, Thu, Fri)' },
  { key: 'sessionLength', label: 'Time per session', placeholder: '60 minutes' },
  { key: 'experience', label: 'Experience', placeholder: 'Beginner / 2 years consistent lifting…' },
  { key: 'equipment', label: 'Equipment', placeholder: 'Full gym / home: dumbbells to 50 lbs, bench, pull-up bar', multiline: true },
  { key: 'limitations', label: 'Injuries or limitations', placeholder: 'Cranky left shoulder, avoid deep overhead work', multiline: true },
  { key: 'currentLifts', label: 'Current lifts or recent bests', placeholder: 'Bench 185×5, Squat 225×5, Deadlift 275×3', multiline: true },
  { key: 'other', label: 'Anything else', placeholder: 'Age, bodyweight, sports, preferences…', multiline: true },
]

export function CoachPage() {
  const { data, setProfile, setUnits, getExercise } = useStore()
  const [includeHistory, setIncludeHistory] = useState(true)
  const profile = data.profile
  const units = data.units
  const hasHistory = data.sessions.some((s) => s.completedAt)

  const exerciseName = (id: string) => getExercise(id)?.name ?? 'Exercise'
  const setupPrompt = () =>
    buildSetupPrompt(data, exerciseName, { includeHistory: hasHistory && includeHistory })

  return (
    <div className="page coach">
      <div className="page__header">
        <div>
          <p className="eyebrow">AI coach</p>
          <h1>Coach setup</h1>
          <p className="muted">
            Use ChatGPT, Claude, Gemini, or any AI agent as your coach. It writes your
            week, SET. tracks it, and your results go back to the coach.
          </p>
        </div>
      </div>

      <ol className="coach-loop" aria-label="How it works">
        <li><strong>Set up</strong> Paste the setup prompt into your AI</li>
        <li><strong>Import</strong> Paste its weekly plan into SET.</li>
        <li><strong>Train</strong> Targets are prefilled set by set</li>
        <li><strong>Check in</strong> Copy results back after each workout</li>
      </ol>

      <section className="panel coach-step">
        <h2>1. Tell your coach about you</h2>
        <p className="muted">Optional, but better answers here mean fewer questions later. Saved on this device only.</p>

        <div className="field">
          <span>Units</span>
          <div className="segmented" role="radiogroup" aria-label="Units">
            {(['lbs', 'kg'] as const).map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={units === u}
                className={units === u ? 'is-active' : ''}
                onClick={() => setUnits(u)}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="profile-grid">
          {FIELDS.map((field) => (
            <label key={field.key} className="field">
              <span>{field.label}</span>
              {field.multiline ? (
                <textarea
                  rows={2}
                  value={profile[field.key]}
                  placeholder={field.placeholder}
                  onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                />
              ) : (
                <input
                  value={profile[field.key]}
                  placeholder={field.placeholder}
                  onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>

        {hasHistory && (
          <label className="check">
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
            />
            <span>Include my last 6 workouts so the coach can pick starting weights</span>
          </label>
        )}
      </section>

      <section className="panel coach-step">
        <h2>2. Start your coach</h2>
        <p className="muted">
          Copy the setup prompt and paste it into a new chat. It includes your details and
          the exact plan format SET. reads.
        </p>
        <div className="button-row">
          <CopyButton label="Copy setup prompt" getText={setupPrompt} />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadTextFile('set-coach-setup.md', setupPrompt())}
          >
            Download .md
          </button>
        </div>
        <details className="tips">
          <summary>Tip: make your coach remember the format</summary>
          <p>
            Put the format reference in your AI's standing instructions so every chat
            uses it: a <strong>ChatGPT</strong> custom GPT or Project, a{' '}
            <strong>Claude</strong> Project, or a <strong>Gemini</strong> Gem. For
            agents, add it to the system prompt or attach the file.
          </p>
          <div className="button-row">
            <CopyButton
              className="btn btn--ghost btn--small"
              label="Copy format reference"
              getText={() => buildFormatReference(units)}
            />
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => downloadTextFile('set-plan-format.md', buildFormatReference(units))}
            >
              Download format reference
            </button>
          </div>
        </details>
      </section>

      <section className="panel coach-step">
        <h2>3. Bring the plan back</h2>
        <p className="muted">
          When your coach replies with a plan, tap its code block's copy button and import it.
        </p>
        <div className="button-row">
          <Link to="/import" className="btn btn--primary">
            Import plan
          </Link>
        </div>
      </section>

      <section className="panel coach-step">
        <h2>4. After each workout</h2>
        <p className="muted">
          Tap <strong>Finish</strong>, then <strong>Copy results for coach</strong> and paste
          into the same chat. When the week is done, the copied results ask for next
          week's plan for you, and you import it the same way.
        </p>
      </section>
    </div>
  )
}
