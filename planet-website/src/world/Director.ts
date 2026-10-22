import * as THREE from 'three'

// A way of placing the camera. Each frame it sets the camera, and says what
// it is looking at, which way is ahead there and which way is up, so the
// light and the weather can gather round the same spot.
export interface Rig {
  readonly target: THREE.Vector3
  readonly heading: THREE.Vector3
  readonly up: THREE.Vector3
  update(delta: number): void
  // Called as the rig takes over the camera.
  enter?(): void
}

const BLEND = 1.6
// The camera keeps at least this far above the ground while it glides.
const CLEARANCE = 1.5

const forward = new THREE.Vector3()
const to = new THREE.Vector3()
const toLook = new THREE.Vector3()
const fromOffset = new THREE.Vector3()
const toOffset = new THREE.Vector3()
const swing = new THREE.Quaternion()
const none = new THREE.Quaternion()

// Runs whichever rig is in charge, and glides the camera over from where it
// was when another one takes over. The glide swings round the point being
// looked at rather than cutting straight across, and keeps looking at it,
// so climbing into the rover from the menu walks round behind it.
export class Director implements Rig {
  readonly target = new THREE.Vector3()
  readonly heading = new THREE.Vector3(1, 0, 0)
  readonly up = new THREE.Vector3(0, 1, 0)
  // The point the camera is looking at, as shown.
  private look = new THREE.Vector3()
  private rig: Rig | null = null
  private blend = 1
  private from = new THREE.Vector3()
  private fromLook = new THREE.Vector3()
  private fromUp = new THREE.Vector3()
  private fromFov = 42

  constructor(
    private camera: THREE.PerspectiveCamera,
    private radius: number,
  ) {}

  use(rig: Rig) {
    if (rig === this.rig) return
    const first = !this.rig
    this.rig = rig
    // Taken before the new rig moves anything.
    this.from.copy(this.camera.position)
    this.fromLook.copy(this.look)
    this.fromUp.copy(this.camera.up)
    this.fromFov = this.camera.fov
    rig.enter?.()
    this.blend = first ? 1 : 0
  }

  update(delta: number) {
    const rig = this.rig
    if (!rig) return
    rig.update(delta)
    this.target.copy(rig.target)
    this.heading.copy(rig.heading)
    this.up.copy(rig.up)

    // What the rig wants: where the camera stands, and the point it looks
    // at, as far ahead as the rig's subject is.
    const { camera } = this
    to.copy(camera.position)
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
    toLook.copy(to).addScaledVector(forward, Math.max(to.distanceTo(rig.target), 2))
    if (this.blend >= 1) {
      this.look.copy(toLook)
      return
    }

    this.blend = Math.min(1, this.blend + delta / BLEND)
    const ease = THREE.MathUtils.smootherstep(this.blend, 0, 1)
    this.look.lerpVectors(this.fromLook, toLook, ease)
    // Swing the line of sight round from the old side to the new one, and
    // stretch it from the old length to the new.
    fromOffset.subVectors(this.from, this.fromLook)
    toOffset.subVectors(to, toLook)
    const length = THREE.MathUtils.lerp(fromOffset.length(), toOffset.length(), ease)
    fromOffset.normalize()
    toOffset.normalize()
    if (fromOffset.dot(toOffset) < -0.95) {
      // Straight round the back: turn about the up direction, never under
      // the ground.
      swing.setFromAxisAngle(this.up, Math.PI)
    } else swing.setFromUnitVectors(fromOffset, toOffset)
    fromOffset.applyQuaternion(none.identity().slerp(swing, ease))
    camera.position.copy(this.look).addScaledVector(fromOffset, length)
    const floor = this.radius + CLEARANCE
    if (camera.position.length() < floor) camera.position.setLength(floor)

    camera.up.lerpVectors(this.fromUp, camera.up, ease).normalize()
    camera.lookAt(this.look)
    camera.fov = THREE.MathUtils.lerp(this.fromFov, camera.fov, ease)
    camera.updateProjectionMatrix()
  }
}

// Whether the screen is wide enough for a card beside the subject; else the
// card goes below it. The same test as the media queries in views.css.
export function sideBySide(camera: THREE.PerspectiveCamera) {
  return camera.aspect > 1 && innerWidth > 760
}

// On a tall, narrow screen the same vertical angle would show little more
// than the middle, so the lens widens as the screen narrows.
export function lens(camera: THREE.PerspectiveCamera, fov: number) {
  camera.fov = fov * Math.pow(Math.min(1, camera.aspect), -0.55)
  camera.updateProjectionMatrix()
}
