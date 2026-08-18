import {useCallback, useEffect, useRef, useState} from "react"
import {SpaceScene} from "@/lib/space/SpaceScene"
import type {Pick} from "@/lib/space/SpaceScene"
import {attachScene, emitAnchor} from "@/lib/space/controller"
import useScrollProgress from "@/lib/useScrollProgress"

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/* Where the three moods peak, as a fraction of the page length. */
const HERO_END = 0.24
const WORK_CENTER = 0.52
const WORK_SPREAD = 0.42
const CONTACT_START = 0.76

const Atmosphere = ({
    scene: sceneEnabled,
    crystalCount,
    onPick,
}: {
    /** Whether the WebGL scene runs; otherwise only the CSS layers remain. */
    scene: boolean
    /** Number of clickable crystals. 0 = nebula without crystals. */
    crystalCount: number
    /** A click in space, on a crystal or on a planet. */
    onPick: (pick: Pick) => void
}) => {
    const pageRef = useRef<HTMLElement>(document.documentElement)
    const heroRef = useRef<HTMLDivElement>(null)
    const workRef = useRef<HTMLDivElement>(null)
    const contactRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<SpaceScene | null>(null)

    const [hovered, setHovered] = useState<Pick | null>(null)

    const selectRef = useRef(onPick)
    useEffect(() => {
        selectRef.current = onPick
    }, [onPick])

    useEffect(() => {
        if (!canvasRef.current || !sceneEnabled) return

        const scene = new SpaceScene({
            container: canvasRef.current,
            count: crystalCount,
            onHover: setHovered,
            onSelect: (pick) => selectRef.current(pick),
            onAnchor: emitAnchor,
        })
        sceneRef.current = scene
        attachScene(scene)

        return () => {
            attachScene(null)
            sceneRef.current = null
            scene.dispose()
        }
    }, [sceneEnabled, crystalCount])

    const onProgress = useCallback((raw: number) => {
        const p = clamp01(raw)
        if (heroRef.current) {
            heroRef.current.style.opacity = String(clamp01(1 - p / HERO_END))
        }
        if (workRef.current) {
            workRef.current.style.opacity = String(clamp01(1 - Math.abs(p - WORK_CENTER) / WORK_SPREAD))
        }
        if (contactRef.current) {
            contactRef.current.style.opacity = String(clamp01((p - CONTACT_START) / (1 - CONTACT_START)))
        }
        sceneRef.current?.setPageProgress(p)
    }, [])

    useScrollProgress(pageRef, onProgress)

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

            {/* Base tone, always present */}
            <div className="absolute inset-0 bg-page"/>

            {}
            <div
                ref={heroRef}
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(115% 80% at 50% -10%, #101728 0%, #0a0f1c 38%, rgba(7,9,16,0.6) 62%, transparent 82%)",
                }}
            />

            {}
            <div
                ref={workRef}
                className="absolute inset-0"
                style={{
                    opacity: 0,
                    background:
                        "radial-gradient(90% 70% at 85% 15%, rgba(34,211,238,0.05) 0%, transparent 62%), radial-gradient(80% 70% at 10% 85%, rgba(8,145,178,0.06) 0%, transparent 62%)",
                }}
            />

            {}
            <div
                ref={contactRef}
                className="absolute inset-0"
                style={{
                    opacity: 0,
                    background:
                        "radial-gradient(100% 80% at 15% 100%, rgba(94,78,168,0.09) 0%, transparent 62%), radial-gradient(70% 60% at 90% 20%, rgba(34,211,238,0.04) 0%, transparent 62%)",
                }}
            />

            {/* Nebula and crystals: one canvas, one WebGL context */}
            <div ref={canvasRef} className="absolute inset-0"/>

            {/* Grid and noise sit above everything, once instead of per section */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
            />

            {}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(140% 110% at 50% 45%, transparent 70%, rgba(5,7,13,0.55) 100%)",
                }}
            />

            {}
            {hovered !== null && <CursorHint/>}
        </div>
    )
}

/** Sets the cursor to clickable while a crystal lies under it. */
const CursorHint = () => {
    useEffect(() => {
        const previous = document.body.style.cursor
        document.body.style.cursor = "pointer"
        return () => {
            document.body.style.cursor = previous
        }
    }, [])
    return null
}

export default Atmosphere
