import * as THREE from 'three'
import { calm } from '../ui/motion'
import { lens, type Rig, sideBySide } from './Director'
import type { Rover } from './Rover'

// The menu card's width and its margin, as in views.css.
const CARD = 440
const FOV = 40

const forward = new THREE.Vector3()
const side = new THREE.Vector3()
const around = new THREE.Vector3()
const look = new THREE.Vector3()

// A close, low view of the rover from the front for the start menu, swaying
// slowly from side to side. The camera turns just enough that the rover
// stands in the middle of the space the menu leaves: beside the card on a
// wide screen, above it on a tall one.
export class MenuCamera implements Rig {
  readonly target = new THREE.Vector3()
  readonly heading = new THREE.Vector3()
  readonly up = new THREE.Vector3()
  private time = 0

  constructor(
    private camera: THREE.PerspectiveCamera,
    private rover: Rover,
  ) {}

  update(delta: number) {
    const { camera } = this
    const at = this.rover.object.position
    this.time += delta
    this.up.copy(at).normalize()
    forward.copy(this.rover.forward).addScaledVector(this.up, -this.rover.forward.dot(this.up)).normalize()
    side.crossVectors(forward, this.up)
    const angle = 0.45 + (calm() ? 0 : 0.4 * Math.sin(this.time * 0.15))
    around.copy(forward).multiplyScalar(Math.cos(angle)).addScaledVector(side, Math.sin(angle))

    const width = innerWidth
    const margin = THREE.MathUtils.clamp(width * 0.05, 16, 72)
    const beside = sideBySide(camera)
    camera.position.copy(at).addScaledVector(this.up, beside ? 1.6 : 2.4).addScaledVector(around, beside ? 7 : 10)
    camera.up.copy(this.up)
    camera.lookAt(look.copy(at).addScaledVector(this.up, 0.7))
    lens(camera, FOV)

    // Where on screen the rover should be, from -1 to 1 across and up.
    const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    if (beside) {
      const x = ((margin + CARD + width) / 2 / width) * 2 - 1
      camera.rotateY(Math.atan(x * tanY * camera.aspect))
    } else {
      camera.rotateX(-Math.atan(0.56 * tanY))
    }

    this.target.copy(at)
    this.heading.copy(around).negate()
  }
}
