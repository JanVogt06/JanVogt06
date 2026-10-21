import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Physics } from './Physics'
import type { Clearing } from './Props'
import { directionAt, facing } from './surface'
import type { Flat } from './Terrain'

// The sights of the research planet, mostly on the southern half where no
// station stands. Each is a node of landmarks.glb; `reach` is how far the
// ground round it is levelled. The front faces north unless turned.
const LANDMARKS = [
  { id: 'observatory', node: 'Observatory', place: { lat: -68, lon: 30 }, reach: 3.5 },
  { id: 'pendulum', node: 'Pendulum', place: { lat: -36, lon: 112 }, reach: 4 },
  { id: 'rocket', node: 'Rocket', place: { lat: -38, lon: 256 }, reach: 3 },
  { id: 'weather', node: 'Weather', place: { lat: -34, lon: 0 }, reach: 2.5 },
  { id: 'formula-0', node: 'Formula_0', place: { lat: 80, lon: 180 }, reach: 1.2 },
  { id: 'formula-1', node: 'Formula_1', place: { lat: -22, lon: 40 }, reach: 1.2 },
  { id: 'formula-2', node: 'Formula_2', place: { lat: -55, lon: 165 }, reach: 1.2 },
  { id: 'formula-3', node: 'Formula_3', place: { lat: -24, lon: 186 }, reach: 1.2 },
  { id: 'formula-4', node: 'Formula_4', place: { lat: -56, lon: 318 }, reach: 1.2 },
  { id: 'formula-5', node: 'Formula_5', place: { lat: -82, lon: 210 }, reach: 1.2 },
]

// Parts that move, and so get no collider of their own.
const MOVING = new Set(['Pendulum_Arm'])
const NORTH = new THREE.Vector3(0, 1, 0)
// A pendulum this long swings with a period of about five seconds; its
// plane of swing turns slowly round, as Foucault's did in Paris.
const PENDULUM = { swing: 0.22, rate: Math.sqrt(9.81 / 6.6), precession: 0.05 }

const vertex = new THREE.Vector3()
const axis = new THREE.Vector3()

export class Landmarks {
  readonly flats: Flat[] = []
  readonly clearings: Clearing[] = []
  private points = new Map<string, THREE.Vector3>()
  private time = 0
  private dome: THREE.Object3D
  private arm: THREE.Object3D
  private cups: THREE.Object3D
  private vane: THREE.Object3D

  constructor(scene: THREE.Scene, physics: Physics, radius: number, model: THREE.Object3D) {
    // Found before the sights leave the model for their places.
    const find = (name: string) => {
      const node = model.getObjectByName(name)
      if (!node) throw new Error(`The landmarks model has no ${name}`)
      return node
    }
    this.dome = find('Observatory_Dome')
    this.arm = find('Pendulum_Arm')
    this.cups = find('Weather_Cups')
    this.vane = find('Weather_Vane')

    for (const landmark of LANDMARKS) {
      const up = directionAt(landmark.place.lat, landmark.place.lon)
      const node = find(landmark.node)
      // In Blender they stand in a row; here each stands at its own origin.
      node.position.set(0, 0, 0)

      const group = new THREE.Group()
      group.position.copy(up).multiplyScalar(radius)
      group.quaternion.copy(facing(up, NORTH))
      group.add(node)
      scene.add(group)
      node.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = child.receiveShadow = true
      })
      this.solidify(physics, group)

      this.points.set(landmark.id, up.clone())
      this.flats.push({ direction: up.clone(), reach: landmark.reach })
      this.clearings.push({ direction: up.clone(), distance: landmark.reach + 2 })
    }
  }

  // Where a landmark stands, as a unit direction, for laying paths to it.
  pointOf(id: string) {
    return this.points.get(id)
  }

  update(delta: number) {
    const t = (this.time += delta)
    // The dome pans slowly to and fro, as if following a star.
    this.dome.rotation.y = 0.7 * Math.sin(t * 0.06)
    const plane = t * PENDULUM.precession
    axis.set(Math.cos(plane), 0, Math.sin(plane))
    this.arm.quaternion.setFromAxisAngle(axis, PENDULUM.swing * Math.sin(t * PENDULUM.rate))
    this.cups.rotation.y += delta * (3 + Math.sin(t * 0.4))
    this.vane.rotation.y = 0.5 * Math.sin(t * 0.23) + 0.2 * Math.sin(t * 0.71)
  }

  // The sights are thin frames and towers the rover should be able to drive
  // between, so each part collides as its own triangles.
  private solidify(physics: Physics, group: THREE.Group) {
    group.updateMatrixWorld(true)
    const body = physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
    group.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      let moving = false
      for (let node: THREE.Object3D | null = child; node; node = node.parent) if (MOVING.has(node.name)) moving = true
      if (moving) return
      const position = child.geometry.attributes.position
      const vertices = new Float32Array(position.count * 3)
      for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i).applyMatrix4(child.matrixWorld).toArray(vertices, i * 3)
      }
      const index = child.geometry.index
      const indices = index ? new Uint32Array(index.array) : Uint32Array.from({ length: position.count }, (_, i) => i)
      physics.world.createCollider(RAPIER.ColliderDesc.trimesh(vertices, indices), body)
    })
  }
}
