import {useCallback, useSyncExternalStore} from "react"

/**
 * Wertet eine Media Query aus und rendert bei Aenderung neu.
 *
 * useSyncExternalStore statt useState + useEffect: matchMedia IST ein externer
 * Zustand, und React liest ihn hier bei jedem Render frisch. Damit gibt es
 * keinen ersten Frame mit dem falschen Wert – bei der Projekt-Sektion waere das
 * ein sichtbarer Sprung zwischen gestapelt und gepinnt.
 */
export const useMediaQuery = (query: string) => {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia(query)
            list.addEventListener("change", onChange)
            return () => list.removeEventListener("change", onChange)
        },
        [query],
    )

    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

export default useMediaQuery
