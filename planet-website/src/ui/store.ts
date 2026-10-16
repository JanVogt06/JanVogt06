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

export interface MapPoint {
  id: string
  title: string
  colour: string
  // Position on the map, within the unit disc: the rover sits at the
  // centre facing up, and the point opposite it on the planet is the rim.
  x: number
  y: number
  visited: boolean
}

// The minimap's contents, rewritten by the game every frame and drawn by
// the map on its own animation frame.
export const minimap = { points: [] as MapPoint[], nearest: null as string | null }

// What the on-screen controls are doing. The stick is x to the right and
// y forwards, each in [-1, 1]; taps on jump and reset count up.
export const touch = { x: 0, y: 0, boost: false, jumps: 0, resets: 0 }

// A thumb dragged across the screen to point the way: x to the right and y
// up, in units of the drag radius, so 1 is a full drag and more is a boost.
export const drag = { active: false, x: 0, y: 0, used: false }
