import {useId, useRef} from "react"
import {motion} from "framer-motion"
import {X} from "lucide-react"
import {EASE} from "@/lib/motion"
import useDialog from "@/lib/useDialog"

/** The fine print, kept out of the finale: how the page was made. A sheet
 *  from the bottom on a phone, a card on desktop. */
const Credits = ({onClose}: {onClose: () => void}) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const titleId = useId()

    useDialog(rootRef, onClose, closeRef)

    return (
        <motion.div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.24, ease: EASE}}
        >
            <button
                aria-hidden="true"
                tabIndex={-1}
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-page/80"
            />

            <motion.div
                className="relative w-full max-w-[34rem] border-t border-hair bg-panel px-[var(--gutter)] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] pt-2 sm:rounded-[4px] sm:border sm:px-7 sm:pb-7"
                initial={{y: 24}}
                animate={{y: 0}}
                exit={{y: 24}}
                transition={{duration: 0.4, ease: EASE}}
            >
                <div className="flex h-12 items-center justify-between">
                    <h2
                        id={titleId}
                        className="label text-fg-3"
                    >
                        Credits &amp; Hinweise
                    </h2>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        aria-label="Credits schließen"
                        className="-mr-3 flex h-11 w-11 items-center justify-center text-fg transition-colors duration-200 hover:opacity-70"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                <div className="space-y-4 text-sub text-fg-2">
                    <p>
                        Diese Seite ist mit KI-Unterstützung entstanden. Ich habe hier neue Modelle
                        getestet. Konzept, Design und jede Entscheidung sind von mir.
                    </p>
                    <p>
                        Meer, Himmel und Licht werden live im Browser berechnet: Die Wellen folgen
                        der Dispersionsrelation für tiefes Wasser, der Ton ist gefiltertes Rauschen.
                    </p>
                    <p>Schrift: Geist und Geist Mono von Vercel (SIL Open Font License).</p>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default Credits
