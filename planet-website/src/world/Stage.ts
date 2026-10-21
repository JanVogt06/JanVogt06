import * as THREE from 'three'
import type { Light } from './DayCycle'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export class Stage {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600)
  // Hidden by day, behind the blue of the sky.
  private stars: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.NeutralToneMapping

    // A soft room of light round everything, so the toy materials pick up
    // gentle highlights and the brass gleams.
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.35
    pmrem.dispose()

    this.scene.background = new THREE.Color('#0b0d14')
    this.stars = this.starfield()
    this.scene.add(this.stars)

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  // The reflected room dims and the stars come out as night falls.
  paint(light: Light) {
    this.scene.environmentIntensity = light.environment
    this.stars.material.opacity = light.stars
    this.stars.visible = light.stars > 0.01
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  private resize() {
    const { innerWidth: width, innerHeight: height } = window
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private starfield() {
    const count = 1500
    const positions = new Float32Array(count * 3)
    const direction = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      direction.randomDirection().multiplyScalar(400 + Math.random() * 150)
      direction.toArray(positions, i * 3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: '#dfe6ff',
      size: 1.8,
      sizeAttenuation: false,
      fog: false,
      transparent: true,
      opacity: 0,
    })
    return new THREE.Points(geometry, material)
  }
}
