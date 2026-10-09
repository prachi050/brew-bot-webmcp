import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import {
  DIFFICULTIES,
  ENTITY_INFO,
  comboMultiplier,
  gameReducer,
  initialState,
  type Entity,
} from '../game/engine'
import { playSound } from '../game/sound'
import { getHighScores, recordScore } from '../game/storage'

const TICK_MS = 50

function Hearts({ lives }: { lives: number }) {
  return (
    <span aria-label={`${lives} hearts left`} className="tracking-tight">
      {lives > 0 ? '❤️'.repeat(lives) : '💔'}
    </span>
  )
}

function Tile({
  entity,
  index,
  focused,
  showRing,
  burst,
  onTap,
}: {
  entity: Entity | null
  index: number
  focused: boolean
  showRing: boolean
  burst: boolean
  onTap: (i: number) => void
}) {
  const pct = entity ? Math.round((entity.lifeMs / entity.maxLifeMs) * 100) : 0
  const label = entity ? ENTITY_INFO[entity.kind].label : 'Empty'
  const ringColor =
    entity?.kind === 'cell' ? 'text-error' : entity?.kind === 'vitamin' ? 'text-success' : 'text-primary'

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={`Square ${index + 1}: ${label}`}
      onPointerDown={(e) => {
        // Pointer-down is snappier than click on touch screens.
        e.preventDefault()
        onTap(index)
      }}
      className={`relative aspect-square rounded-box bg-base-100 shadow-inner flex items-center justify-center select-none touch-manipulation transition-colors ${
        focused ? 'outline-4 outline-offset-2 outline-secondary' : ''
      } ${entity?.kind === 'cell' ? 'bg-error/10' : ''}`}
    >
      {entity && (
        <span key={entity.id} className="animate-pop flex items-center justify-center w-full h-full">
          {showRing && (
            <span
              className={`radial-progress absolute ${ringColor} opacity-60`}
              style={{ '--value': pct, '--size': '85%', '--thickness': '4px' } as CSSProperties}
              aria-hidden
            />
          )}
          <span
            className={`text-[clamp(1.75rem,9vw,3.5rem)] leading-none ${
              entity.kind === 'germ' || entity.kind === 'superbug' ? 'animate-wobble' : ''
            } ${entity.hp > 1 ? 'drop-shadow-[0_0_6px_var(--color-secondary)]' : ''}`}
            aria-hidden
          >
            {ENTITY_INFO[entity.kind].emoji}
          </span>
        </span>
      )}
      {!entity && burst && (
        <span className="animate-pop text-[clamp(1.5rem,8vw,3rem)]" aria-hidden>
          💥
        </span>
      )}
    </button>
  )
}

