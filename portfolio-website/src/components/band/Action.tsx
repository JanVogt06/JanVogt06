import type {AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode} from "react"
import Scramble from "../type/Scramble"

/** `primary` and `secondary` are bracketed instrument labels that differ
 *  only in how bright the label sits; `quiet` is an underlined text link. */
export type Tone = "primary" | "secondary" | "quiet"

const SHELL =
    "group inline-flex shrink-0 items-center whitespace-nowrap font-mono text-label uppercase " +
    "tracking-[0.08em] transition-colors duration-200"

const TONES: Record<Tone, string> = {
    primary: "h-11 text-fg hover:text-signal focus-visible:text-signal",
    secondary: "h-11 text-fg-2 hover:text-signal focus-visible:text-signal",
    quiet: "-my-3 gap-2.5 py-3 text-fg-3 hover:text-fg focus-visible:text-fg",
}

const Bracket = ({side}: {side: "open" | "close"}) => (
    <span
        aria-hidden="true"
        className={`text-fg-3 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            side === "open"
                ? "group-hover:-translate-x-[3px] group-focus-visible:-translate-x-[3px]"
                : "group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px]"
        }`}
    >
        {side === "open" ? "[" : "]"}
    </span>
)

const Label = ({tone, icon, children}: {tone: Tone; icon?: ReactNode; children: string}) =>
    tone === "quiet" ? (
        <>
            <span className="underline decoration-white/20 underline-offset-[5px] transition-colors duration-200 group-hover:decoration-signal/70">
                {children}
            </span>
            {icon}
        </>
    ) : (
        <>
            <Bracket side="open"/>
            <span className="inline-flex items-center gap-2 px-2.5">
                <Scramble text={children} hover/>
                {icon}
            </span>
            <Bracket side="close"/>
        </>
    )

type Shared = {children: string; icon?: ReactNode; tone?: Tone}

/** Every tone keeps a 44px hit box: the bracketed ones by their height, the quiet
 *  link by padding that the margin cancels. */
export const Action = ({
    children,
    icon,
    tone = "quiet",
    className = "",
    ...rest
}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" className={`${SHELL} ${TONES[tone]} ${className}`} {...rest}>
        <Label tone={tone} icon={icon}>
            {children}
        </Label>
    </button>
)

export const ActionLink = ({
    children,
    icon,
    tone = "quiet",
    className = "",
    ...rest
}: Shared & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className={`${SHELL} ${TONES[tone]} ${className}`} {...rest}>
        <Label tone={tone} icon={icon}>
            {children}
        </Label>
    </a>
)

export default Action
