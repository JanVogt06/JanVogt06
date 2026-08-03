import type {ReactNode} from "react"

/**
 * Die Bausteine des HUD-Looks – eine Stelle, damit alle Sektionen dieselbe
 * Sprache sprechen.
 *
 * Vorher hatte jede Sektion ihre eigene Kartenform: abgerundete Ecken,
 * Hairline-Rahmen, mal ein Gradient. Das las sich wie eine Sammlung von
 * Bausteinen aus verschiedenen Kaesten. Der Weltraum-Look braucht dagegen ein
 * knappes, technisches Vokabular:
 *
 *   Eckklammern statt umlaufender Rahmen. Sie deuten die Flaeche an, statt sie
 *   einzukasteln – dadurch bleibt der Blick auf dem Inhalt und der Nebel
 *   dahinter bleibt sichtbar.
 *
 *   Mono-Beschriftungen mit Doppelslash und weiter Laufweite. Das ist der Ton
 *   einer Instrumententafel, und es passt zum Git-Leitmotiv der Seite: beides
 *   ist die Schrift von Werkzeugen.
 *
 *   Rechte Winkel. Die Radien der Seite stehen in index.css global auf nahezu
 *   null, damit das nicht pro Komponente durchgehalten werden muss.
 */

/** Eine Eckklammer. */
const Corner = ({at, tone}: {at: "tl" | "tr" | "bl" | "br"; tone: string}) => {
    const sides = {
        tl: "left-0 top-0 border-l border-t",
        tr: "right-0 top-0 border-r border-t",
        bl: "left-0 bottom-0 border-l border-b",
        br: "right-0 bottom-0 border-r border-b",
    }[at]
    return <span aria-hidden="true" className={`pointer-events-none absolute h-5 w-5 ${tone} ${sides}`}/>
}

/** Alle vier Eckklammern einer Flaeche. */
export const HudCorners = ({tone = "border-brand/50"}: {tone?: string}) => (
    <>
        <Corner at="tl" tone={tone}/>
        <Corner at="tr" tone={tone}/>
        <Corner at="bl" tone={tone}/>
        <Corner at="br" tone={tone}/>
    </>
)

/**
 * Eine Flaeche im HUD-Stil: Panel-Ton, feine Hairline, Eckklammern.
 *
 * `as` erlaubt ein semantisch passendes Element (z.B. article), ohne dass die
 * Aufrufstelle die Klassen kennen muss.
 */
export const HudPanel = ({
    children,
    className = "",
    corners = true,
    tone,
}: {
    children: ReactNode
    className?: string
    /** Ohne Klammern, wenn die Flaeche in einer anderen liegt. */
    corners?: boolean
    tone?: string
}) => (
    <div className={`surface relative ${className}`}>
        {corners && <HudCorners tone={tone}/>}
        {children}
    </div>
)

/**
 * Mono-Beschriftung im Stil `// LABEL`.
 *
 * Der Doppelslash kommt aus dem Code und ist damit derselbe Griff wie das
 * `$ git`-Motiv: die Seite spricht die Sprache ihrer Werkzeuge.
 */
export const HudLabel = ({
    children,
    className = "",
    tone = "text-white/30",
}: {
    children: ReactNode
    className?: string
    tone?: string
}) => (
    <p
        className={`font-mono text-[10px] uppercase tracking-[0.28em] ${tone} ${className}`}
    >
        <span aria-hidden="true">// </span>
        {children}
    </p>
)

/**
 * Abschnittskopf im HUD-Stil.
 *
 * Ersetzt SectionHeader.tsx. Der alte Kopf hatte ein `$ befehl argument` und
 * darunter eine Ueberschrift mit Gradient-Wort; das bleibt im Kern, wird aber
 * knapper und bekommt eine Kennung wie ein Instrument: eine laufende Nummer und
 * eine feine Linie, die den Kopf mit dem Rest verbindet.
 */
export const HudSectionHeader = ({
    id,
    command,
    argument,
    title,
    accent,
    lead,
    className = "",
}: {
    /** Kennung wie 02 – gibt der Seite eine Ordnung, die man mitliest. */
    id: string
    command: string
    argument?: string
    title: string
    accent: string
    lead?: string
    className?: string
}) => (
    <div className={className}>
        <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand/70">
                {id}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-brand/40 to-transparent"/>
        </div>

        <p className="mt-5 font-mono text-sm text-white/40">
            <span className="text-status">$</span> {command}
            {argument && <span className="text-white/25"> {argument}</span>}
        </p>

        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            {title}{" "}
            <span className="bg-gradient-to-r from-brand to-brand-deep bg-clip-text text-transparent">
                {accent}
            </span>
        </h2>

        {lead && <p className="mt-4 max-w-2xl leading-relaxed text-white/50">{lead}</p>}
    </div>
)
