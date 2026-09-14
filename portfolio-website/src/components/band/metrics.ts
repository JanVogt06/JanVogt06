import {space} from "@/lib/space/controller"

export type BandMetrics = {
    weight: number

    top: number

    height: number
}

const bands = new Map<symbol, BandMetrics>()

const OWNS_FRAME = 0.5

const flush = () => {
    let owner: BandMetrics | null = null
    bands.forEach((band) => {
        if (band.weight < OWNS_FRAME) return
        if (!owner || band.weight > owner.weight) owner = band
    })

    const held = owner as BandMetrics | null

    document.documentElement.style.setProperty(
        "--band-h",
        `${Math.round(held ? held.height : 0)}px`,
    )

    space.setTextRail(
        held ? Math.min(Math.max(held.top / window.innerHeight, 0), 1) : 1,
        held ? held.weight : 0,
    )
}

export const report = (id: symbol, metrics: BandMetrics) => {
    bands.set(id, metrics)
    flush()
}

export const release = (id: symbol) => {
    if (!bands.delete(id)) return
    flush()
}
