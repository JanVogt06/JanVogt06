import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Physics } from './Physics'
import type { Clearing } from './Props'
import { random, uprightAt } from './surface'
import type { Terrain } from './Terrain'

// How many of each plant or stone to scatter, how big they may be, how far
// they keep from paths and from each other, and what the rover bumps into.
interface Kind {
  name: string
  count: number
  scale: [number, number]
  fromPath: number
  spacing: number
  shadow: boolean
  // A trunk is an upright cylinder from the ground; a ball sits `lift`
  // above it. Sizes are before the random scale.
  solid?: { trunk: number; height: number } | { ball: number; lift: number }
}

const KINDS: Kind[] = [
  { name: 'Tree_Round', count: 20, scale: [0.9, 1.3], fromPath: 3, spacing: 3.2, shadow: true, solid: { trunk: 0.25, height: 1.6 } },
  { name: 'Tree_Apple', count: 10, scale: [0.9, 1.2], fromPath: 3, spacing: 3.2, shadow: true, solid: { trunk: 0.25, height: 1.6 } },
  { name: 'Tree_Blossom', count: 14, scale: [0.9, 1.2], fromPath: 3, spacing: 3, shadow: true, solid: { trunk: 0.22, height: 1.6 } },
  { name: 'Tree_Pine', count: 22, scale: [0.8, 1.35], fromPath: 3, spacing: 3, shadow: true, solid: { trunk: 0.22, height: 1.6 } },
  { name: 'Tree_Tall', count: 14, scale: [0.9, 1.3], fromPath: 3, spacing: 2.6, shadow: true, solid: { trunk: 0.2, height: 1.6 } },
  { name: 'Rock_0', count: 10, scale: [0.7, 1.6], fromPath: 2.5, spacing: 2.5, shadow: true, solid: { ball: 0.75, lift: 0.3 } },
  { name: 'Rock_1', count: 10, scale: [0.6, 1.4], fromPath: 2.5, spacing: 2.5, shadow: true, solid: { ball: 0.75, lift: 0.3 } },
  { name: 'Rock_2', count: 10, scale: [0.7, 1.5], fromPath: 2.5, spacing: 2.5, shadow: true, solid: { ball: 0.7, lift: 0.3 } },
  { name: 'Bush', count: 50, scale: [0.7, 1.4], fromPath: 2, spacing: 1.6, shadow: true, solid: { ball: 0.6, lift: 0.3 } },
  { name: 'Mushroom', count: 36, scale: [0.9, 1.5], fromPath: 1.8, spacing: 1, shadow: true, solid: { trunk: 0.3, height: 0.8 } },
  { name: 'Grass', count: 320, scale: [0.9, 1.8], fromPath: 1.7, spacing: 0, shadow: false },
  { name: 'Flowers', count: 140, scale: [0.9, 1.5], fromPath: 1.7, spacing: 0, shadow: false },
]

const matrix = new THREE.Matrix4()
const orientation = new THREE.Quaternion()
const position = new THREE.Vector3()
const size = new THREE.Vector3()
const offset = new THREE.Vector3()

// Trees, bushes, toadstools, boulders, tufts of grass and flowers scattered
// over the meadow, each kind drawn as instances of its parts. Only the grass
// and the flowers can be driven through.
export class Nature {
  private rng = random(23)
  private placed: { direction: THREE.Vector3; spacing: number }[] = []

  constructor(
    scene: THREE.Scene,
    private physics: Physics,
    private terrain: Terrain,
    model: THREE.Object3D,
    keepClear: Clearing[],
  ) {
    for (const { direction, distance } of keepClear) this.placed.push({ direction: direction.clone().normalize(), spacing: distance })

    for (const kind of KINDS) {
      const root = model.getObjectByName(kind.name)
      if (!root) throw new Error(`The nature model has no ${kind.name}`)
      root.position.set(0, 0, 0)
      root.updateMatrixWorld(true)
      const parts: THREE.Mesh[] = []
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) parts.push(child)
      })

      const placements = this.scatter(kind)
      for (const part of parts) {
        const instances = new THREE.InstancedMesh(part.geometry, part.material, placements.length)
        placements.forEach((placement, i) => instances.setMatrixAt(i, matrix.multiplyMatrices(placement, part.matrixWorld)))
        instances.castShadow = kind.shadow
        instances.receiveShadow = true
        instances.computeBoundingSphere()
        scene.add(instances)
      }
    }
  }

  private scatter(kind: Kind) {
    const placements: THREE.Matrix4[] = []
    for (let i = 0; i < kind.count; i++) {
      const direction = this.spot(kind)
      if (!direction) continue
      const scale = THREE.MathUtils.lerp(kind.scale[0], kind.scale[1], this.rng())
      uprightAt(direction, this.rng() * Math.PI * 2, orientation)
      position.copy(direction).multiplyScalar(this.terrain.radius + this.terrain.heightAt(direction) - 0.05)
      placements.push(new THREE.Matrix4().compose(position, orientation, size.setScalar(scale)))
      if (kind.solid) this.solidify(kind.solid, position, orientation, scale)
    }
    return placements
  }

  // A random free spot for this kind, or null if none turns up.
  private spot(kind: Kind) {
    const direction = new THREE.Vector3()
    for (let attempt = 0; attempt < 60; attempt++) {
      const z = this.rng() * 2 - 1
      const phi = this.rng() * Math.PI * 2
      const r = Math.sqrt(1 - z * z)
      direction.set(r * Math.cos(phi), z, r * Math.sin(phi))
      if (this.terrain.pathDistance(direction) < kind.fromPath) continue
      const crowded = this.placed.some(
        (other) => other.direction.angleTo(direction) * this.terrain.radius < Math.max(other.spacing, kind.spacing),
      )
      if (crowded) continue
      if (kind.spacing > 0) this.placed.push({ direction: direction.clone(), spacing: kind.spacing })
      return direction
    }
    return null
  }

  private solidify(solid: NonNullable<Kind['solid']>, at: THREE.Vector3, turn: THREE.Quaternion, scale: number) {
    const body = this.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(at.x, at.y, at.z).setRotation(turn),
    )
    if ('trunk' in solid) {
      const height = solid.height * scale
      offset.set(0, height / 2, 0)
      this.physics.world.createCollider(
        RAPIER.ColliderDesc.cylinder(height / 2, solid.trunk * scale).setTranslation(offset.x, offset.y, offset.z),
        body,
      )
    } else {
      this.physics.world.createCollider(RAPIER.ColliderDesc.ball(solid.ball * scale).setTranslation(0, solid.lift * scale, 0), body)
    }
  }
}
