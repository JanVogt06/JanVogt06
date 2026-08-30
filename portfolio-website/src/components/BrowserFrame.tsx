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
                    "radial-gradient(closest-side at 50% 50%, rgba(7,8,11,0.85) 0%, rgba(7,8,11,0.6) 45%, transparent 78%)",
            }}
        />
        <span className="relative flex flex-col items-center gap-3">
            <span className="glass flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-105">
                {children}
            </span>
            <span className="text-sm text-white">{label}</span>
            {note && <span className="text-xs text-white/75">{note}</span>}
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
        <div className="surface rim flex h-full flex-col overflow-hidden rounded-xl lg:rounded-2xl">

            <div
                className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-3 py-2.5">
                <div className="flex shrink-0 gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/12"/>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/12"/>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/12"/>
                </div>
                <span
                    className="min-w-0 flex-1 truncate rounded-full bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-white/55">
                    {host}
                </span>
                {active ? (
                    <button
                        onClick={onClose}
                        aria-label="Vorschau schließen"
                        className="shrink-0 rounded p-1 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <X className="h-3.5 w-3.5"/>
                    </button>
                ) : url ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="In neuem Tab öffnen"
                        className="shrink-0 rounded p-1 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
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
                                <div className="rounded-3xl bg-brand/10 p-5">
                                    <Icon className="h-10 w-10 text-brand"/>
                                </div>
                                <span className="font-mono text-xs text-white/50">{host}</span>
                            </div>
                        )}

                        {url && embeddable && (
                            <button
                                onClick={onActivate}
                                className="group absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <PreviewCue label="Live-Vorschau starten" note={note}>
                                    <Play className="ml-0.5 h-5 w-5 fill-brand text-brand"/>
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
                                    <ArrowUpRight className="h-5 w-5 text-brand"/>
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
