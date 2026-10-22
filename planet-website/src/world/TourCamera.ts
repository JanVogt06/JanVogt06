import * as THREE from 'three'
import { TOUR } from '../content/tour'
import { calm } from '../ui/motion'
import { tour, ui } from '../ui/store'
import { lens, type Rig, sideBySide } from './Director'
import type { Rover } from './Rover'
import type { Site } from './Stations'

interface Shot {
  position: THREE.Vector3
  look: THREE.Vector3
}

const a = { position: new THREE.Vector3(), look: new THREE.Vector3() }
const b = { position: new THREE.Vector3(), look: new THREE.Vector3() }
const from = new THREE.Vector3()
const to = new THREE.Vector3()
const turn = new THREE.Quaternion()
const forward = new THREE.Vector3()

// Flies the camera from stop to stop as the page scrolls: first the rover,
// then each station in turn with room beside it for its card, and at the
// end the whole planet from high above. Between stops it arcs up and over.
export class TourCamera implements Rig {
  readonly target = new THREE.Vector3()
  readonly heading = new THREE.Vector3()
  readonly up = new THREE.Vector3()
  private stations: Site[]
  // Scrolling is smoothed so a flick of the wheel still glides.
  private position = 0

  constructor(
    private camera: THREE.PerspectiveCamera,
    sites: Site[],
    private rover: Rover,
    private radius: number,
  ) {
    this.stations = TOUR.map((id) => sites.find((site) => site.station.id === id)!)
  }

  // Starts at the station the address names, if any, else where the tour
  // was left.
  enter() {
    const stop = TOUR.indexOf(ui.get().focus ?? '') + 1
    if (stop > 0) tour.position = stop
    this.position = tour.position
  }

  update(delta: number) {
    const { camera } = this
    this.position += (tour.position - this.position) * (calm() ? 1 : Math.min(1, delta * 5))
    const stops = this.stations.length + 2
    const position = THREE.MathUtils.clamp(this.position, 0, stops - 1)
    const index = Math.min(Math.floor(position), stops - 2)
    // Holds still round each stop and travels in between.
    const t = THREE.MathUtils.smootherstep(position - index, 0.2, 0.8)
    this.shot(index, a)
    this.shot(index + 1, b)

    from.copy(a.position)
    to.copy(b.position)
    const height = THREE.MathUtils.lerp(from.length(), to.length(), t)
    const apart = from.angleTo(to)
    turn.setFromUnitVectors(from.normalize(), to.normalize())
    const direction = from.applyQuaternion(new THREE.Quaternion().slerp(turn, t))
    // The longer the leg, the higher the arc.
    const hop = calm() ? 0 : Math.sin(Math.PI * t) * Math.min(apart * this.radius * 0.35, 22)
    camera.position.copy(direction).multiplyScalar(height + hop)
    this.up.copy(direction)
    camera.up.copy(this.up)
    const look = a.look.lerp(b.look, t)
    camera.lookAt(look)
    lens(camera, 42)

    this.target.copy(look).normalize().multiplyScalar(this.radius)
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
    this.heading.copy(forward).addScaledVector(this.up, -forward.dot(this.up)).normalize()
  }

  // Where the camera stands and looks for stop `i`.
  private shot(i: number, out: Shot) {
    const wide = sideBySide(this.camera)
    if (i === 0) {
      // The rover, close up from the front.
      const at = this.rover.object.position
      const up = from.copy(at).normalize()
      const ahead = to.copy(this.rover.forward).addScaledVector(up, -this.rover.forward.dot(up)).normalize()
      const side = new THREE.Vector3().crossVectors(ahead, up)
      out.position.copy(at).addScaledVector(up, 2.2).addScaledVector(ahead, 7).addScaledVector(side, 2.5)
      out.look.copy(at).addScaledVector(up, wide ? 0.8 : -0.6).addScaledVector(side, wide ? 2 : 0)
      return
    }
    if (i > this.stations.length) {
      // The whole planet, from above the last station.
      const last = this.stations[this.stations.length - 1]
      out.position.copy(last.direction).addScaledVector(new THREE.Vector3(0, 1, 0), 0.5).normalize().multiplyScalar(this.radius * 2.9)
      out.look.set(0, 0, 0)
      return
    }
    // A station from in front, off to the side its card leaves free: to
    // the left of a card on the right, and so on. On a tall screen the card
    // sits below, so the station sits higher.
    const site = this.stations[i - 1]
    const side = i % 2 === 1 ? 1 : -1
    const local = (x: number, y: number, z: number) =>
      new THREE.Vector3(x, this.radius + y, z).applyQuaternion(site.orientation)
    if (wide) {
      out.position.copy(local(side * 1.5, 5.5, 13))
      out.look.copy(local(side * 3.2, 1.6, 0))
    } else {
      out.position.copy(local(0, 7.5, 15))
      out.look.copy(local(0, -1.2, 0))
    }
  }
}
