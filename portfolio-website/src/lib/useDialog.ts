import {useEffect, useRef} from "react"
import type {RefObject} from "react"
import {useIsPresent} from "framer-motion"
import {space} from "@/lib/space/controller"

const FOCUSABLE =
    "a[href], button:not([disabled]), input, select, textarea, iframe, [tabindex]:not([tabindex='-1'])"

// Dialogs can stack (a menu over nothing, a photo over nothing, but a
// project over a live preview), so the page lock is counted, not toggled.
let open = 0

// Safari does not focus a button it was tapped or clicked on, so the element
// that opened a dialog is taken from the last press when focus says nothing.
let pressed: HTMLElement | null = null
if (typeof window !== "undefined") {
    window.addEventListener(
        "pointerdown",
        (event) => {
            const target = event.target instanceof Element ? event.target : null
            pressed = target?.closest<HTMLElement>("button, a[href], [tabindex]") ?? null
        },
        {capture: true, passive: true},
    )
}

/**
 * Everything a full-screen overlay owes the page underneath it: the page stops
 * scrolling and the scene stops rendering while it is up, Escape closes it,
 * Tab stays inside it, and focus goes back to whatever opened it.
 *
 * Inside an AnimatePresence it lets go as soon as its exit starts, so a
 * navigation made from the dialog meets a live page and a running scene.
 */
export const useDialog = (
    rootRef: RefObject<HTMLElement | null>,
    onClose: () => void,
    initialRef?: RefObject<HTMLElement | null>,
) => {
    const closeRef = useRef(onClose)
    useEffect(() => {
        closeRef.current = onClose
    }, [onClose])

    const present = useIsPresent()

    useEffect(() => {
        if (!present) return

        const root = rootRef.current
        const focused =
            document.activeElement instanceof HTMLElement && document.activeElement !== document.body
                ? document.activeElement
                : null
        const opener = focused ?? pressed
        const html = document.documentElement

        open++
        if (open === 1) {
            html.style.overflow = "hidden"
            space.setPaused(true)
        }

        ;(initialRef?.current ?? root)?.focus({preventScroll: true})

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                closeRef.current()
                return
            }
            if (event.key !== "Tab" || !root) return

            const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
                (el) => el.tabIndex >= 0 && el.getClientRects().length > 0,
            )
            if (items.length === 0) return

            const first = items[0]
            const last = items[items.length - 1]
            const current = document.activeElement

            if (event.shiftKey && (current === first || !root.contains(current))) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && (current === last || !root.contains(current))) {
                event.preventDefault()
                first.focus()
            }
        }
        window.addEventListener("keydown", onKey)

        return () => {
            window.removeEventListener("keydown", onKey)
            open--
            if (open === 0) {
                html.style.overflow = ""
                space.setPaused(false)
            }
            if (opener?.isConnected) opener.focus({preventScroll: true})
        }
    }, [present, rootRef, initialRef])
}

export default useDialog
