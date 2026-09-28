import type {ReactNode} from "react"
import Rise from "../type/Rise"

/** `dense` is for one-line entries: they read fine closer together, and pair
 *  up once there is width for two columns. Two-line entries only pair up on a
 *  frame too short to stack them. */
export const Rows = ({dense = false, children}: {dense?: boolean; children: ReactNode}) => (
    <div
        className={`mt-6 short:mt-4 squat:mt-2 ${
            dense
                ? "grid gap-y-2 short:gap-y-1.5 sm:grid-cols-2 sm:gap-x-8"
                : "flex flex-col gap-3 short:gap-2 squat:gap-1.5 sm:squat:grid sm:squat:grid-cols-2 sm:squat:gap-x-8"
        }`}
    >
        {children}
    </div>
)

/** Rows with no date collapse to a single column rather than keeping an empty
 *  gutter where the date would have been. */
export const Row = ({
    when,
    what,
    where,
    order = 0,
}: {
    when?: string
    what: string
    where?: string
    order?: number
}) => (
    <Rise mode="fade" delay={260 + order * 70} duration={700} as="div">
        <div
            className={
                when
                    ? "grid grid-cols-[5.75rem_1fr] gap-x-3 border-t border-hair pt-3 short:pt-2 squat:pt-1.5 lg:grid-cols-[6.5rem_1fr] [[data-dense]_&]:grid-cols-[4rem_1fr] [[data-dense]_&]:pt-2 lg:[[data-dense]_&]:grid-cols-[5.5rem_1fr]"
                    : "border-t border-hair pt-3 short:pt-2 squat:pt-1.5 [[data-dense]_&]:pt-2"
            }
        >
            {when && (
                <span className="whitespace-nowrap pt-[0.2em] font-mono text-data tabular-nums text-fg-3">
                    {when}
                </span>
            )}
            <span className="min-w-0">
                <span className="block text-body text-fg short:[[data-dense]_&]:text-sub">{what}</span>
                {where && <span className="mt-0.5 block text-sub text-fg-2">{where}</span>}
            </span>
        </div>
    </Rise>
)

export default Rows
