import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Physics } from './Physics'

export class Planet {
  readonly mesh: THREE.Mesh

  constructor(scene: THREE.Scene, physics: Physics, readonly radius: number) {
    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 32),
      new THREE.MeshStandardMaterial({ color: '#c9c4b8', roughness: 1 }),
    )
    this.mesh.receiveShadow = true
    scene.add(this.mesh)

    physics.world.createCollider(RAPIER.ColliderDesc.ball(radius).setFriction(1))
  }
}
