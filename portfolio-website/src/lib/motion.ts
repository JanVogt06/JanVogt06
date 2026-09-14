import type {Variants} from "framer-motion"

export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const fadeUp: Variants = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.55, ease: EASE}},
}

// Entrances hang off this rather than off per-element delays, so the whole
// page arrives on one beat once the scene reports itself ready.
export const stage: Variants = {
    hidden: {},
    show: {transition: {staggerChildren: 0.08, delayChildren: 0.12}},
}

export const rise: Variants = {
    hidden: {opacity: 0, y: 18},
    show: {opacity: 1, y: 0, transition: {duration: 0.7, ease: EASE}},
}

export const wipe: Variants = {
    hidden: {y: "110%"},
    show: {y: 0, transition: {duration: 1, ease: EASE}},
}
