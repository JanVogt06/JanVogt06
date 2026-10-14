import * as THREE from 'three'
import type { Lights } from './Lights'
import type { Satellites } from './Satellites'

const Y = new THREE.Vector3(0, 1, 0)
const here = new THREE.Vector3()
const direction = new THREE.Vector3()
const up = new THREE.Vector3()
const highest = new THREE.Vector3()
const parentRotation = new THREE.Quaternion()
const aim = new THREE.Quaternion()

// The waves of the Riptide pool, as modelled in Blender, rolling on with
// time. `x` runs along the pool and `y` across it, in Blender's axes.
function wave(x: number, y: number, time: number) {
  const swell = 0.35 + (0.65 * (y + 1.8)) / 3.6
  return 0.4 + 0.22 * swell * Math.sin(x * 2.2 + y * 0.5 - time * 1.8) + 0.04 * Math.sin(x * 6.1 - y * 2.3 + time * 2.7)
}

function find(model: THREE.Object3D, name: string) {
  const node = model.getObjectByName(name)
  if (!node) throw new Error(`The model has no ${name}`)
  return node
}

function glow(node: THREE.Object3D) {
  const mesh = node as THREE.Mesh
  return mesh.material as THREE.MeshStandardMaterial
}

// Turns `node` smoothly so that its local +y points along `target`, a
// world-space direction.
function point(node: THREE.Object3D, target: THREE.Vector3, rate: number) {
  node.parent!.getWorldQuaternion(parentRotation)
  direction.copy(target).applyQuaternion(parentRotation.invert())
  aim.setFromUnitVectors(Y, direction.normalize())
  node.quaternion.slerp(aim, rate)
}

// Small motions that make the stations feel alive.
export class Ambience {
  private time = 0
  private dish: THREE.Object3D
  private tracker: THREE.Object3D
  private flag: THREE.Object3D
  private water: THREE.BufferGeometry
  private rest: Float32Array
  private boat: THREE.Object3D[]
  private lamp: THREE.MeshStandardMaterial
  private flames: THREE.MeshStandardMaterial
  private spell: THREE.MeshStandardMaterial

  constructor(
    models: Record<string, THREE.Object3D>,
    private satellites: Satellites,
    private lights: Lights,
  ) {
    this.dish = find(models.sattrak, 'SatTrak_Dish')
    this.tracker = find(models.solarflow, 'SolarFlow_Tracker')
    this.flag = find(models.about, 'About_Flag')
    this.water = (find(models.riptide, 'Riptide_Water') as THREE.Mesh).geometry
    this.rest = Float32Array.from(this.water.attributes.position.array)
    this.boat = [find(models.riptide, 'Riptide_Boat'), find(models.riptide, 'Riptide_Sail')]
    this.lamp = glow(find(models.riptide, 'Riptide_Lamp'))
    this.flames = glow(find(models.cryptborne, 'Cryptborne_FlameE'))
    this.spell = glow(find(models.cryptborne, 'Cryptborne_Door'))
  }

  update(delta: number) {
    const t = (this.time += delta)
    const rate = 1 - Math.exp(-2.5 * delta)

    this.trackSatellite(rate)
    // The light follows the rover, so seen from the far side of the planet
    // it would sit below the horizon; leaning towards the zenith keeps the
    // panel facing the sky wherever it is.
    this.tracker.getWorldPosition(here)
    point(this.tracker, up.copy(here).normalize().add(this.lights.sunDirection), rate)

    // The flag swings about its pole with a quicker flutter on top.
    this.flag.rotation.y = 0.3 * Math.sin(t * 1.6) + 0.08 * Math.sin(t * 5.3)

    this.roll(t)

    this.lamp.emissiveIntensity = 3 + 1.5 * Math.sin(t * 2.4)
    this.flames.emissiveIntensity = 3.5 + Math.sin(t * 13) * 0.6 + Math.sin(t * 7.3) * 0.5
    this.spell.emissiveIntensity = 2.2 + 0.6 * Math.sin(t * 1.3)
  }

  // Aims the ground station's dish at the satellite highest in its sky.
  private trackSatellite(rate: number) {
    this.dish.getWorldPosition(here)
    up.copy(here).normalize()
    let best = -Infinity
    for (const satellite of this.satellites.objects) {
      direction.subVectors(satellite.position, here).normalize()
      const height = direction.dot(up)
      if (height > best) {
        best = height
        highest.copy(direction)
      }
    }
    // With nothing above the horizon the dish rests pointing at the zenith.
    point(this.dish, best > 0.1 ? highest : up, rate * 0.6)
  }

  private roll(time: number) {
    const position = this.water.attributes.position
    for (let i = 0; i < position.count; i++) {
      const x = this.rest[i * 3]
      const y = -this.rest[i * 3 + 2]
      position.setY(i, wave(x, y, time))
    }
    position.needsUpdate = true
    this.water.computeVertexNormals()

    // The boat rides the swell where it floats.
    const lift = wave(-0.9, 0.3, time) - wave(-0.9, 0.3, 0)
    for (const part of this.boat) part.position.y = 0.08 + lift
  }
}
