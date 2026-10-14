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
  }

  isHeld(action: Action) {
    return this.held.has(action)
  }

  // True once per key press, however many physics steps run in between.
  consume(action: Action) {
    return this.pressed.delete(action)
  }
}
