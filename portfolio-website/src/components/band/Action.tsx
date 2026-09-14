import type {AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode} from "react"

const SHELL =
    "group -my-3 inline-flex items-center gap-2 py-3 text-label uppercase tracking-[0.10em] " +
    "text-fg-3 transition-colors duration-200 hover:text-fg focus-visible:text-fg sm:tracking-[0.14em]"

const UNDERLINE =
    "border-b border-white/20 pb-1 transition-colors duration-200 group-hover:border-signal/70"

type Shared = {children: ReactNode; icon?: ReactNode}

/** 11px type with a 44px hit box — the padding is negated by the margin so it
 *  costs no layout. */
export const Action = ({
    children,
    icon,
    ...rest
}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" className={SHELL} {...rest}>
        <span className={UNDERLINE}>{children}</span>
        {icon}
    </button>
)

export const ActionLink = ({
    children,
    icon,
    ...rest
}: Shared & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className={SHELL} {...rest}>
        <span className={UNDERLINE}>{children}</span>
        {icon}
    </a>
)

export default Action
