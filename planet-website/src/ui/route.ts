import { lang } from '../content/lang'
import { type Mode, ui } from './store'

// Each view has its own address, in the page's language, so it can be
// linked to and the browser's back button leads back to the menu. A
// station's id after the view's name opens the tour or the planet at it.
const NAMES: Record<'de' | 'en', Record<Exclude<Mode, 'menu'>, string>> = {
  de: { drive: 'fahren', tour: 'rundflug', planet: 'planet', text: 'text' },
  en: { drive: 'drive', tour: 'tour', planet: 'planet', text: 'text' },
}

// Reads either language's names, so a shared link works on both pages.
function fromHash(): { mode: Mode; focus: string | null } {
  const [name, focus] = location.hash.slice(1).split('/')
  for (const names of Object.values(NAMES)) {
    const entry = Object.entries(names).find(([, value]) => value === name)
    if (entry) return { mode: entry[0] as Mode, focus: focus || null }
  }
  return { mode: 'menu', focus: null }
}

export function hashFor(mode: Mode, focus?: string) {
  if (mode === 'menu') return ''
  return `#${NAMES[lang][mode]}${focus ? `/${focus}` : ''}`
}

// Keeps the mode and the address in step, both ways.
export function route() {
  ui.set(fromHash())
  window.addEventListener('hashchange', () => ui.set({ ...fromHash(), open: null }))
}

export function go(mode: Mode) {
  const hash = hashFor(mode)
  if (hash === location.hash || (!hash && !location.hash)) return
  if (hash) location.hash = hash
  else history.pushState(null, '', location.pathname + location.search)
  ui.set({ mode, focus: null, open: null })
}

// Rewrites the address to point at a station within the current view,
// without leaving a step in the history for every station passed.
export function point(mode: Mode, focus: string | null) {
  const hash = hashFor(mode, focus ?? undefined)
  if (hash !== location.hash) history.replaceState(null, '', location.pathname + location.search + hash)
}
