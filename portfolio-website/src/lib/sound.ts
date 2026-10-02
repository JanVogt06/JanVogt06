/**
 * Surf, made on the spot: brown noise through a filter that opens and closes
 * with two slow swells, so no two waves break quite alike.
 */
type Listener = (on: boolean) => void

const listeners = new Set<Listener>()
let on = false
let context: AudioContext | null = null
let master: GainNode | null = null

const FADE = 1.4

const build = (ctx: AudioContext) => {
    const seconds = 6
    const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel)
        let last = 0
        for (let i = 0; i < data.length; i++) {
            last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02
            data[i] = last * 3.5
        }
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 420
    filter.Q.value = 0.6

    const swell = ctx.createGain()
    swell.gain.value = 0.55

    const out = ctx.createGain()
    out.gain.value = 0

    const waves: Array<[number, number, AudioParam]> = [
        [0.083, 0.3, swell.gain],
        [0.051, 0.15, swell.gain],
        [0.083, 260, filter.frequency],
        [0.031, 120, filter.frequency],
    ]
    waves.forEach(([rate, depth, param]) => {
        const lfo = ctx.createOscillator()
        lfo.frequency.value = rate
        const amount = ctx.createGain()
        amount.gain.value = depth
        lfo.connect(amount).connect(param)
        lfo.start()
    })

    source.connect(filter).connect(swell).connect(out).connect(ctx.destination)
    source.start()
    return out
}

const set = (next: boolean) => {
    on = next
    listeners.forEach((listener) => listener(on))

    if (on) {
        if (!context) {
            const Context = window.AudioContext ?? (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext
            if (!Context) return
            context = new Context()
            master = build(context)
        }
        void context.resume()
        master?.gain.setTargetAtTime(0.32, context.currentTime, FADE / 3)
    } else if (context && master) {
        const ctx = context
        master.gain.setTargetAtTime(0, ctx.currentTime, FADE / 4)
        window.setTimeout(() => {
            if (!on) void ctx.suspend()
        }, FADE * 1000)
    }
}

export const sound = {
    isOn: () => on,
    toggle: () => set(!on),
    subscribe: (listener: Listener) => {
        listeners.add(listener)
        return () => {
            listeners.delete(listener)
        }
    },
}
