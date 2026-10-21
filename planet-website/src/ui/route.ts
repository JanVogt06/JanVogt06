import { type Mode, ui } from './store'

// Each view has its own address, so it can be linked to and the browser's
// back button leads back to the menu.
const HASHES: Record<Mode, string> = {
  menu: '',
  drive: '#fahren',
  tour: '#rundflug',
  planet: '#planet',
  text: '#text',
}

function fromHash(): Mode {
  const entry = Object.entries(HASHES).find(([, hash]) => hash && hash === location.hash)
  return (entry?.[0] as Mode | undefined) ?? 'menu'
}

// Keeps the mode and the address in step, both ways.
export function route() {
  ui.set({ mode: fromHash() })
  window.addEventListener('hashchange', () => ui.set({ mode: fromHash(), open: null }))
}

export function go(mode: Mode) {
  const hash = HASHES[mode]
  if (hash === location.hash || (!hash && !location.hash)) return
  if (hash) location.hash = hash
  else history.pushState(null, '', location.pathname + location.search)
  ui.set({ mode, open: null })
}
