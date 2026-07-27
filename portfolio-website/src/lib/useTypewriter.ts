import {useEffect, useState} from "react"

/**
 * Tippt einen String zeichenweise.
 *
 * Absichtlich in Zeichen pro Sekunde statt in einer Gesamtdauer angegeben: so
 * bleibt das Tempo gleich, egal wie lang der Befehl ist – ein längeres Kommando
 * braucht dann eben länger, genau wie beim echten Tippen.
 *
 * `enabled: false` (prefers-reduced-motion) gibt sofort den vollständigen Text
 * zurück, damit nichts vom Ablauf einer Animation abhängt.
 *
 * Der Zustand ist die Anzahl getippter Zeichen, der sichtbare Text wird daraus
 * abgeleitet. So muss im Effect kein State gesetzt werden – das wäre ein
 * zusätzlicher Render pro Durchlauf und react-hooks verbietet es zu Recht.
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
