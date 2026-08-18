import type {Variants} from "framer-motion"

// Shared easing for the whole page.
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const fadeUp: Variants = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.55, ease: EASE}},
}
