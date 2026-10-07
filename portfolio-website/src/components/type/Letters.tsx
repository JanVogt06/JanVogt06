import {usePresence} from "@/lib/presence"
import useMediaQuery from "@/lib/useMediaQuery"

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"

/**
 * A heading that rises out of its line a letter at a time when its block
 * arrives, and drops back the moment it leaves. Letters are grouped by word,
 * so a long title still wraps between words and never inside one.
 */
const Letters = ({
    text,
    delay = 0,
    stagger = 26,
    duration = 950,
}: {
    text: string
    delay?: number
    stagger?: number
    duration?: number
}) => {
    const shown = usePresence()
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
    const up = shown || reduced
    let index = 0

    return (
        <span aria-label={text} role="text" className="block">
            {text.split(" ").map((word, w, words) => (
                <span key={w} aria-hidden="true">
                    <span className="-my-[0.16em] inline-block overflow-hidden whitespace-nowrap py-[0.16em] align-bottom">
                        {Array.from(word).map((letter) => {
                            const order = index++
                            return (
                                <span
                                    key={order}
                                    className="inline-block will-change-transform"
                                    style={{
                                        transform: up ? "none" : "translate3d(0, 110%, 0)",
                                        transition:
                                            shown && !reduced
                                                ? `transform ${duration}ms ${EASE} ${delay + order * stagger}ms`
                                                : "none",
                                    }}
                                >
                                    {letter}
                                </span>
                            )
                        })}
                    </span>
                    {w < words.length - 1 && " "}
                </span>
            ))}
        </span>
    )
}

export default Letters
