import { useEffect, useRef } from 'react'
import { minimap, type MapPoint } from './store'

const SIZE = 180

function distance(point: MapPoint) {
  return Math.hypot(point.x, point.y)
}

// Light station colours get a dark tick, so it shows on every dot.
function tickColour(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.7 ? '#1f1d1a' : '#fff'
}

// The whole planet as a disc, centred on the rover and turned with the
// camera, so up on the map is straight ahead. Stations still to visit
// pulse; visited ones carry a tick.
export function Minimap() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let frame = 0
    let shown = ''
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw)
      const element = canvas.current
      const context = element?.getContext('2d')
      if (!element || !context) return

      const ratio = Math.min(window.devicePixelRatio, 2)
      if (element.width !== SIZE * ratio) element.width = element.height = SIZE * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, SIZE, SIZE)

      const centre = SIZE / 2
      const radius = centre - 4
      const at = (point: MapPoint) => [centre + point.x * radius, centre + point.y * radius] as const

      // The planet: light where the rover is, darkening towards the far side.
      const ground = context.createRadialGradient(centre, centre, 0, centre, centre, radius)
      ground.addColorStop(0, '#e4dfd3')
      ground.addColorStop(0.5, '#b9b3a6')
      ground.addColorStop(1, '#5d594f')
      context.fillStyle = ground
      context.beginPath()
      context.arc(centre, centre, radius, 0, Math.PI * 2)
      context.fill()

      // The horizon half way out, and two rings either side of it.
      context.lineWidth = 1
      const rings: [number, number, number[]][] = [[0.25, 0.18, []], [0.5, 0.35, [3, 3]], [0.75, 0.18, []]]
      for (const [reach, alpha, dash] of rings) {
        context.setLineDash(dash)
        context.strokeStyle = `rgb(31 29 26 / ${alpha})`
        context.beginPath()
        context.arc(centre, centre, radius * reach, 0, Math.PI * 2)
        context.stroke()
      }
      context.setLineDash([])

      const points = minimap.points
      const near = points.find((point) => point.id === minimap.nearest)
      // The station at hand is named in the world already, so the map names
      // the closest one still to visit as the next place to go.
      const labelled = points
        .filter((point) => !point.visited && point !== near)
        .sort((a, b) => distance(a) - distance(b))[0]

      for (const point of points) {
        const [x, y] = at(point)
        const highlight = point === labelled || point === near
        const pulse = point.visited ? 0 : 0.8 + 0.8 * Math.sin(time / 300 + point.x * 9)
        const size = point.visited ? 6.5 : (highlight ? 6 : 4.5) + pulse * 0.6
        context.beginPath()
        context.arc(x, y, size, 0, Math.PI * 2)
        context.fillStyle = point.colour
        context.fill()
        context.lineWidth = highlight ? 2.5 : 1.5
        context.strokeStyle = '#fff'
        context.stroke()
        if (point.visited) {
          context.beginPath()
          context.moveTo(x - 3, y + 0.2)
          context.lineTo(x - 0.8, y + 2.6)
          context.lineTo(x + 3.2, y - 2.4)
          context.lineWidth = 2
          context.lineCap = 'round'
          context.lineJoin = 'round'
          context.strokeStyle = tickColour(point.colour)
          context.stroke()
        }
      }

      if (labelled) {
        const [x, y] = at(labelled)
        context.font = '600 11px system-ui, sans-serif'
        const width = context.measureText(labelled.title).width + 12
        const left = Math.min(Math.max(x - width / 2, 2), SIZE - width - 2)
        // On the side of the dot away from the rover, so it never hides it.
        const top = y < centre ? y - 26 : y + 9
        context.fillStyle = 'rgb(11 13 20 / 0.8)'
        context.beginPath()
        context.roundRect(left, top, width, 17, 8)
        context.fill()
        context.fillStyle = '#fff'
        context.fillText(labelled.title, left + 6, top + 12.5)
      }

      // The rover, always at the centre and pointing up.
      context.save()
      context.translate(centre, centre)
      context.beginPath()
      context.moveTo(0, -8)
      context.lineTo(6, 6)
      context.lineTo(0, 3)
      context.lineTo(-6, 6)
      context.closePath()
      context.fillStyle = '#ef8a6b'
      context.fill()
      context.lineWidth = 1.5
      context.strokeStyle = '#fff'
      context.stroke()
      context.restore()

      const visited = points.filter((point) => point.visited).length
      const text = `${visited} / ${points.length} entdeckt`
      if (count.current && text !== shown) count.current.textContent = shown = text
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <aside className="minimap" aria-label="Karte des Planeten">
      <canvas ref={canvas} style={{ width: SIZE, height: SIZE }} />
      <span ref={count} className="minimap-count" />
    </aside>
  )
}
