import * as THREE from 'three'
import type { Light } from './DayCycle'
import type { Rig } from './Director'

const side = new THREE.Vector3()
const sun = new THREE.Vector3()

// Studio lighting that travels with the camera: the key light always comes
// from above and behind on the left, so the rover is lit the same way
// wherever it is on the planet.
export class Lights {
  private sky = new THREE.HemisphereLight('#dceaff', '#8a7650', 0.85)
  private key = new THREE.DirectionalLight('#ffe7c9', 2.4)
  // How high the light stands over the rover, from 0 at the horizon to 1.
  private height = 1

  constructor(scene: THREE.Scene, private view: Rig) {
    this.key.castShadow = true
    this.key.shadow.mapSize.set(2048, 2048)
    this.key.shadow.bias = -0.0005
    this.key.shadow.normalBias = 0.03
    this.key.shadow.radius = 3
    this.key.shadow.intensity = 0.8
    const frustum = this.key.shadow.camera
    frustum.left = frustum.bottom = -16
    frustum.right = frustum.top = 16
    frustum.near = 1
    frustum.far = 80

    scene.add(this.sky, this.key, this.key.target)
  }

  // Where the key light shines from, as seen from the rover.
  get sunDirection() {
    return sun.subVectors(this.key.position, this.key.target.position).normalize()
  }

  // The sun by day, sinking and reddening towards dusk; the moon by night.
  paint(light: Light) {
    this.key.color.copy(light.sun)
    this.key.intensity = light.sunStrength
    this.sky.color.copy(light.sky)
    this.sky.groundColor.copy(light.ground)
    this.sky.intensity = light.skyStrength
    this.height = light.sunHeight
  }

  update() {
    const { target, heading, up } = this.view
    side.crossVectors(heading, up)
    this.sky.position.copy(up)
    // The default world-up would make the shadow camera degenerate wherever
    // the light shines straight along it.
    this.key.shadow.camera.up.copy(heading)
    this.key.target.position.copy(target)
    this.key.position
      .copy(target)
      .addScaledVector(up, 8 + 22 * this.height)
      .addScaledVector(side, -18)
      .addScaledVector(heading, -12)
  }
}
