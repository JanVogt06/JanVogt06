import * as THREE from 'three'
import { random } from './surface'
import type { Terrain } from './Terrain'

const COUNT = 1000

const vertexShader = /* glsl */ `
  attribute float aPhase;
  uniform float uTime;
  uniform float uViewport;
  varying float vBlink;
  void main() {
    // Each drifts round its own spot and blinks on its own beat.
    vec3 drift = vec3(sin(uTime * 0.7 + aPhase * 5.0), sin(uTime * 0.9 + aPhase * 3.0), cos(uTime * 0.6 + aPhase * 7.0)) * 0.6;
    vec4 view = modelViewMatrix * vec4(position + drift, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = 0.45 * projectionMatrix[1][1] * uViewport / -view.z;
    vBlink = pow(0.5 + 0.5 * sin(uTime * 2.2 + aPhase * 11.0), 3.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uNight;
  varying float vBlink;
  void main() {
    float glow = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vec3(0.85, 1.0, 0.45) * glow, glow * vBlink * uNight);
  }
`

// Fireflies over the meadow, out only at night.
export class Fireflies {
  private points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private time = 0

  constructor(scene: THREE.Scene, terrain: Terrain, private renderer: THREE.WebGLRenderer) {
    const rng = random(61)
    const positions: number[] = []
    const phases: number[] = []
    const up = new THREE.Vector3()
    while (phases.length < COUNT) {
      up.set(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize()
      // Over the grass, not the sand.
      if (terrain.pathDistance(up) < 2) continue
      up.multiplyScalar(terrain.radius + terrain.heightAt(up) + 0.5 + rng() * 1.5)
      positions.push(up.x, up.y, up.z)
      phases.push(rng())
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1))
    this.points = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, uViewport: { value: 1 } },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.points.visible = false
    scene.add(this.points)
  }

  // `night` from 0 by day to 1 in the dark.
  update(delta: number, night: number) {
    const { uniforms } = this.points.material
    uniforms.uTime.value = this.time += delta
    uniforms.uNight.value = THREE.MathUtils.smoothstep(night, 0.4, 0.9)
    uniforms.uViewport.value = this.renderer.domElement.height / 2
    this.points.visible = uniforms.uNight.value > 0.01
  }
}
