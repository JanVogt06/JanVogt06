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

  constructor() {
    window.addEventListener('keydown', (event) => {
      const action = bindings[event.code]
      if (!action) return
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

  isHeld(action: Action) {
    return this.held.has(action)
  }

  // True once per key press, however many physics steps run in between.
  consume(action: Action) {
    return this.pressed.delete(action)
  }
}
