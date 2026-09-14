import type {ReactNode} from "react"
import type {LucideIcon} from "lucide-react"
import {ArrowUpRight, Play, X} from "lucide-react"

const PreviewCue = ({
    label,
    note,
    children,
}: {
    label: string
    note?: string

    children: ReactNode
}) => (
    <>
        <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
                background:
                    "radial-gradient(closest-side at 50% 50%, rgba(5,7,10,0.88) 0%, rgba(5,7,10,0.62) 45%, transparent 78%)",
            }}
        />
        <span className="relative flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-hair bg-white/[0.04] transition-transform duration-200 group-hover:scale-105">
                {children}
            </span>
            <span className="text-label uppercase tracking-[0.14em] text-fg">{label}</span>
            {note && <span className="text-fine text-fg-2">{note}</span>}
        </span>
    </>
)

const BrowserFrame = ({
    url,
    embeddable = true,
    poster,
    icon: Icon,
    note,
    eager = false,
    active,
    onActivate,
    onClose,
}: {
    url?: string

    embeddable?: boolean

    poster?: string
    icon: LucideIcon

    note?: string

    eager?: boolean
    active: boolean
    onActivate: () => void
    onClose: () => void
}) => {
    const host = url ? new URL(url).host : "kein Deployment"

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-hair bg-[#0a0c11]">

            <div
                className="flex shrink-0 items-center gap-3 border-b border-hair px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-data text-fg-3">{host}</span>
                {active ? (
                    <button
                        onClick={onClose}
                        aria-label="Vorschau schließen"
                        className="shrink-0 rounded p-1 text-fg-3 transition-colors duration-200 hover:bg-white/[0.06] hover:text-fg"
                    >
                        <X className="h-3.5 w-3.5"/>
                    </button>
                ) : url ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="In neuem Tab öffnen"
                        className="shrink-0 rounded p-1 text-fg-3 transition-colors duration-200 hover:bg-white/[0.06] hover:text-fg"
                    >
                        <ArrowUpRight className="h-3.5 w-3.5"/>
                    </a>
                ) : null}
            </div>

            <div className="relative min-h-0 flex-1 bg-black/40">
                {active && url ? (
                    <iframe
                        src={url}
                        title={`Live-Vorschau ${host}`}
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        allow="cross-origin-isolated"
                    />
                ) : (
                    <>
                        {poster ? (
                            <img
                                src={poster}
                                alt=""
                                className="h-full w-full object-cover object-top"
                                loading={eager ? "eager" : "lazy"}
                                fetchPriority={eager ? "high" : "auto"}
                                decoding="async"
                            />
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-5">
                                <div className="rounded-xl border border-hair p-5">
                                    <Icon className="h-10 w-10 text-fg-3"/>
                                </div>
                                <span className="text-data text-fg-3">{host}</span>
                            </div>
                        )}

                        {url && embeddable && (
                            <button
                                onClick={onActivate}
                                className="group absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <PreviewCue label="Live-Vorschau starten" note={note}>
                                    <Play className="ml-0.5 h-5 w-5 fill-signal text-signal"/>
                                </PreviewCue>
                            </button>
                        )}

                        {url && !embeddable && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <PreviewCue label="In neuem Tab öffnen" note={note}>
                                    <ArrowUpRight className="h-5 w-5 text-signal"/>
                                </PreviewCue>
                            </a>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default BrowserFrame
