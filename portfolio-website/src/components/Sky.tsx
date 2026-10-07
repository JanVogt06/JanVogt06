import {useEffect, useRef, useState} from "react"
import {constellations, sky} from "@/lib/constellations"
import {sea} from "@/lib/sea/controller"

// Each figure is named under its lowest star, clear of its own lines.
const anchors = constellations.map((c) =>
    c.stars.reduce((low, star, i) => (star.wide[1] < c.stars[low].wide[1] ? i : low), 0),
)

const flat = constellations.flatMap((c, g) => c.stars.map((star, i) => ({star, group: g, first: i === anchors[g]})))

/**
 * The names of the stars the scene draws over the night: each written beside
 * its star and moved with it every frame. The name of a constellation lights
 * the whole figure up while the pointer rests on it.
 */
const Sky = () => {
    const rootRef = useRef<HTMLDivElement>(null)
    const labelRefs = useRef<Array<HTMLElement | null>>([])
    const [active, setActive] = useState<number | null>(null)

    useEffect(() => {
        sky.listen((marks, amount) => {
            const root = rootRef.current
            if (!root) return
            root.style.opacity = String(amount)
            root.style.visibility = amount > 0.02 ? "visible" : "hidden"
            if (amount <= 0.02) return
            marks.forEach((mark, i) => {
                const el = labelRefs.current[i]
                if (el) el.style.transform = `translate3d(${mark.x.toFixed(1)}px, ${mark.y.toFixed(1)}px, 0)`
            })
        })
        return () => sky.listen(null)
    }, [])

    useEffect(() => {
        sea.setFigure(active)
    }, [active])

    return (
        <div
            ref={rootRef}
            data-overlay
            className="ink pointer-events-none fixed inset-0 z-20"
            style={{opacity: 0, visibility: "hidden"}}
        >
            <h2 className="label absolute left-[var(--gutter)] top-20 text-fg-3 md:top-24">Am Himmel: womit ich arbeite</h2>
            {flat.map(({star, group, first}, i) => (
                <div
                    key={`${group}-${star.name}`}
                    ref={(el) => {
                        labelRefs.current[i] = el
                    }}
                    className="absolute left-0 top-0 will-change-transform"
                >
                    <span
                        className={`absolute left-2.5 top-1 whitespace-nowrap font-mono text-[0.625rem] tracking-[0.06em] transition-colors duration-300 ${
                            active === group ? "text-fg" : "text-fg-3"
                        }`}
                    >
                        {star.name}
                    </span>
                    {first && (
                        <button
                            type="button"
                            onPointerEnter={() => setActive(group)}
                            onPointerLeave={() => setActive(null)}
                            onFocus={() => setActive(group)}
                            onBlur={() => setActive(null)}
                            className={`label pointer-events-auto absolute left-1 top-5 flex h-8 items-center gap-2 whitespace-nowrap transition-colors duration-300 ${
                                active === group ? "text-fg" : "text-fg-2"
                            }`}
                        >
                            <span aria-hidden="true" className="h-px w-4 bg-current opacity-60"/>
                            {constellations[group].name}
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}

export default Sky
