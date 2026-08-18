import {motion, useInView} from "framer-motion"
import type {Variants} from "framer-motion"
import {useRef} from "react"
import type {CSSProperties, ReactNode} from "react"

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
    // No margin: the animation runs while the element scrolls in.
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
