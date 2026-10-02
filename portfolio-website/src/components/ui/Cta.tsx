import type {AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode} from "react"
import {ArrowUpRight} from "lucide-react"

/** `solid` is the one action a block leads with; `line` is everything else:
 *  a mono label on a hairline that fills in on hover. */
type Tone = "solid" | "line"

const SHELL = "group label inline-flex shrink-0 items-center whitespace-nowrap transition-colors duration-300"

const TONES: Record<Tone, string> = {
    solid: "h-11 gap-2.5 rounded-full bg-fg px-5 text-page hover:bg-white/80",
    line: "relative h-11 gap-2 text-fg",
}

const Body = ({tone, icon, children}: {tone: Tone; icon?: ReactNode; children: ReactNode}) =>
    tone === "solid" ? (
        <>
            {children}
            {icon}
        </>
    ) : (
        <>
            <span className="relative py-1">
                {children}
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-fg/30"/>
                <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-fg transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
                />
            </span>
            {icon}
        </>
    )

type Shared = {children: ReactNode; icon?: ReactNode; tone?: Tone}

export const Cta = ({children, icon, tone = "line", className = "", ...rest}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" className={`${SHELL} ${TONES[tone]} ${className}`} {...rest}>
        <Body tone={tone} icon={icon}>
            {children}
        </Body>
    </button>
)

export const CtaLink = ({
    children,
    icon,
    tone = "line",
    className = "",
    external = false,
    ...rest
}: Shared & {external?: boolean} & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
        className={`${SHELL} ${TONES[tone]} ${className}`}
        {...(external ? {target: "_blank", rel: "noopener noreferrer"} : {})}
        {...rest}
    >
        <Body
            tone={tone}
            icon={
                icon ??
                (external ? (
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
                ) : undefined)
            }
        >
            {children}
        </Body>
    </a>
)

export default Cta
