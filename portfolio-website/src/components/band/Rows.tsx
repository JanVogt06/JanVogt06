import type {ReactNode} from "react"

export const Rows = ({children}: {children: ReactNode}) => (
    <div className="mt-5 flex flex-col gap-2.5 short:mt-4 short:gap-2 squat:gap-1.5">
        {children}
    </div>
)

/** Rows with no date collapse to a single column rather than keeping an empty
 *  gutter where the date would have been. */
export const Row = ({when, what, where}: {when?: string; what: string; where?: string}) => (
    <div
        className={
            when
                ? "grid grid-cols-[3.5rem_1fr] gap-x-4 lg:grid-cols-[5rem_1fr]"
                : "grid grid-cols-1"
        }
    >
        {when && <span className="text-data tabular-nums text-fg-3">{when}</span>}
        <span className="min-w-0">
            <span className="block text-body text-fg">{what}</span>
            {where && <span className="mt-0.5 block text-sub text-fg-2">{where}</span>}
        </span>
    </div>
)

export default Rows
