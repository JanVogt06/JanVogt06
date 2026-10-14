import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { Physics } from './Physics'
import { random, uprightAt } from './surface'

const CRATE = 0.8
const COLOURS = ['#e9c46a', '#e76f51', '#8ab17d', '#5b7bd5', '#f2efe6']
const RAMP = { length: 4.5, width: 2.6, height: 1.2, sunk: 0.15 }

interface Spot {
  direction: THREE.Vector3
  clearance: number
}

// Grey-box furniture for the test drive: ramps to jump from, rocks to steer
// round and crates to knock over.
export class Props {
  private rng = random(7)
  private taken: Spot[] = []
  private crateGeometry = new RoundedBoxGeometry(CRATE, CRATE, CRATE, 2, 0.08)
  private crateMaterials = COLOURS.map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }))
  private rockMaterial = new THREE.MeshStandardMaterial({ color: '#9c958a', roughness: 1, flatShading: true })
  private rampMaterial = new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.9, flatShading: true })

  constructor(
    private scene: THREE.Scene,
    private physics: Physics,
    private radius: number,
    keepClear: THREE.Vector3,
  ) {
    // Counts follow the surface area, so the props stay as dense whatever
    // the size of the planet.
    const per = (count: number) => Math.round((count * radius * radius) / 1000)
    this.taken.push({ direction: keepClear.clone().normalize(), clearance: 6.5 / radius })
    for (let i = 0; i < per(6); i++) this.ramp(this.spot(3.8))
    for (let i = 0; i < per(4); i++) this.stack(this.spot(2.6))
    for (let i = 0; i < per(14); i++) this.rock(this.spot(1.6))
    for (let i = 0; i < per(12); i++) this.crate(uprightAt(this.spot(1), this.yaw()), new THREE.Vector3())
  }

  // A random direction whose clearance, a distance along the surface,
  // overlaps nothing placed so far.
  private spot(distance: number) {
    const clearance = distance / this.radius
    const direction = new THREE.Vector3()
    for (let attempt = 0; attempt < 200; attempt++) {
      const z = this.rng() * 2 - 1
      const phi = this.rng() * Math.PI * 2
      const r = Math.sqrt(1 - z * z)
      direction.set(r * Math.cos(phi), z, r * Math.sin(phi))
      if (this.taken.every((spot) => spot.direction.angleTo(direction) > spot.clearance + clearance)) break
    }
    this.taken.push({ direction, clearance })
    return direction
  }

  private yaw() {
    return this.rng() * Math.PI * 2
  }

  // Where a point given in the upright frame `orientation` ends up, with its
  // height measured from the surface.
  private onSurface(orientation: THREE.Quaternion, local: THREE.Vector3) {
    return new THREE.Vector3(local.x, this.radius + local.y, local.z).applyQuaternion(orientation)
  }

  private crate(orientation: THREE.Quaternion, local: THREE.Vector3) {
    const position = this.onSurface(orientation, local.setY(local.y + CRATE / 2 + 0.01))
    const body = this.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z).setRotation(orientation),
    )
    this.physics.world.createCollider(
      RAPIER.ColliderDesc.cuboid(CRATE / 2, CRATE / 2, CRATE / 2).setDensity(2).setFriction(0.7),
      body,
    )
    const material = this.crateMaterials[Math.floor(this.rng() * this.crateMaterials.length)]
    this.add(new THREE.Mesh(this.crateGeometry, material), body)
  }

  private stack(direction: THREE.Vector3) {
    const orientation = uprightAt(direction, this.yaw())
    const step = CRATE + 0.02
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 3 - row; i++) {
        const x = (i - (2 - row) / 2) * step
        this.crate(orientation.clone(), new THREE.Vector3(x, row * step, 0))
      }
    }
  }

  private rock(direction: THREE.Vector3) {
    const size = 0.5 + this.rng() * 1.1
    const position = direction.clone().multiplyScalar(this.radius + size * 0.25)
    const body = this.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z),
    )
    this.physics.world.createCollider(RAPIER.ColliderDesc.ball(size * 0.85), body)
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), this.rockMaterial)
    mesh.rotation.set(this.yaw(), this.yaw(), this.yaw())
    const holder = new THREE.Group()
    holder.add(mesh)
    this.add(holder, body)
  }

  private ramp(direction: THREE.Vector3) {
    const { length, width, height, sunk } = RAMP
    const points = [
      [-length / 2, 0, -width / 2],
      [-length / 2, 0, width / 2],
      [length / 2, 0, -width / 2],
      [length / 2, 0, width / 2],
      [length / 2, height, -width / 2],
      [length / 2, height, width / 2],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z))

    const orientation = uprightAt(direction, this.yaw())
    const position = this.onSurface(orientation, new THREE.Vector3(0, -sunk, 0))
    const body = this.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z).setRotation(orientation),
    )
    const hull = new Float32Array(points.flatMap((p) => p.toArray()))
    this.physics.world.createCollider(RAPIER.ColliderDesc.convexHull(hull)!.setFriction(1), body)
    this.add(new THREE.Mesh(new ConvexGeometry(points), this.rampMaterial), body)
  }

  private add(object: THREE.Object3D, body: RAPIER.RigidBody) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = child.receiveShadow = true
    })
    this.scene.add(object)
    this.physics.sync(body, object)
  }
}
