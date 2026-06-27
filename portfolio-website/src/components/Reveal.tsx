import {motion, useInView} from "framer-motion"
import type {Variants} from "framer-motion"
import {useRef} from "react"
import type {CSSProperties, ReactNode} from "react"

/**
 * Scroll-Reveal-Wrapper.
 *
 * Nutzt bewusst NICHT framer's `whileInView`, sondern einen eigenen
 * useInView-Hook + kontrolliertes `animate` – exakt das Muster, das bei Hero
 * und GitGraph flüssig läuft. `whileInView` führte hier zu ruckelnden Karten.
 *
 * Kinder mit eigenen `variants` (z.B. gestaffelte Listen) erben den
 * hidden/show-Zustand automatisch über den Variant-Baum.
 */
export const Reveal = ({
    variants,
    className,
    style,
    children,
}: {
    variants: Variants
    className?: string
    style?: CSSProperties
    children: ReactNode
}) => {
    const ref = useRef<HTMLDivElement>(null)
    // Auslösen genau beim "Peek-in" (Element berührt unteren Viewport-Rand):
    // Die Animation läuft, WÄHREND die Karte hereinscrollt – sichtbar, aber
    // ohne den verspäteten Snap (kein negativer Margin) und ohne dass sie
    // off-screen schon fertig ist (kein großer positiver Vorlauf).
    const inView = useInView(ref, {once: true})

    return (
        <motion.div
            ref={ref}
            className={className}
            style={style}
            variants={variants}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
        >
            {children}
        </motion.div>
    )
}

export default Reveal
