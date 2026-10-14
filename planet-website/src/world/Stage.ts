import * as THREE from 'three'

export class Stage {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600)

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.AgXToneMapping

    this.scene.background = new THREE.Color('#0b0d14')
    this.scene.add(this.stars())

    this.resize()
    window.addEventListener('resize', () => this.resize())
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

  private stars() {
    const count = 1500
    const positions = new Float32Array(count * 3)
    const direction = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      direction.randomDirection().multiplyScalar(400 + Math.random() * 150)
      direction.toArray(positions, i * 3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({ color: '#9aa3c0', size: 1.2, sizeAttenuation: false })
    return new THREE.Points(geometry, material)
  }
}
