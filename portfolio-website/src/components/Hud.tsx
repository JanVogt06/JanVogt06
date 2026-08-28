import type {ReactNode} from "react"

/** Quiet label above a group. Sentence case, not a readout. */
export const HudLabel = ({
    children,
    className = "",
    tone = "text-white/50",
}: {
    children: ReactNode
    className?: string
    tone?: string
}) => (
    <p className={`text-xs font-medium ${tone} ${className}`}>
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
    /** Identifier such as 02. Mono, because it is data. */
    id: string
    title: string
    accent: string
    lead?: string
    className?: string
}) => (
    <div className={className}>
        <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-brand">{id}</span>
            <span aria-hidden="true" className="h-px w-10 bg-gradient-to-r from-brand/45 to-transparent"/>
        </div>

        <h2 className="mt-5 text-[2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-[2.75rem] lg:text-6xl short:mt-3 short:text-[1.75rem] squat:mt-2 squat:text-2xl">
            {title} <span className="text-brand">{accent}</span>
        </h2>

        {lead && <p className="mt-5 max-w-2xl leading-relaxed text-white/55 short:mt-3">{lead}</p>}
    </div>
)
