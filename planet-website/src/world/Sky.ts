import * as THREE from 'three'
import { random } from './surface'

const CLOUDS = 12

const axis = new THREE.Vector3()
const turn = new THREE.Quaternion()

// The colours of the sky by day: a soft blue overhead fading into a warm
// cream haze at the horizon, which the fog shares.
export const DAY = { zenith: '#78acdf', horizon: '#fbe6c6', sun: '#ffd7a0' }

// Puffy clouds drifting round the planet, each on its own slow circle,
// under a dome of sky.
export class Sky {
  private clouds: { object: THREE.Object3D; axis: THREE.Vector3; speed: number }[] = []
  private dome: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>

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

    this.dome = this.atmosphere(radius)
    scene.add(this.dome)
    scene.fog = new THREE.Fog(DAY.horizon, 25, 150)
  }

  // `sun` is the direction the sunlight comes from.
  update(delta: number, sun: THREE.Vector3) {
    this.dome.material.uniforms.uSun.value.copy(sun)
    for (const cloud of this.clouds) {
      turn.setFromAxisAngle(cloud.axis, cloud.speed * delta)
      cloud.object.position.applyQuaternion(turn)
      cloud.object.quaternion.premultiply(turn)
    }
  }

  // A shell well above the camera, drawn before anything else: blue
  // overhead, cream towards the local horizon, with a warm glow round the
  // sun.
  private atmosphere(radius: number) {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(radius + 60, 64, 32),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uZenith: { value: new THREE.Color(DAY.zenith) },
          uHorizon: { value: new THREE.Color(DAY.horizon) },
          uSunColour: { value: new THREE.Color(DAY.sun) },
          uSun: { value: new THREE.Vector3(0, 1, 0) },
          uRadius: { value: radius },
        },
        vertexShader: /* glsl */ `
          varying vec3 vView;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vView = normalize(world.xyz - cameraPosition);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uZenith;
          uniform vec3 uHorizon;
          uniform vec3 uSunColour;
          uniform vec3 uSun;
          uniform float uRadius;
          varying vec3 vView;
          void main() {
            // How far the ray looks above the edge of the planet, from 0 there
            // to 1 straight up. From high above, the edge dips well below
            // level.
            float elevation = dot(vView, normalize(cameraPosition));
            float edge = -sqrt(max(0.0, 1.0 - pow(uRadius / length(cameraPosition), 2.0)));
            float above = (elevation - edge) / (1.0 - edge);
            vec3 colour = mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.24, above), 0.75));
            float sun = max(dot(vView, uSun), 0.0);
            colour += uSunColour * (0.35 * pow(sun, 6.0) + 0.8 * pow(sun, 400.0));
            gl_FragColor = vec4(colour, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    )
    dome.renderOrder = -1
    return dome
  }
}
