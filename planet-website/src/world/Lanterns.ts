import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Physics } from './Physics'
import type { Clearing } from './Props'
import { uprightAt } from './surface'
import type { Flat, Terrain } from './Terrain'

// One lantern every so far along a path, set back from its middle on
// alternate sides, and none too close to where the paths begin and end.
const SPACING = 11
const SET_BACK = 1.95
const KEEP_OFF = 2.5
// The lamp's middle above the ground, as modelled.
const LAMP_HEIGHT = 1.7

const turn = new THREE.Quaternion()
const matrix = new THREE.Matrix4()
const position = new THREE.Vector3()
const one = new THREE.Vector3(1, 1, 1)

// A soft round spot, bright in the middle and gone at the edge.
function spot() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgb(255 255 255 / 1)')
  gradient.addColorStop(0.35, 'rgb(255 255 255 / 0.45)')
  gradient.addColorStop(1, 'rgb(255 255 255 / 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

// Park lanterns along the paths. By day they are just posts; after dark
// their glass glows, a halo hangs round each lamp and a pool of light lies
// on the path below.
export class Lanterns {
  readonly clearings: Clearing[] = []
  private light: THREE.MeshStandardMaterial
  private halo: THREE.PointsMaterial
  private pool: THREE.MeshBasicMaterial

  constructor(scene: THREE.Scene, physics: Physics, terrain: Terrain, model: THREE.Object3D, flats: Flat[]) {
    const root = model.getObjectByName('Lantern')
    if (!root) throw new Error('The landmarks model has no Lantern')
    root.position.set(0, 0, 0)
    root.updateMatrixWorld(true)

    const spots = this.place(terrain, flats)
    const placements = spots.map((up) => {
      position.copy(up).multiplyScalar(terrain.radius + terrain.heightAt(up) - 0.05)
      return new THREE.Matrix4().compose(position, uprightAt(up, 0, turn), one)
    })

    let light: THREE.MeshStandardMaterial | null = null
    root.traverse((part) => {
      if (!(part instanceof THREE.Mesh)) return
      if (part.name === 'Lantern_Light') light = part.material as THREE.MeshStandardMaterial
      const instances = new THREE.InstancedMesh(part.geometry, part.material, placements.length)
      placements.forEach((placement, i) => instances.setMatrixAt(i, matrix.multiplyMatrices(placement, part.matrixWorld)))
      instances.castShadow = instances.receiveShadow = true
      instances.computeBoundingSphere()
      scene.add(instances)
    })
    if (!light) throw new Error('The lantern has no Lantern_Light')
    this.light = light

    const texture = spot()
    const lamps = new THREE.BufferGeometry().setFromPoints(
      spots.map((up) => up.clone().multiplyScalar(terrain.radius + terrain.heightAt(up) + LAMP_HEIGHT)),
    )
    this.halo = new THREE.PointsMaterial({
      map: texture,
      color: '#ffd889',
      size: 2.6,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    scene.add(new THREE.Points(lamps, this.halo))

    this.pool = new THREE.MeshBasicMaterial({
      map: texture,
      color: '#ffcf7a',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.2, 4.2).rotateX(-Math.PI / 2), this.pool, spots.length)
    spots.forEach((up, i) => {
      position.copy(up).multiplyScalar(terrain.radius + terrain.heightAt(up) + 0.06)
      pools.setMatrixAt(i, matrix.compose(position, uprightAt(up, 0, turn), one))
    })
    pools.computeBoundingSphere()
    scene.add(pools)

    for (const up of spots) {
      position.copy(up).multiplyScalar(terrain.radius + terrain.heightAt(up))
      const body = physics.world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z).setRotation(uprightAt(up, 0, turn)),
      )
      physics.world.createCollider(RAPIER.ColliderDesc.cylinder(1, 0.12).setTranslation(0, 1, 0), body)
      this.clearings.push({ direction: up, distance: 1.4 })
    }
  }

  // How brightly they burn, from 0 by day to 1 at night.
  glow(level: number) {
    this.light.emissiveIntensity = 0.2 + 2.6 * level
    this.halo.opacity = 0.55 * level
    this.pool.opacity = 0.45 * level
  }

  // Walks along every path, dropping a lantern at each step that is clear
  // of the levelled places and of the other paths.
  private place(terrain: Terrain, flats: Flat[]) {
    const spots: THREE.Vector3[] = []
    let side = 1
    for (const path of terrain.paths) {
      const length = path.from.angleTo(path.to) * terrain.radius
      for (let along = SPACING / 2; along < length; along += SPACING) {
        const up = path.from
          .clone()
          .applyAxisAngle(path.normal, along / terrain.radius)
          .addScaledVector(path.normal, (side * SET_BACK) / terrain.radius)
          .normalize()
        side = -side
        const crowded =
          flats.some((flat) => flat.direction.angleTo(up) * terrain.radius < flat.reach + KEEP_OFF) ||
          spots.some((other) => other.angleTo(up) * terrain.radius < SPACING / 2) ||
          terrain.pathDistance(up) < SET_BACK - 0.2
        if (!crowded) spots.push(up)
      }
    }
    return spots
  }
}
