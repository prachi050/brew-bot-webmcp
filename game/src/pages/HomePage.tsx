import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { DIFFICULTIES } from '../game/engine'
import { getHighScores } from '../game/storage'

export default function HomePage() {
  const { settings } = useSettings()
  const scores = getHighScores()
  const greeting = settings.playerName ? `Welcome back, Dr. ${settings.playerName}!` : 'Calling all germ busters!'

  return (
    <div className="flex flex-col gap-6">
      <section className="hero bg-base-100 rounded-box shadow">
        <div className="hero-content text-center py-10">
          <div className="max-w-md">
            <div className="text-7xl mb-2 animate-wobble inline-block" aria-hidden>
              🦠
            </div>
            <h1 className="text-4xl font-bold">Germ Buster</h1>
            <p className="py-4">
              {greeting} Germs are popping up all over. Tap them before they get away, but watch
              out: don't tap the healthy cells!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/play" className="btn btn-primary btn-lg">
                ▶ Play
              </Link>
              <Link to="/help" className="btn btn-ghost btn-lg">
                How to play
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">🏆 Best scores</h2>
          <div className="stats stats-vertical sm:stats-horizontal w-full">
            {(Object.keys(DIFFICULTIES) as (keyof typeof DIFFICULTIES)[]).map((d) => (
              <div key={d} className="stat">
                <div className="stat-title">{DIFFICULTIES[d].label}</div>
                <div className="stat-value text-primary">{scores[d]}</div>
                {d === settings.difficulty && <div className="stat-desc">Current difficulty</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
