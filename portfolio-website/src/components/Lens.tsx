import {useId, useLayoutEffect, useRef, useState} from "react"

/** Thickness of the refracting rim in px, and how far it bends what lies behind. */
const BAND = 26
const BEND = 74

/** A rim never takes more than this share of the shorter side. */
const MAX_SHARE = 0.3

const stops = (band: number, channel: "r" | "g") => {
    const at = (value: number) =>
        channel === "r" ? `rgb(${value},0,128)` : `rgb(0,${value},128)`
    return `
        <stop offset="0" stop-color="${at(0)}"/>
        <stop offset="${band}" stop-color="${at(128)}"/>
        <stop offset="${1 - band}" stop-color="${at(128)}"/>
        <stop offset="1" stop-color="${at(255)}"/>`
}

/**
 * Displacement map for the lens. Red carries the horizontal shift, green the vertical
 * one, both neutral (128) across the middle and ramping to the extremes inside a band
 * along each edge. The two ramps are combined with `lighten`, which keeps them in their
 * own channel - so a corner bends on both axes at once, and that is what reads as glass.
 */
const rimOf = (width: number, height: number) =>
    Math.min(BAND, Math.min(width, height) * MAX_SHARE)

const mapUri = (width: number, height: number) => {
    const rim = rimOf(width, height)
    const bx = rim / width
    const by = rim / height
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <defs>
            <linearGradient id="x" x1="0" y1="0" x2="1" y2="0">${stops(bx, "r")}</linearGradient>
            <linearGradient id="y" x1="0" y1="0" x2="0" y2="1">${stops(by, "g")}</linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#x)"/>
        <rect width="100%" height="100%" fill="url(#y)" style="mix-blend-mode:lighten"/>
    </svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, " "))}`
}

/**
 * The refracting layer of a glass surface. Sits behind the content and bends the
 * background along its rim.
 *
 * If the browser cannot resolve the feImage, feDisplacementMap falls back to the neutral
 * flood underneath it, the displacement becomes zero and what is left is the plain
 * blurred backdrop - the surface stays intact, it just loses the refraction.
 */
const Lens = () => {
    const ref = useRef<HTMLSpanElement>(null)
    const [box, setBox] = useState<{width: number; height: number} | null>(null)
    const id = `lens${useId().replace(/[^a-zA-Z0-9]/g, "")}`

    // Measured before paint, so the surface never shows a frame without its refraction.
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return

        const measure = () => {
            const {width, height} = el.getBoundingClientRect()
            if (width < 1 || height < 1) return
            setBox((previous) =>
                previous &&
                Math.abs(previous.width - width) < 1 &&
                Math.abs(previous.height - height) < 1
                    ? previous
                    : {width: Math.round(width), height: Math.round(height)},
            )
        }

        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <>
            {box && (
                <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
                    <filter
                        id={id}
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodColor="#8080ff" result="neutral"/>
                        <feImage
                            href={mapUri(box.width, box.height)}
                            x="0"
                            y="0"
                            width={box.width}
                            height={box.height}
                            preserveAspectRatio="none"
                            result="ramp"
                        />
                        <feComposite in="ramp" in2="neutral" operator="over" result="map"/>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="map"
                            scale={(BEND * rimOf(box.width, box.height)) / BAND}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </svg>
            )}

            <span
                ref={ref}
                aria-hidden="true"
                className="lens"
                style={box ? {filter: `url(#${id})`} : undefined}
            />
        </>
    )
}

export default Lens
