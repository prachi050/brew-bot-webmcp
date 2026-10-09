export type Difficulty = 'easy' | 'normal' | 'hard'
export type EntityKind = 'germ' | 'superbug' | 'cell' | 'vitamin'

export interface DifficultyConfig {
  label: string
  lives: number
  /** How long a germ stays before it spreads. */
  germLifeMs: number
  /** Time between spawns at the start of a round; it shrinks as the round goes on. */
  spawnStartMs: number
  spawnMinMs: number
  /** Chance that a spawn is a healthy cell you must not tap. */
  cellChance: number
  superbugChance: number
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    lives: 5,
    germLifeMs: 3_200,
    spawnStartMs: 1_100,
    spawnMinMs: 650,
    cellChance: 0.15,
    superbugChance: 0.05,
  },
  normal: {
    label: 'Normal',
    lives: 3,
    germLifeMs: 1_900,
    spawnStartMs: 850,
    spawnMinMs: 450,
    cellChance: 0.22,
    superbugChance: 0.1,
  },
  hard: {
    label: 'Hard',
    lives: 3,
    germLifeMs: 1_350,
    spawnStartMs: 650,
    spawnMinMs: 320,
    cellChance: 0.28,
    superbugChance: 0.15,
  },
}

export const VITAMIN_CHANCE = 0.05
export const MAX_LIVES = 6

export const ENTITY_INFO: Record<EntityKind, { emoji: string; label: string }> = {
  germ: { emoji: '🦠', label: 'Germ' },
  superbug: { emoji: '👾', label: 'Superbug' },
  cell: { emoji: '🩸', label: 'Healthy cell' },
  vitamin: { emoji: '💊', label: 'Vitamin' },
}

export interface Entity {
  id: number
  kind: EntityKind
  /** Superbugs need two hits. */
  hp: number
  lifeMs: number
  maxLifeMs: number
}

export type Feedback = { id: number; kind: 'good' | 'bad'; text: string }

export interface GameState {
  status: 'ready' | 'playing' | 'paused' | 'over'
  difficulty: Difficulty
  gridSize: number
  roundMs: number
  timeLeftMs: number
  lives: number
  score: number
  combo: number
  bestCombo: number
  zapped: number
  escaped: number
  cells: (Entity | null)[]
  nextSpawnMs: number
  nextId: number
  feedback: Feedback | null
  endReason: 'time' | 'lives' | null
}

// Random numbers are passed in with actions so the reducer stays pure.
export type GameAction =
  | { type: 'start' }
  | { type: 'tick'; dtMs: number; rolls: [number, number] }
  | { type: 'tap'; index: number }
  | { type: 'togglePause' }
  | { type: 'reset'; difficulty: Difficulty; roundSeconds: number; gridSize: number }

export function initialState(
  difficulty: Difficulty,
  roundSeconds: number,
  gridSize: number,
): GameState {
  return {
    status: 'ready',
    difficulty,
    gridSize,
    roundMs: roundSeconds * 1000,
    timeLeftMs: roundSeconds * 1000,
    lives: DIFFICULTIES[difficulty].lives,
    score: 0,
    combo: 0,
    bestCombo: 0,
    zapped: 0,
    escaped: 0,
    cells: Array(gridSize * gridSize).fill(null),
    nextSpawnMs: 400,
    nextId: 1,
    feedback: null,
    endReason: null,
  }
}

export function comboMultiplier(combo: number): number {
  return Math.min(1 + Math.floor(combo / 5) * 0.5, 3)
}

/** Spawn interval eases from spawnStartMs to spawnMinMs over the round. */
export function spawnInterval(state: GameState): number {
  const config = DIFFICULTIES[state.difficulty]
  const progress = 1 - state.timeLeftMs / state.roundMs
  return config.spawnStartMs - (config.spawnStartMs - config.spawnMinMs) * progress
}

function pickKind(roll: number, config: DifficultyConfig): EntityKind {
  if (roll < VITAMIN_CHANCE) return 'vitamin'
  if (roll < VITAMIN_CHANCE + config.cellChance) return 'cell'
  if (roll < VITAMIN_CHANCE + config.cellChance + config.superbugChance) return 'superbug'
  return 'germ'
}

