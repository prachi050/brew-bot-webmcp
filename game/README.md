# Germ Buster

A quick reflex game for all ages, built with React, TypeScript and daisyUI (Tailwind CSS v4), bundled with Vite.

Germs pop up on a grid. Tap them before they get away, but don't tap the healthy cells. Superbugs take two hits, and vitamins give you an extra heart. Zap germs in a row to build a combo multiplier.

## Pages

| Route | What's there |
|---|---|
| `#/` | Home, with best scores per difficulty |
| `#/play` | The game |
| `#/help` | Rules, scoring, difficulty levels and controls |
| `#/settings` | Player name, difficulty, round length, board size, countdown rings, volume, theme, reset |
| `#/about` | About the game |

Settings and best scores are saved in `localStorage`.

## Run it

```bash
cd game
npm install
npm run dev       # dev server
npm run build     # type-check and build to dist/
npm run preview   # serve the build
```

The build uses relative paths and hash routing, so `dist/` can be hosted from any static host or subfolder, including GitHub Pages.

## Code layout

- `src/game/engine.ts`: game rules as a pure reducer (`gameReducer`) plus difficulty settings. Random numbers come in with actions, so the reducer is deterministic.
- `src/game/sound.ts`: sound effects generated with the Web Audio API (no audio files).
- `src/game/storage.ts`: `localStorage` helpers for settings and high scores.
- `src/context/SettingsContext.tsx`: settings state shared across pages.
- `src/pages/`: one component per page.
