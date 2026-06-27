import type {Variants, Transition} from "framer-motion"

/**
 * Zentrale Animations-Bausteine für die gesamte Seite.
 *
 * Alle Sektionen verwenden ausschließlich framer-motion (kein CSS-@keyframes,
 * kein eigener IntersectionObserver) – einheitliches Easing, einheitliches
 * Scroll-Trigger-Verhalten, eine einzige Quelle der Wahrheit.
 */

// Gemeinsames Easing (sanftes "ease-out expo"-Gefühl) für die ganze Seite.
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Einheitlicher Viewport-Trigger für whileInView.
export const viewportOnce = {once: true, margin: "-80px"} as const

export const fadeUp: Variants = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.55, ease: EASE}},
}

export const fadeIn: Variants = {
    hidden: {opacity: 0},
    show: {opacity: 1, transition: {duration: 0.5, ease: EASE}},
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

// SVG-Pfad "zeichnen": pathLength von 0 -> 1.
export const drawPath = (delay = 0, duration = 0.9): Variants => ({
    hidden: {pathLength: 0, opacity: 0},
    show: {
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: {duration, delay, ease: EASE},
            opacity: {duration: 0.2, delay},
        } as Transition,
    },
})
