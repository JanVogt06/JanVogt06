import type {ReactNode} from "react"

/** A label row closed off by a hairline; the hairline's right end is where a
 *  tether from the scene lands. */
const Slate = ({children}: {children: ReactNode}) => (
    <div className="flex items-center gap-4">
        {children}
        <span aria-hidden="true" className="h-px flex-1 bg-hair"/>
    </div>
)

export default Slate
