import {space} from "@/lib/space/controller"

export type BandMetrics = {
    weight: number

    top: number

    right: number

    height: number
}

const bands = new Map<symbol, BandMetrics>()

const OWNS_FRAME = 0.5

/** Where a leader line from the scene should land: the right end of the
 *  owning band's slate hairline. Null while no band holds the frame. */
let landing: {x: number; y: number} | null = null

const SLATE_CENTRE = 9

let lastTop = 1

export const landingPoint = () => landing

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

    landing = held ? {x: held.right, y: held.top + SLATE_CENTRE} : null

    // The rail stays where the last band left it and only its strength lets
    // go, so planets do not sink between stations and the dimmed edge does
    // not sweep the frame on every handover.
    if (held) lastTop = Math.min(Math.max(held.top / window.innerHeight, 0), 1)
    space.setTextRail(lastTop, held ? 1 : 0)
}

export const report = (id: symbol, metrics: BandMetrics) => {
    bands.set(id, metrics)
    flush()
}

export const release = (id: symbol) => {
    if (!bands.delete(id)) return
    flush()
}
