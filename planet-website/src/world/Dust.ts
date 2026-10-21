import * as THREE from 'three'
import type { Rover } from './Rover'
import { random } from './surface'

const PUFFS = 160
const LIFE = 0.9
// Puffs a second per wheel at top speed, and how many a landing throws up.
const RATE = 14
const LANDING = 18
// Where the rear wheels touch the ground, in the rover's frame.
const WHEELS = [new THREE.Vector3(-0.85, -0.75, -0.8), new THREE.Vector3(-0.85, -0.75, 0.8)]

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uViewport;
  varying float vAlpha;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = aSize * projectionMatrix[1][1] * uViewport / -view.z;
    vAlpha = aAlpha;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColour;
  varying float vAlpha;
  void main() {
    float soft = 1.0 - smoothstep(0.15, 0.5, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(uColour, soft * vAlpha);
    #include <colorspace_fragment>
  }
`

const SAND = new THREE.Color('#cdb487')
const point = new THREE.Vector3()
const up = new THREE.Vector3()
const push = new THREE.Vector3()

// Little clouds of sand kicked up behind the rear wheels when the rover
// gets going, and a ring of them when it lands from a jump.
export class Dust {
  private rng = random(17)
  private positions = new Float32Array(PUFFS * 3)
  private velocities = new Float32Array(PUFFS * 3)
  private ages = new Float32Array(PUFFS).fill(LIFE)
  private sizes = new Float32Array(PUFFS)
  private alphas = new Float32Array(PUFFS)
  private next = 0
  private owed = 0
  private wasGrounded = true
  private material: THREE.ShaderMaterial
  private geometry = new THREE.BufferGeometry()

  constructor(scene: THREE.Scene, private rover: Rover, private renderer: THREE.WebGLRenderer) {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1))
    this.material = new THREE.ShaderMaterial({
      uniforms: { uColour: { value: new THREE.Color('#efe2c4') }, uViewport: { value: 1 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    })
    const points = new THREE.Points(this.geometry, this.material)
    points.frustumCulled = false
    scene.add(points)
  }

  // `light` dims the sand towards night, from 0 to 1.
  update(delta: number, light: number) {
    const { rover } = this
    this.material.uniforms.uViewport.value = this.renderer.domElement.height / 2
    this.material.uniforms.uColour.value.copy(SAND).multiplyScalar(0.3 + 0.7 * light)
    up.copy(rover.object.position).normalize()

    const fast = Math.abs(rover.speed) / 10
    if (rover.grounded && fast > 0.35) {
      this.owed += delta * RATE * Math.min(fast, 1.7)
      while (this.owed >= 1) {
        this.owed -= 1
        for (const wheel of WHEELS) this.emit(point.copy(wheel).applyMatrix4(rover.object.matrixWorld), 0.6)
      }
    }
    if (rover.grounded && !this.wasGrounded) {
      for (let i = 0; i < LANDING; i++) {
        const wheel = WHEELS[i % 2]
        this.emit(point.copy(wheel).setX(this.rng() * 1.8 - 0.9).applyMatrix4(rover.object.matrixWorld), 1.6)
      }
    }
    this.wasGrounded = rover.grounded

    for (let i = 0; i < PUFFS; i++) {
      const age = (this.ages[i] += delta)
      const t = Math.min(age / LIFE, 1)
      for (let k = 0; k < 3; k++) {
        this.velocities[i * 3 + k] *= 1 - 2.5 * delta
        this.positions[i * 3 + k] += this.velocities[i * 3 + k] * delta
      }
      this.sizes[i] = 0.45 + 1.5 * t
      this.alphas[i] = t < 1 ? 0.75 * (1 - t) * (1 - t) : 0
    }
    for (const name of ['position', 'aSize', 'aAlpha']) this.geometry.attributes[name].needsUpdate = true
  }

  private emit(at: THREE.Vector3, spread: number) {
    const i = this.next
    this.next = (this.next + 1) % PUFFS
    this.ages[i] = 0
    at.toArray(this.positions, i * 3)
    // A random push along the ground, and a lift off it.
    push.set(this.rng() - 0.5, this.rng() - 0.5, this.rng() - 0.5).multiplyScalar(spread * 2)
    push.addScaledVector(up, -push.dot(up)).addScaledVector(up, 0.8 + this.rng() * 0.8)
    push.toArray(this.velocities, i * 3)
  }
}
