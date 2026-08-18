import type {LucideIcon} from "lucide-react"
import {ArrowUpRight, Play, X} from "lucide-react"

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
    /** Live URL, or undefined when the project has no deployment */
    url?: string
    /** false = the page is unreliable in an iframe, only offer to open it */
    embeddable?: boolean
    /** Screenshot; without it the frame shows icon and address */
    poster?: string
    icon: LucideIcon
    /** Size hint on the play button, e.g. "74 MB Unity build" */
    note?: string
    active: boolean
    onActivate: () => void
    onClose: () => void
}) => {
    const host = url ? new URL(url).host : "kein Deployment"

    return (
        <div className="surface flex h-full flex-col overflow-hidden rounded-xl lg:rounded-2xl">

            {/* Window bar with address */}
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

            {/* Content */}
            <div className="relative min-h-0 flex-1 bg-[#04060b]">
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
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-5">
                                <div className="rounded-2xl bg-brand/10 p-5 ring-1 ring-brand/20">
                                    <Icon className="h-10 w-10 text-brand"/>
                                </div>
                                <span className="font-mono text-xs text-white/30">{host}</span>
                            </div>
                        )}

                        {}
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