export default function PlayPage() {
  const { settings } = useSettings()
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    initialState(settings.difficulty, settings.roundSeconds, settings.gridSize),
  )
  const [countdown, setCountdown] = useState<number | null>(null)
  const [cursor, setCursor] = useState(0)
  const [bursts, setBursts] = useState<Record<number, number>>({})
  const [newBest, setNewBest] = useState(false)
  const [shake, setShake] = useState(0)
  const stateRef = useRef(state)
  stateRef.current = state
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor
  const volume = settings.volume
  const n = state.gridSize

  const restart = useCallback(() => {
    dispatch({
      type: 'reset',
      difficulty: settings.difficulty,
      roundSeconds: settings.roundSeconds,
      gridSize: settings.gridSize,
    })
    setNewBest(false)
    setBursts({})
    setCountdown(3)
  }, [settings.difficulty, settings.roundSeconds, settings.gridSize])

  // 3-2-1 countdown before the round starts.
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      setCountdown(null)
      dispatch({ type: 'start' })
      playSound('start', volume)
      return
    }
    playSound('hit', volume)
    const t = setTimeout(() => setCountdown(countdown - 1), 700)
    return () => clearTimeout(t)
  }, [countdown, volume])

  // Game loop.
  useEffect(() => {
    if (state.status !== 'playing') return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      // Cap the step so a stalled tab doesn't fast-forward the round.
      const dtMs = Math.min(now - last, 200)
      last = now
      dispatch({ type: 'tick', dtMs, rolls: [Math.random(), Math.random()] })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [state.status])

  // Pause when the tab is hidden.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && stateRef.current.status === 'playing') dispatch({ type: 'togglePause' })
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  // Sound and shake when a germ escapes.
  const prevEscaped = useRef(state.escaped)
  useEffect(() => {
    if (state.escaped > prevEscaped.current) {
      playSound('escape', volume)
      setShake((s) => s + 1)
    }
    prevEscaped.current = state.escaped
  }, [state.escaped, volume])

  // Save the score once when the round ends.
  useEffect(() => {
    if (state.status !== 'over') return
    playSound('over', volume)
    setNewBest(state.score > 0 && recordScore(state.difficulty, state.score))
    // Only react to the transition into "over".
  }, [state.status])

  const tap = useCallback(
    (index: number) => {
      const s = stateRef.current
      if (s.status !== 'playing') return
      setCursor(index)
      const entity = s.cells[index]
      if (!entity) return
      if (entity.kind === 'cell') {
        playSound('ouch', volume)
        setShake((v) => v + 1)
      } else if (entity.kind === 'vitamin') {
        playSound('vitamin', volume)
      } else if (entity.hp > 1) {
        playSound('hit', volume)
      } else {
        playSound('zap', volume)
        setBursts((b) => ({ ...b, [index]: Date.now() }))
        setTimeout(
          () =>
            setBursts((b) => {
              const { [index]: _, ...rest } = b
              return rest
            }),
          250,
        )
      }
      dispatch({ type: 'tap', index })
    },
    [volume],
  )

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (s.status === 'playing' || s.status === 'paused') {
          e.preventDefault()
          dispatch({ type: 'togglePause' })
        }
        return
      }
      if (s.status !== 'playing') return
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      if (moves[e.key]) {
        e.preventDefault()
        const [dr, dc] = moves[e.key]
        setCursor((c) => {
          const r = Math.min(n - 1, Math.max(0, Math.floor(c / n) + dr))
          const col = Math.min(n - 1, Math.max(0, (c % n) + dc))
          return r * n + col
        })
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        tap(cursorRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n, tap])

  const config = DIFFICULTIES[state.difficulty]
  const best = getHighScores()[state.difficulty]
  const seconds = Math.ceil(state.timeLeftMs / 1000)
  const lowTime = state.status === 'playing' && seconds <= 10
  const multiplier = comboMultiplier(state.combo)

  return (
    <div className="flex flex-col gap-4">
      {/* HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-base-100 rounded-box shadow p-3">
          <div className="text-xs opacity-70">Score</div>
          <div className="text-2xl font-bold tabular-nums">{state.score}</div>
        </div>
        <div className="bg-base-100 rounded-box shadow p-3">
          <div className="text-xs opacity-70">Time</div>
          <div className={`text-2xl font-bold tabular-nums ${lowTime ? 'text-error' : ''}`}>{seconds}s</div>
        </div>
        <div className="bg-base-100 rounded-box shadow p-3">
          <div className="text-xs opacity-70">Hearts</div>
          <div className="text-xl">
            <Hearts lives={state.lives} />
          </div>
        </div>
        <div className="bg-base-100 rounded-box shadow p-3">
          <div className="text-xs opacity-70">Combo</div>
          <div className="text-2xl font-bold tabular-nums">
            {state.combo}
            {multiplier > 1 && <span className="badge badge-accent ml-2 align-middle">×{multiplier}</span>}
          </div>
        </div>
      </div>
      <progress
        className={`progress w-full ${lowTime ? 'progress-error' : 'progress-primary'}`}
        value={state.timeLeftMs}
        max={state.roundMs}
        aria-label="Time left"
      />

      {/* Message line: fixed height so the board doesn't jump. */}
      <div className="h-6 text-center font-medium" aria-live="polite">
        {state.feedback && (
          <span
            key={state.feedback.id}
            className={`animate-pop inline-block ${state.feedback.kind === 'bad' ? 'text-error' : 'text-success'}`}
          >
            {state.feedback.text}
          </span>
        )}
      </div>

      {/* Board */}
      <div className="relative w-full max-w-[min(100%,32rem)] mx-auto">
        <div
          key={shake}
          className={`grid gap-2 sm:gap-3 p-2 sm:p-3 bg-base-300 rounded-box ${shake ? 'animate-shake' : ''}`}
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {state.cells.map((entity, i) => (
            <Tile
              key={i}
              index={i}
              entity={entity}
              focused={state.status === 'playing' && cursor === i}
              showRing={settings.showTimerBars}
              burst={i in bursts}
              onTap={tap}
            />
          ))}
        </div>

        {/* Overlays */}
        {state.status !== 'playing' && (
          <div className="absolute inset-0 rounded-box bg-base-100/85 backdrop-blur-sm flex items-center justify-center p-4">
            {countdown !== null ? (
              <div key={countdown} className="animate-pop text-8xl font-black text-primary" aria-live="assertive">
                {countdown}
              </div>
            ) : state.status === 'ready' ? (
              <div className="text-center flex flex-col items-center gap-3">
                <div className="text-6xl" aria-hidden>
                  🦠
                </div>
                <h1 className="text-2xl font-bold">Ready, {settings.playerName || 'germ buster'}?</h1>
                <p className="opacity-80">
                  {config.label} · {settings.roundSeconds}s · {n}×{n} board
                </p>
                <p className="text-sm">
                  Tap {ENTITY_INFO.germ.emoji} {ENTITY_INFO.superbug.emoji} {ENTITY_INFO.vitamin.emoji} · Avoid{' '}
                  {ENTITY_INFO.cell.emoji}
                </p>
                <button className="btn btn-primary btn-lg" onClick={restart} autoFocus>
                  ▶ Start
                </button>
                <Link to="/settings" className="link text-sm">
                  Change settings
                </Link>
              </div>
            ) : state.status === 'paused' ? (
              <div className="text-center flex flex-col items-center gap-3">
                <h2 className="text-3xl font-bold">⏸ Paused</h2>
                <button className="btn btn-primary" onClick={() => dispatch({ type: 'togglePause' })} autoFocus>
                  Resume
                </button>
                <button className="btn btn-ghost btn-sm" onClick={restart}>
                  Restart
                </button>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center gap-2 animate-pop">
                <div className="text-5xl" aria-hidden>
                  {newBest ? '🏆' : state.endReason === 'time' ? '⏰' : '🤒'}
                </div>
                <h2 className="text-2xl font-bold">
                  {newBest ? 'New best score!' : state.endReason === 'time' ? "Time's up!" : 'Out of hearts!'}
                </h2>
                <div className="text-4xl font-black text-primary tabular-nums">{state.score}</div>
                <div className="stats stats-horizontal bg-transparent text-sm">
                  <div className="stat px-3 py-1">
                    <div className="stat-title">Zapped</div>
                    <div className="stat-value text-lg">{state.zapped}</div>
                  </div>
                  <div className="stat px-3 py-1">
                    <div className="stat-title">Got away</div>
                    <div className="stat-value text-lg">{state.escaped}</div>
                  </div>
                  <div className="stat px-3 py-1">
                    <div className="stat-title">Best combo</div>
                    <div className="stat-value text-lg">{state.bestCombo}</div>
                  </div>
                </div>
                <p className="text-sm opacity-70">
                  Best on {config.label}: {Math.max(best, state.score)}
                </p>
                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={restart} autoFocus>
                    Play again
                  </button>
                  <Link to="/" className="btn btn-ghost">
                    Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {state.status === 'playing' && (
        <div className="flex justify-center">
          <button className="btn btn-sm btn-ghost" onClick={() => dispatch({ type: 'togglePause' })}>
            ⏸ Pause <kbd className="kbd kbd-xs">P</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
