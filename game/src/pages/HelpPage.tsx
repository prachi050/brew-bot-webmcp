import { Link } from 'react-router-dom'
import { DIFFICULTIES, ENTITY_INFO, MAX_LIVES, type EntityKind } from '../game/engine'

const WHAT_TO_DO: Record<EntityKind, string> = {
  germ: 'Tap it once to zap it. If it stays too long it gets away and you lose a heart.',
  superbug: 'A tough germ. Tap it twice to zap it. Worth three times the points.',
  cell: "A healthy cell. Don't tap it! Tapping one costs a heart. Just let it fade away.",
  vitamin: `Tap it for a bonus heart (up to ${MAX_LIVES}) and 50 points.`,
}

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">How to play</h1>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">The goal</h2>
          <p>
            Zap as many germs as you can before the timer runs out. You lose a heart every time a
            germ gets away or you tap a healthy cell. The game ends when time runs out or you have
            no hearts left.
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">What pops up</h2>
          <ul className="list">
            {(Object.keys(ENTITY_INFO) as EntityKind[]).map((k) => (
              <li key={k} className="list-row items-center">
                <span className="text-4xl" aria-hidden>
                  {ENTITY_INFO[k].emoji}
                </span>
                <div>
                  <div className="font-semibold">{ENTITY_INFO[k].label}</div>
                  <div className="text-sm opacity-80">{WHAT_TO_DO[k]}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Scoring</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Germs are worth 10 points and superbugs 30, plus up to 10 bonus points for being quick.</li>
            <li>
              Zap 5 in a row without a mistake to start a <b>combo</b>. Your points grow by ×0.5 for
              every 5 zaps in a row, up to ×3.
            </li>
            <li>A mistake or a germ that gets away resets your combo.</li>
            <li>The game speeds up as time runs down.</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Difficulty</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Hearts</th>
                  <th>Germ stays for</th>
                  <th>Good for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{DIFFICULTIES.easy.label}</td>
                  <td>{DIFFICULTIES.easy.lives}</td>
                  <td>{DIFFICULTIES.easy.germLifeMs / 1000}s</td>
                  <td>Young kids and first-timers</td>
                </tr>
                <tr>
                  <td>{DIFFICULTIES.normal.label}</td>
                  <td>{DIFFICULTIES.normal.lives}</td>
                  <td>{DIFFICULTIES.normal.germLifeMs / 1000}s</td>
                  <td>Most players</td>
                </tr>
                <tr>
                  <td>{DIFFICULTIES.hard.label}</td>
                  <td>{DIFFICULTIES.hard.lives}</td>
                  <td>{DIFFICULTIES.hard.germLifeMs / 1000}s</td>
                  <td>Fast fingers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Controls</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <b>Tap or click</b> a square to zap what's in it.
            </li>
            <li>
              <b>Keyboard:</b> use <kbd className="kbd kbd-sm">←</kbd> <kbd className="kbd kbd-sm">↑</kbd>{' '}
              <kbd className="kbd kbd-sm">→</kbd> <kbd className="kbd kbd-sm">↓</kbd> to move and{' '}
              <kbd className="kbd kbd-sm">Space</kbd> or <kbd className="kbd kbd-sm">Enter</kbd> to zap.
            </li>
            <li>
              Press <kbd className="kbd kbd-sm">P</kbd> or <kbd className="kbd kbd-sm">Esc</kbd> to pause.
              The game also pauses if you switch tabs.
            </li>
          </ul>
          <p className="text-sm opacity-80">
            You can change difficulty, round length, board size, sound and colors on the{' '}
            <Link to="/settings" className="link">
              Settings
            </Link>{' '}
            page.
          </p>
        </div>
      </div>

      <Link to="/play" className="btn btn-primary self-center">
        Got it, let's play!
      </Link>
    </div>
  )
}
