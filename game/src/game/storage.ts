import type { Difficulty } from './engine'

// localStorage can be missing or throw (private mode, blocked storage); never let that break the game.
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore: settings just won't persist.
  }
}

const SCORES_KEY = 'germ-buster:high-scores'
export type HighScores = Record<Difficulty, number>
const NO_SCORES: HighScores = { easy: 0, normal: 0, hard: 0 }

export function getHighScores(): HighScores {
  return readJson(SCORES_KEY, NO_SCORES)
}

/** Records a score and returns true if it beat the previous best. */
export function recordScore(difficulty: Difficulty, score: number): boolean {
  const scores = getHighScores()
  if (score <= scores[difficulty]) return false
  writeJson(SCORES_KEY, { ...scores, [difficulty]: score })
  return true
}

export function clearHighScores(): void {
  writeJson(SCORES_KEY, NO_SCORES)
}
