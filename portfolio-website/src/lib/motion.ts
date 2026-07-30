import type {Variants} from "framer-motion"

/** Zentrale Animations-Bausteine: ein Easing, ein Satz Varianten für alles. */

// Gemeinsames Easing (sanftes "ease-out expo"-Gefühl) für die ganze Seite.
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const fadeUp: Variants = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.55, ease: EASE}},
}

export const scaleIn: Variants = {
    hidden: {opacity: 0, scale: 0.92},
    show: {opacity: 1, scale: 1, transition: {duration: 0.55, ease: EASE}},
}

export const slideInLeft: Variants = {
    hidden: {opacity: 0, x: -40},
    show: {opacity: 1, x: 0, transition: {duration: 0.55, ease: EASE}},
}

export const slideInRight: Variants = {
    hidden: {opacity: 0, x: 40},
    show: {opacity: 1, x: 0, transition: {duration: 0.55, ease: EASE}},
}

// Parent-Container, der seine Kinder gestaffelt einblendet.
export const stagger = (staggerChildren = 0.1, delayChildren = 0): Variants => ({
    hidden: {},
    show: {transition: {staggerChildren, delayChildren}},
})
