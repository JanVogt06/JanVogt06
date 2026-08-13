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
 *   Mono-Beschriftungen in Kapitaelchen mit weiter Laufweite. Das ist der Ton
 *   einer Instrumentenanzeige. Sie trugen einmal ein "// " davor, aus dem
 *   Git-Leitmotiv der Seite – das ist raus: es hat jede Beschriftung wie einen
 *   auskommentierten Codezeile aussehen lassen und mit dem Weltraum nichts zu
 *   tun.
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

/** Mono-Beschriftung in Kapitaelchen mit weiter Laufweite. */
export const HudLabel = ({
    children,
    className = "",
    tone = "text-white/30",
}: {
    children: ReactNode
    className?: string
    tone?: string
}) => (
    <p className={`font-mono text-[10px] uppercase tracking-[0.28em] ${tone} ${className}`}>
        {children}
    </p>
)

/**
 * Abschnittskopf: laufende Kennung, feine Linie, Ueberschrift.
 *
 * Hier stand vorher eine Kommandozeile darueber (`$ cat README.md`,
 * `$ git log --oneline projekte/`). Die ist raus – sie war der lauteste Teil des
 * Git-Leitmotivs und hat jeden Abschnitt wie ein Terminal eingeleitet, was neben
 * einem Kristallring im Weltraum keinen Sinn ergibt. Die Kennung mit der Linie
 * traegt die Ordnung allein.
 */
export const HudSectionHeader = ({
    id,
    title,
    accent,
    lead,
    className = "",
}: {
    /** Kennung wie 02 – gibt der Seite eine Ordnung, die man mitliest. */
    id: string
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

        <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            {title}{" "}
            <span className="bg-gradient-to-r from-brand to-brand-deep bg-clip-text text-transparent">
                {accent}
            </span>
        </h2>

        {lead && <p className="mt-4 max-w-2xl leading-relaxed text-white/50">{lead}</p>}
    </div>
)
