import * as THREE from 'three'

// How a kind of puff looks and moves: how many can be about at once, how
// long each lasts, how big it starts and ends, how thick it is at first,
// and how quickly the air slows it.
export interface PuffStyle {
  count: number
  life: number
  size: [number, number]
  opacity: number
  drag: number
  colour: string
}

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

// A pool of soft round puffs, of dust or smoke, that swell and fade as
// they drift. The oldest is reused when a new one is wanted.
export class Puffs {
  private positions: Float32Array
  private velocities: Float32Array
  private ages: Float32Array
  private sizes: Float32Array
  private alphas: Float32Array
  private next = 0
  private colour: THREE.Color
  private material: THREE.ShaderMaterial
  private geometry = new THREE.BufferGeometry()

  constructor(
    scene: THREE.Scene,
    private renderer: THREE.WebGLRenderer,
    private style: PuffStyle,
  ) {
    const { count, life } = style
    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)
    this.ages = new Float32Array(count).fill(life)
    this.sizes = new Float32Array(count)
    this.alphas = new Float32Array(count)
    this.colour = new THREE.Color(style.colour)
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1))
    this.material = new THREE.ShaderMaterial({
      uniforms: { uColour: { value: this.colour.clone() }, uViewport: { value: 1 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    })
    const points = new THREE.Points(this.geometry, this.material)
    points.frustumCulled = false
    scene.add(points)
  }

  emit(at: THREE.Vector3, velocity: THREE.Vector3) {
    const i = this.next
    this.next = (this.next + 1) % this.style.count
    this.ages[i] = 0
    at.toArray(this.positions, i * 3)
    velocity.toArray(this.velocities, i * 3)
  }

  // `light` dims the puffs towards night, from 0 to 1.
  update(delta: number, light = 1) {
    const { count, life, size, opacity, drag } = this.style
    this.material.uniforms.uViewport.value = this.renderer.domElement.height / 2
    this.material.uniforms.uColour.value.copy(this.colour).multiplyScalar(0.3 + 0.7 * light)
    for (let i = 0; i < count; i++) {
      const t = Math.min((this.ages[i] += delta) / life, 1)
      for (let k = 0; k < 3; k++) {
        this.velocities[i * 3 + k] *= 1 - drag * delta
        this.positions[i * 3 + k] += this.velocities[i * 3 + k] * delta
      }
      this.sizes[i] = THREE.MathUtils.lerp(size[0], size[1], t)
      this.alphas[i] = t < 1 ? opacity * (1 - t) * (1 - t) : 0
    }
    for (const name of ['position', 'aSize', 'aAlpha']) this.geometry.attributes[name].needsUpdate = true
  }
}
