import { createRoot } from 'react-dom/client'
import { StationPanel } from './StationPanel'
import { StationTag } from './StationTag'
import './ui.css'

export function mountUi(element: HTMLElement) {
  createRoot(element).render(
    <>
      <StationTag />
      <StationPanel />
    </>,
  )
}
