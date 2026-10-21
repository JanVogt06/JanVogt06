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

const BLEND = 1.4

// Runs whichever rig is in charge, and eases the camera over from where it
// was when another one takes over, so changing views is a glide, not a cut.
export class Director implements Rig {
  readonly target = new THREE.Vector3()
  readonly heading = new THREE.Vector3(1, 0, 0)
  readonly up = new THREE.Vector3(0, 1, 0)
  private rig: Rig | null = null
  private blend = 1
  private from = new THREE.Vector3()
  private fromTurn = new THREE.Quaternion()
  private fromFov = 42

  constructor(private camera: THREE.PerspectiveCamera) {}

  use(rig: Rig) {
    if (rig === this.rig) return
    const first = !this.rig
    this.rig = rig
    // Taken before the new rig moves anything.
    this.from.copy(this.camera.position)
    this.fromTurn.copy(this.camera.quaternion)
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
    if (this.blend >= 1) return
    this.blend = Math.min(1, this.blend + delta / BLEND)
    const ease = THREE.MathUtils.smootherstep(this.blend, 0, 1)
    this.camera.position.lerpVectors(this.from, this.camera.position, ease)
    this.camera.quaternion.slerpQuaternions(this.fromTurn, this.camera.quaternion, ease)
    this.camera.fov = THREE.MathUtils.lerp(this.fromFov, this.camera.fov, ease)
    this.camera.updateProjectionMatrix()
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
