import type {ReactNode} from "react"

/** A single corner bracket. */
const Corner = ({at, tone}: {at: "tl" | "tr" | "bl" | "br"; tone: string}) => {
    const sides = {
        tl: "left-0 top-0 border-l border-t",
        tr: "right-0 top-0 border-r border-t",
        bl: "left-0 bottom-0 border-l border-b",
        br: "right-0 bottom-0 border-r border-b",
    }[at]
    return <span aria-hidden="true" className={`pointer-events-none absolute h-5 w-5 ${tone} ${sides}`}/>
}

/** All four corner brackets of a surface. */
export const HudCorners = ({tone = "border-brand/50"}: {tone?: string}) => (
    <>
        <Corner at="tl" tone={tone}/>
        <Corner at="tr" tone={tone}/>
        <Corner at="bl" tone={tone}/>
        <Corner at="br" tone={tone}/>
    </>
)

export const HudPanel = ({
    children,
    className = "",
    corners = true,
    tone,
}: {
    children: ReactNode
    className?: string
    /** No brackets when the surface sits inside another one. */
    corners?: boolean
    tone?: string
}) => (
    <div className={`surface relative ${className}`}>
        {corners && <HudCorners tone={tone}/>}
        {children}
    </div>
)

/** Mono label in small caps with wide tracking. */
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

export const HudSectionHeader = ({
    id,
    title,
    accent,
    lead,
    className = "",
}: {
    /** Identifier such as 02. */
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