function spawn(state: GameState, rolls: [number, number]): GameState {
  const empty = state.cells.flatMap((c, i) => (c ? [] : [i]))
  const nextSpawnMs = spawnInterval(state)
  if (empty.length === 0) return { ...state, nextSpawnMs }

  const config = DIFFICULTIES[state.difficulty]
  const kind = pickKind(rolls[0], config)
  const index = empty[Math.floor(rolls[1] * empty.length)]
  // Superbugs linger a bit longer since they take two hits; cells and vitamins are brief.
  const lifeMs =
    kind === 'superbug'
      ? config.germLifeMs * 1.4
      : kind === 'germ'
        ? config.germLifeMs
        : config.germLifeMs * 0.9
  const cells = [...state.cells]
  cells[index] = { id: state.nextId, kind, hp: kind === 'superbug' ? 2 : 1, lifeMs, maxLifeMs: lifeMs }
  return { ...state, cells, nextId: state.nextId + 1, nextSpawnMs }
}

function withFeedback(state: GameState, kind: Feedback['kind'], text: string): GameState {
  return { ...state, nextId: state.nextId + 1, feedback: { id: state.nextId, kind, text } }
}

function loseLife(state: GameState, text: string): GameState {
  const lives = state.lives - 1
  const next = withFeedback({ ...state, lives, combo: 0 }, 'bad', text)
  return lives <= 0 ? { ...next, status: 'over', endReason: 'lives' } : next
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'reset':
      return initialState(action.difficulty, action.roundSeconds, action.gridSize)

    case 'start':
      return state.status === 'ready' ? { ...state, status: 'playing' } : state

    case 'togglePause':
      if (state.status === 'playing') return { ...state, status: 'paused' }
      if (state.status === 'paused') return { ...state, status: 'playing' }
      return state

    case 'tick': {
      if (state.status !== 'playing') return state
      let next: GameState = { ...state, timeLeftMs: Math.max(0, state.timeLeftMs - action.dtMs) }

      // Age everything on the board. Germs that run out of time escape and cost a life.
      let escapes = 0
      const cells = next.cells.map((e) => {
        if (!e) return null
        const lifeMs = e.lifeMs - action.dtMs
        if (lifeMs > 0) return { ...e, lifeMs }
        if (e.kind === 'germ' || e.kind === 'superbug') escapes++
        return null
      })
      next = { ...next, cells, escaped: next.escaped + escapes }
      for (let i = 0; i < escapes; i++) {
        next = loseLife(next, 'A germ got away!')
        if (next.status === 'over') return next
      }

      if (next.timeLeftMs <= 0) return { ...next, status: 'over', endReason: 'time' }

      const nextSpawnMs = next.nextSpawnMs - action.dtMs
      if (nextSpawnMs <= 0) return spawn(next, action.rolls)
      return { ...next, nextSpawnMs }
    }

    case 'tap': {
      if (state.status !== 'playing') return state
      const entity = state.cells[action.index]
      if (!entity) return state
      const cells = [...state.cells]

      if (entity.kind === 'cell') {
        cells[action.index] = null
        return loseLife({ ...state, cells }, 'Ouch! That was a healthy cell.')
      }

      if (entity.kind === 'vitamin') {
        cells[action.index] = null
        const gained = state.lives < MAX_LIVES
        return withFeedback(
          { ...state, cells, score: state.score + 50, lives: Math.min(state.lives + 1, MAX_LIVES) },
          'good',
          gained ? 'Vitamin boost! +1 life' : 'Vitamin boost! +50',
        )
      }

      if (entity.hp > 1) {
        cells[action.index] = { ...entity, hp: entity.hp - 1 }
        return { ...state, cells }
      }

      cells[action.index] = null
      const base = entity.kind === 'superbug' ? 30 : 10
      const speedBonus = Math.round((entity.lifeMs / entity.maxLifeMs) * 10)
      const points = Math.round((base + speedBonus) * comboMultiplier(state.combo))
      const combo = state.combo + 1
      const next: GameState = {
        ...state,
        cells,
        score: state.score + points,
        combo,
        bestCombo: Math.max(state.bestCombo, combo),
        zapped: state.zapped + 1,
      }
      // Call out combo milestones; ordinary zaps keep the last message.
      return combo % 5 === 0
        ? withFeedback(next, 'good', `${combo} combo! ×${comboMultiplier(combo)} points`)
        : next
    }
  }
}
