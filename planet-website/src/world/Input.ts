import { touch } from '../ui/store'

const bindings: Record<string, Action> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
  Space: 'jump',
  KeyR: 'reset',
}

export type Action = 'forward' | 'backward' | 'left' | 'right' | 'boost' | 'jump' | 'reset'

export class Input {
  private held = new Set<Action>()
  private pressed = new Set<Action>()
  private listening = true
  // Taps on the touch buttons already acted on.
  private seen = { jumps: 0, resets: 0 }

  constructor() {
    window.addEventListener('keydown', (event) => {
      const action = bindings[event.code]
      // A key still down from before a pause only counts once pressed anew.
      if (!this.listening || !action || (event.repeat && !this.held.has(action))) return
      event.preventDefault()
      if (!this.held.has(action)) this.pressed.add(action)
      this.held.add(action)
    })
    window.addEventListener('keyup', (event) => {
      const action = bindings[event.code]
      if (action) this.held.delete(action)
    })
    window.addEventListener('blur', () => this.held.clear())
  }

  // While paused the keys belong to the page again, and nothing held at the
  // time carries on driving once the game resumes.
  set enabled(listening: boolean) {
    this.listening = listening
    this.held.clear()
    this.pressed.clear()
    this.seen = { jumps: touch.jumps, resets: touch.resets }
  }

  // Throttle from -1 (full reverse) to 1 (full ahead), from keys or stick.
  get throttle() {
    if (!this.listening) return 0
    const keys = Number(this.held.has('forward')) - Number(this.held.has('backward'))
    return Math.max(-1, Math.min(1, keys + touch.y))
  }

  // Steering from -1 (full right) to 1 (full left), from keys or stick.
  get steer() {
    if (!this.listening) return 0
    const keys = Number(this.held.has('left')) - Number(this.held.has('right'))
    return Math.max(-1, Math.min(1, keys - touch.x))
  }

  isHeld(action: Action) {
    return this.held.has(action) || (action === 'boost' && this.listening && touch.boost)
  }

  // True once per key press or tap, however many physics steps run in
  // between.
  consume(action: Action) {
    if (this.pressed.delete(action)) return true
    if (!this.listening) return false
    if (action === 'jump' && touch.jumps > this.seen.jumps) {
      this.seen.jumps = touch.jumps
      return true
    }
    if (action === 'reset' && touch.resets > this.seen.resets) {
      this.seen.resets = touch.resets
      return true
    }
    return false
  }
}
