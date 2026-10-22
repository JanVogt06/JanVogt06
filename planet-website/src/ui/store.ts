import { useSyncExternalStore } from 'react'
import type { Station } from '../content/stations'

// How the planet is shown: the start menu over it, driving the rover, a
// flight from station to station as the page scrolls, the whole planet to
// turn about, or plain text without any 3D.
export type Mode = 'menu' | 'drive' | 'tour' | 'planet' | 'text'

export interface UiState {
  mode: Mode
  // A station the address points at, to open the view at.
  focus: string | null
  // Whether the 3D world has loaded, and how far it has got.
  world: 'idle' | 'loading' | 'ready' | 'failed'
  progress: number
  // The station the rover is close to, whose name tag is showing.
  nearby: Station | null
  // The station whose panel is open. The world holds still while it is.
  open: Station | null
  // Whether it is night on the planet.
  night: boolean
}

let state: UiState = { mode: 'menu', focus: null, world: 'idle', progress: 0, nearby: null, open: null, night: false }
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

// How far down the tour the page has scrolled, in stops: 0 at the first,
// 1 at the second and so on. The tour's camera reads it every frame.
export const tour = { position: 0 }

// A time of day the visitor picked, for the world to hurry on to.
export const clock = { wish: null as 'day' | 'night' | null }

// Where each station's label sits on screen in the planet view, written by
// the world every frame and drawn by the labels on their own frame.
export const labels = { points: [] as { id: string; x: number; y: number; shown: boolean }[] }
