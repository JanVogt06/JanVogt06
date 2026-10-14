import { createRoot } from 'react-dom/client'
import { Minimap } from './Minimap'
import { StationPanel } from './StationPanel'
import { StationTag } from './StationTag'
import { TouchControls } from './TouchControls'
import './ui.css'

export function mountUi(element: HTMLElement) {
  createRoot(element).render(
    <>
      <StationTag />
      <Minimap />
      <TouchControls />
      <StationPanel />
    </>,
  )
}
