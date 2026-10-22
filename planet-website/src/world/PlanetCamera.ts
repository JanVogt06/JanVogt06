import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { calm } from '../ui/motion'
import { lens, type Rig } from './Director'

const forward = new THREE.Vector3()

// The whole planet to turn about with a drag and to zoom with a pinch or
// the wheel, slowly turning by itself while left alone. The controls drive
// a stand-in camera, which the real one copies, so easing in from another
// view never disturbs the controls.
export class PlanetCamera implements Rig {
  readonly target = new THREE.Vector3()
  readonly heading = new THREE.Vector3()
  readonly up = new THREE.Vector3()
  private stand = new THREE.PerspectiveCamera()
  private controls: OrbitControls
  // A direction to start out over, instead of over the last view.
  private aim: THREE.Vector3 | null = null

  constructor(
    private camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement,
    private radius: number,
  ) {
    this.controls = new OrbitControls(this.stand, canvas)
    Object.assign(this.controls, {
      enabled: false,
      enableDamping: true,
      dampingFactor: 0.08,
      enablePan: false,
      minDistance: radius + 12,
      maxDistance: radius + 130,
      rotateSpeed: 0.5,
      zoomSpeed: 0.8,
      autoRotate: true,
      autoRotateSpeed: 0.35,
    })
  }

  set enabled(on: boolean) {
    this.controls.enabled = on
  }

  // The next time the planet view opens, it starts over `direction`.
  face(direction: THREE.Vector3) {
    this.aim = direction.clone()
  }

  // Starts above wherever the camera was, or the direction asked for,
  // pulled well back.
  enter() {
    this.stand.position.copy(this.aim ?? this.camera.position).normalize().multiplyScalar(this.radius * 3.2)
    this.aim = null
    this.stand.up.set(0, 1, 0)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  update(delta: number) {
    this.controls.autoRotate = !calm()
    this.controls.update(delta)
    this.camera.position.copy(this.stand.position)
    this.camera.quaternion.copy(this.stand.quaternion)
    this.camera.up.copy(this.stand.up)
    lens(this.camera, 42)

    // The light and weather gather on the ground right below the camera.
    this.up.copy(this.camera.position).normalize()
    this.target.copy(this.up).multiplyScalar(this.radius)
    forward.set(0, 1, 0).applyQuaternion(this.camera.quaternion)
    this.heading.copy(forward).addScaledVector(this.up, -forward.dot(this.up)).normalize()
  }
}
