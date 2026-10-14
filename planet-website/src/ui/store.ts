import { useSyncExternalStore } from 'react'
import type { Station } from '../content/stations'

export interface UiState {
  // The station the rover is close to, whose name tag is showing.
  nearby: Station | null
  // The station whose panel is open. The game holds still while it is.
  open: Station | null
}

let state: UiState = { nearby: null, open: null }
const listeners = new Set<() => void>()

export const ui = {
  get: () => state,
  set(patch: Partial<UiState>) {
    const next = { ...state, ...patch }
    if ((Object.keys(patch) as (keyof UiState)[]).every((key) => next[key] === state[key])) return
    state = next
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useUi() {
  return useSyncExternalStore(ui.subscribe, ui.get)
}

// Where the name tag sits on screen and how far parking has got. The game
// writes this every frame; the tag reads it on its own animation frame so
// React never re-renders per frame.
export const tag = { x: 0, y: 0, onScreen: false, progress: 0 }
