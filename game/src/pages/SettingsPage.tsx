import { useState } from 'react'
import { DEFAULT_SETTINGS, THEMES, useSettings, type Settings } from '../context/SettingsContext'
import { DIFFICULTIES, type Difficulty } from '../game/engine'
import { playSound } from '../game/sound'
import { clearHighScores } from '../game/storage'

function Segmented<T extends string | number>({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="join" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <input
          key={String(o.value)}
          type="radio"
          name={name}
          className="join-item btn btn-sm"
          aria-label={o.label}
          checked={value === o.value}
          onChange={() => onChange(o.value)}
        />
      ))}
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-base-200 last:border-0">
      <div>
        <div className="font-medium">{label}</div>
        {hint && <div className="text-sm opacity-70">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, update, reset } = useSettings()
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const set = <K extends keyof Settings>(key: K) => (value: Settings[K]) => update({ [key]: value })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="card bg-base-100 shadow">
        <div className="card-body py-3">
          <h2 className="card-title pt-2">Player</h2>
          <Row label="Your name" hint="Shown on the home page and your results.">
            <input
              type="text"
              className="input input-sm w-48"
              maxLength={20}
              placeholder="Germ buster"
              value={settings.playerName}
              onChange={(e) => update({ playerName: e.target.value })}
            />
          </Row>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body py-3">
          <h2 className="card-title pt-2">Game</h2>
          <Row label="Difficulty" hint="Easy is great for young kids. Each level keeps its own best score.">
            <Segmented<Difficulty>
              name="difficulty"
              value={settings.difficulty}
              options={(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => ({
                value: d,
                label: DIFFICULTIES[d].label,
              }))}
              onChange={set('difficulty')}
            />
          </Row>
          <Row label="Round length">
            <Segmented
              name="round"
              value={settings.roundSeconds}
              options={[
                { value: 30 as const, label: '30s' },
                { value: 60 as const, label: '60s' },
                { value: 90 as const, label: '90s' },
              ]}
              onChange={set('roundSeconds')}
            />
          </Row>
          <Row label="Board size" hint="Bigger boards have more squares to watch.">
            <Segmented
              name="grid"
              value={settings.gridSize}
              options={[
                { value: 3 as const, label: '3×3' },
                { value: 4 as const, label: '4×4' },
                { value: 5 as const, label: '5×5' },
              ]}
              onChange={set('gridSize')}
            />
          </Row>
          <Row label="Countdown rings" hint="Show how long each germ has left before it gets away.">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={settings.showTimerBars}
              onChange={(e) => update({ showTimerBars: e.target.checked })}
            />
          </Row>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body py-3">
          <h2 className="card-title pt-2">Sound and look</h2>
          <Row label={`Volume: ${settings.volume === 0 ? 'off' : `${settings.volume}%`}`}>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              className="range range-primary range-sm w-48"
              value={settings.volume}
              onChange={(e) => update({ volume: Number(e.target.value) })}
              onMouseUp={() => playSound('zap', settings.volume)}
              onTouchEnd={() => playSound('zap', settings.volume)}
              aria-label="Volume"
            />
          </Row>
          <Row label="Theme">
            <select
              className="select select-sm w-48"
              value={settings.theme}
              onChange={(e) => update({ theme: e.target.value })}
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Row>
          <div className="flex flex-wrap gap-2 py-3" aria-hidden>
            <span className="badge badge-primary">Primary</span>
            <span className="badge badge-secondary">Secondary</span>
            <span className="badge badge-accent">Accent</span>
            <span className="badge badge-success">Success</span>
            <span className="badge badge-error">Error</span>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Reset</h2>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-outline"
              disabled={JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS)}
              onClick={() => {
                reset()
                flash('Settings restored to defaults')
              }}
            >
              Restore default settings
            </button>
            <button
              className="btn btn-outline btn-error"
              onClick={() => {
                if (confirm('Clear all best scores? This cannot be undone.')) {
                  clearHighScores()
                  flash('Best scores cleared')
                }
              }}
            >
              Clear best scores
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast toast-center" role="status">
          <div className="alert alert-success">{toast}</div>
        </div>
      )}
    </div>
  )
}
