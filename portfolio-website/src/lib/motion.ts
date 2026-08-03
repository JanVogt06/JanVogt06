import type {Variants} from "framer-motion"

/**
 * Zentrale Animations-Bausteine.
 *
 * Nur noch das Easing und EIN Variant. Der Rest (scaleIn, slideInLeft, stagger)
 * ist mit dem Umbau auf scroll-getriebene Bewegung weggefallen: Werdegang,
 * Projekte und Kontakt schreiben ihre Transforms jetzt selbst aus dem
 * Scroll-Fortschritt, statt einmalige Varianten abzuspielen. framer-motion
 * traegt nur noch, was wirklich einmalig beim Laden passiert.
 */

// Gemeinsames Easing (sanftes "ease-out expo"-Gefühl) für die ganze Seite.
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const fadeUp: Variants = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.55, ease: EASE}},
}
