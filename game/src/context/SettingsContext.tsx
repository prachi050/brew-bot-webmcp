import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Difficulty } from '../game/engine'
import { readJson, writeJson } from '../game/storage'

export interface Settings {
  playerName: string
  difficulty: Difficulty
  roundSeconds: 30 | 60 | 90
  gridSize: 3 | 4 | 5
  volume: number
  theme: string
  showTimerBars: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  playerName: '',
  difficulty: 'easy',
  roundSeconds: 60,
  gridSize: 4,
  volume: 60,
  theme: 'emerald',
  showTimerBars: true,
}

export const THEMES = ['emerald', 'light', 'cupcake', 'retro', 'night', 'dark', 'synthwave', 'forest']

const KEY = 'germ-buster:settings'

interface SettingsValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => readJson(KEY, DEFAULT_SETTINGS))

  useEffect(() => {
    writeJson(KEY, settings)
    document.documentElement.dataset.theme = settings.theme
  }, [settings])

  const value: SettingsValue = {
    settings,
    update: (patch) => setSettings((s) => ({ ...s, ...patch })),
    reset: () => setSettings(DEFAULT_SETTINGS),
  }
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings must be used inside SettingsProvider')
  return value
}
