import * as THREE from 'three'
import { random } from './surface'

const CLOUDS = 12

const axis = new THREE.Vector3()
const turn = new THREE.Quaternion()

// Puffy clouds drifting round the planet, each on its own slow circle, and
// a thin shell of air that glows towards the horizon.
export class Sky {
  private clouds: { object: THREE.Object3D; axis: THREE.Vector3; speed: number }[] = []

  constructor(scene: THREE.Scene, model: THREE.Object3D, radius: number) {
    const rng = random(5)
    const shapes = ['Cloud_0', 'Cloud_1'].map((name) => {
      const shape = model.getObjectByName(name)
      if (!shape) throw new Error(`The nature model has no ${name}`)
      shape.position.set(0, 0, 0)
      return shape
    })

    for (let i = 0; i < CLOUDS; i++) {
      const object = shapes[i % shapes.length].clone(true)
      const z = rng() * 2 - 1
      const phi = rng() * Math.PI * 2
      const direction = new THREE.Vector3(Math.sqrt(1 - z * z) * Math.cos(phi), z, Math.sqrt(1 - z * z) * Math.sin(phi))
      object.position.copy(direction).multiplyScalar(radius + 9 + rng() * 6)
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
      object.rotateY(rng() * Math.PI * 2)
      object.scale.setScalar(1.2 + rng() * 1.1)
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = true
      })
      scene.add(object)
      // Each drifts about an axis at right angles to where it is.
      axis.set(rng() - 0.5, rng() - 0.5, rng() - 0.5).cross(direction).normalize()
      this.clouds.push({ object, axis: axis.clone(), speed: 0.01 + rng() * 0.012 })
    }

    scene.add(this.atmosphere(radius))
  }

  update(delta: number) {
    for (const cloud of this.clouds) {
      turn.setFromAxisAngle(cloud.axis, cloud.speed * delta)
      cloud.object.position.applyQuaternion(turn)
      cloud.object.quaternion.premultiply(turn)
    }
  }

  // A shell well above the camera that glows just over the horizon and
  // fades into the black of space overhead, so the sky has a little air.
  private atmosphere(radius: number) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius + 60, 64, 32),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColour: { value: new THREE.Color('#a9d3ff') } },
        vertexShader: /* glsl */ `
          varying vec3 vView;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vView = normalize(world.xyz - cameraPosition);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColour;
          varying vec3 vView;
          void main() {
            // How far above the local horizon the ray looks.
            float elevation = dot(vView, normalize(cameraPosition));
            float glow = pow(1.0 - clamp(elevation * 2.4 + 0.12, 0.0, 1.0), 3.0);
            gl_FragColor = vec4(uColour * glow * 0.5, 1.0);
          }
        `,
      }),
    )
  }
}
