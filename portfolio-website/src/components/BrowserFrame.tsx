import type {LucideIcon} from "lucide-react"
import {ArrowUpRight, Play, X} from "lucide-react"

/**
 * Browser-Rahmen mit Live-Vorschau: zeigt einen Screenshot und lädt die echte
 * Seite erst auf Klick in einen iframe.
 *
 * Der Klick ist Pflicht, nicht Bequemlichkeit – Cryptborne ist ein 74-MB-Unity-
 * Build. Und es ist immer nur EIN iframe aktiv (gesteuert über `active`), weil
 * Browser nur eine Handvoll WebGL-Kontexte gleichzeitig erlauben. Vor der
 * Aktivierung existiert kein iframe, dadurch kann er auch nicht das
 * Seiten-Scrollen abfangen.
 */
const BrowserFrame = ({
    url,
    embeddable = true,
    poster,
    icon: Icon,
    note,
    active,
    onActivate,
    onClose,
}: {
    /** Live-URL, oder undefined wenn das Projekt kein Deployment hat */
    url?: string
    /** false = Seite läuft im iframe nicht zuverlässig, nur öffnen anbieten */
    embeddable?: boolean
    /** Screenshot; fehlt er, zeigt der Rahmen Icon und Adresse */
    poster?: string
    icon: LucideIcon
    /** Gewichtshinweis am Play-Button, z.B. "74 MB Unity-Build" */
    note?: string
    active: boolean
    onActivate: () => void
    onClose: () => void
}) => {
    const host = url ? new URL(url).host : "kein Deployment"

    return (
        <div className="surface flex h-full flex-col overflow-hidden rounded-xl lg:rounded-2xl">

            {/* Fensterleiste mit Adresse */}
            <div
                className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <div className="flex shrink-0 gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15"/>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15"/>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15"/>
                </div>
                <span
                    className="min-w-0 flex-1 truncate rounded-md bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-white/45">
                    {host}
                </span>
                {active ? (
                    <button
                        onClick={onClose}
                        aria-label="Vorschau schließen"
                        className="shrink-0 rounded p-1 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <X className="h-3.5 w-3.5"/>
                    </button>
                ) : url ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="In neuem Tab öffnen"
                        className="shrink-0 rounded p-1 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <ArrowUpRight className="h-3.5 w-3.5"/>
                    </a>
                ) : null}
            </div>

            {/* Inhalt */}
            <div className="relative min-h-0 flex-1 bg-[#04060b]">
                {active && url ? (
                    <iframe
                        src={url}
                        title={`Live-Vorschau ${host}`}
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        /* allow-same-origin: die eingebettete Anwendung behaelt
                           ihren eigenen Origin und kann damit Service Worker und
                           localStorage nutzen. Cross-Origin bleibt es trotzdem. */
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        /* Wirkt nur, wenn DIESE Seite cross-origin isoliert ist
                           (COOP + COEP). Ist sie es nicht, wird es ignoriert –
                           kostet also nichts. */
                        allow="cross-origin-isolated"
                    />
                ) : (
                    <>
                        {poster ? (
                            <img
                                src={poster}
                                alt=""
                                className="h-full w-full object-cover object-top"
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            /* Ohne Screenshot: Icon und Adresse, ohne Hinweis auf
                               das fehlende Bild – der Zustand soll gewollt
                               aussehen, nicht unfertig. */
                            <div className="flex h-full flex-col items-center justify-center gap-5">
                                <div className="rounded-2xl bg-brand/10 p-5 ring-1 ring-brand/20">
                                    <Icon className="h-10 w-10 text-brand"/>
                                </div>
                                <span className="font-mono text-xs text-white/30">{host}</span>
                            </div>
                        )}

                        {/* Einbettbar: Vorschau im Rahmen starten. Sonst: in
                            neuem Tab oeffnen. Gleicher Aufbau, damit die Folien
                            gleich aussehen. */}
                        {url && embeddable && (
                            <button
                                onClick={onActivate}
                                className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-page/40 backdrop-blur-[1px] transition-colors hover:bg-page/25"
                            >
                                <span
                                    className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 ring-1 ring-brand/40 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-brand/25">
                                    <Play className="ml-0.5 h-5 w-5 fill-brand text-brand"/>
                                </span>
                                <span className="font-mono text-xs text-white/70">Live-Vorschau starten</span>
                                {note && <span className="font-mono text-[11px] text-white/35">{note}</span>}
                            </button>
                        )}

                        {url && !embeddable && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-page/40 backdrop-blur-[1px] transition-colors hover:bg-page/25"
                            >
                                <span
                                    className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 ring-1 ring-brand/40 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-brand/25">
                                    <ArrowUpRight className="h-5 w-5 text-brand"/>
                                </span>
                                <span className="font-mono text-xs text-white/70">in neuem Tab öffnen</span>
                                {note && <span className="font-mono text-[11px] text-white/35">{note}</span>}
                            </a>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default BrowserFrame
