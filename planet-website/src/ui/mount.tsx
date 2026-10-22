import { createRoot } from 'react-dom/client'
import { Corner, DriveKeys, Loading } from './Chrome'
import { Minimap } from './Minimap'
import { PlanetView } from './PlanetView'
import { StartMenu } from './StartMenu'
import { StationPanel } from './StationPanel'
import { StationTag } from './StationTag'
import { TextPage } from './TextPage'
import { TouchControls } from './TouchControls'
import { Tour } from './Tour'
import { useUi } from './store'
import './ui.css'
import './views.css'

// Whatever the current view lays over the planet, or in place of it.
function App() {
  const { mode } = useUi()
  return (
    <>
      {mode === 'menu' && <StartMenu />}
      {mode === 'drive' && (
        <>
          <StationTag />
          <Minimap />
          <TouchControls />
          <DriveKeys />
        </>
      )}
      {mode === 'tour' && <Tour />}
      {mode === 'planet' && <PlanetView />}
      {mode === 'text' && <TextPage />}
      {mode !== 'menu' && mode !== 'text' && (
        <>
          <Corner />
          <Loading />
        </>
      )}
      <StationPanel />
    </>
  )
}

export function mountUi(element: HTMLElement) {
  createRoot(element).render(<App />)
}
