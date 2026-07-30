import {useEffect, useState} from "react"

/**
 * Tippt einen String zeichenweise.
 *
 * Tempo in Zeichen pro Sekunde statt Gesamtdauer: so tippt ein langes Kommando
 * laenger statt schneller. `enabled: false` (prefers-reduced-motion) gibt
 * sofort den vollstaendigen Text zurueck.
 */
export const useTypewriter = (
    text: string,
    {startDelay = 0, cps = 22, enabled = true}: { startDelay?: number; cps?: number; enabled?: boolean } = {},
) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!enabled) return

        let typedSoFar = 0
        let interval: number | undefined

        const start = window.setTimeout(() => {
            interval = window.setInterval(() => {
                typedSoFar += 1
                setCount(typedSoFar)
                if (typedSoFar >= text.length && interval) window.clearInterval(interval)
            }, 1000 / cps)
        }, startDelay)

        return () => {
            window.clearTimeout(start)
            if (interval) window.clearInterval(interval)
        }
    }, [text.length, startDelay, cps, enabled])

    return {
        typed: enabled ? text.slice(0, count) : text,
        done: !enabled || count >= text.length,
    }
}

export default useTypewriter
