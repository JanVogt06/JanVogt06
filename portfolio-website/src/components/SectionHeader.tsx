import {motion} from "framer-motion"
import Reveal from "./Reveal"
import {fadeUp, stagger} from "@/lib/motion"

/**
 * Einheitlicher Abschnittskopf.
 *
 * Vorher hatte jede Sektion denselben mittig zentrierten Block: Kommando,
 * Headline mit Gradient-Wort, Untertitel. Vier Mal identisch – dadurch hatte
 * die Seite keinen Rhythmus, alles war gleich laut.
 *
 * Jetzt links ausgerichtet und ab lg zweispaltig: Titel links, Fließtext
 * rechts auf der Grundlinie. Das ist der editoriale Trick, der die Seite
 * gebaut statt zusammengesetzt aussehen lässt. `centered` bleibt für den
 * Kontakt-Abschnitt, wo Zentrierung als Call-to-Action richtig ist.
 */
const SectionHeader = ({
    command,
    argument,
    title,
    accent,
    lead,
    centered = false,
    className,
}: {
    command: string
    argument?: string
    title: string
    accent: string
    lead: string
    centered?: boolean
    /** Überschreibt die Außenabstände – im gepinnten Projekte-Rahmen ist der
     *  Platz knapp, dort braucht der Kopf einen kleineren unteren Abstand. */
    className?: string
}) => (
    <Reveal
        variants={stagger(0.08)}
        className={
            className ??
            (centered
                ? "mb-10 text-center md:mb-14"
                : "mb-10 md:mb-16 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8")
        }
    >
        <div className={centered ? "" : "lg:col-span-7"}>
            <motion.p variants={fadeUp} className="mb-4 font-mono text-sm text-white/40">
                <span className="text-status">$</span> {command}
                {argument && <span className="text-white/25"> {argument}</span>}
            </motion.p>
            <motion.h2
                variants={fadeUp}
                className="text-5xl font-semibold tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl"
            >
                {title}{" "}
                <span className="bg-gradient-to-r from-brand to-brand-deep bg-clip-text text-transparent">
                    {accent}
                </span>
            </motion.h2>
        </div>

        <motion.p
            variants={fadeUp}
            className={
                centered
                    ? "mx-auto mt-4 max-w-2xl text-lg text-white/55"
                    : "mt-5 max-w-xl text-lg leading-relaxed text-white/55 lg:col-span-5 lg:mt-0 lg:pb-2"
            }
        >
            {lead}
        </motion.p>
    </Reveal>
)

export default SectionHeader
