import {motion, useInView} from "framer-motion"
import type {Variants} from "framer-motion"
import {useRef} from "react"
import type {CSSProperties, ReactNode} from "react"

/**
 * Scroll-Reveal-Wrapper. Kinder mit eigenen `variants` (z.B. gestaffelte
 * Listen) erben den hidden/show-Zustand über den Variant-Baum.
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
    // Ohne margin: die Animation laeuft, WAEHREND das Element hereinscrollt –
    // nicht verspaetet (negativer margin) und nicht off-screen fertig
    // (positiver margin).
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
