import './style.css'
import { finish } from './loader'
import { mountUi } from './ui/mount'
import { route } from './ui/route'
import { ui } from './ui/store'

mountUi(document.querySelector<HTMLElement>('#ui')!)
route()
finish()

// The planet loads as soon as a view wants it, and not at all for anyone
// who only reads the text.
let started = false
function start() {
  if (started || ui.get().mode === 'text') return
  started = true
  ui.set({ world: 'loading', progress: 0 })
  import('./world')
    .then(({ createWorld }) => createWorld((progress) => ui.set({ progress })))
    .then(
      () => ui.set({ world: 'ready', progress: 1 }),
      (error) => {
        console.error(error)
        ui.set({ world: 'failed' })
      },
    )
}
ui.subscribe(start)
start()
