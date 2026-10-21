import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Physics } from './Physics'
import type { Terrain } from './Terrain'

const MAX_PATHS = 24
const MAX_PADS = 32

const linear = (hex: string) => new THREE.Color(hex)

// Paints the meadow in the fragment shader: grass in two shades, a scatter
// of flowers, sandy paths with darker verges and a sandy pad under every
// station.
const meadow = /* glsl */ `
  uniform vec3 uPathFrom[${MAX_PATHS}];
  uniform vec3 uPathTo[${MAX_PATHS}];
  uniform vec3 uPathNormal[${MAX_PATHS}];
  uniform int uPathCount;
  uniform vec4 uPads[${MAX_PADS}];
  uniform int uPadCount;
  uniform float uRadius;
  uniform vec3 uGrassDark;
  uniform vec3 uGrassLight;
  uniform vec3 uSand;
  uniform vec3 uVerge;
  uniform vec3 uFlowers[4];
  varying vec3 vSphere;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float valueNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  float angleToArc(vec3 p, vec3 a, vec3 b, vec3 n) {
    float s = dot(p, n);
    vec3 q = normalize(p - n * s);
    if (dot(cross(a, q), n) >= 0.0 && dot(cross(q, b), n) >= 0.0) return asin(min(1.0, abs(s)));
    return min(acos(clamp(dot(p, a), -1.0, 1.0)), acos(clamp(dot(p, b), -1.0, 1.0)));
  }

  vec3 meadow(vec3 p) {
    float broad = valueNoise(p * 18.0);
    float fine = valueNoise(p * 70.0);
    vec3 colour = mix(uGrassDark, uGrassLight, smoothstep(0.3, 0.75, broad));
    colour *= 0.94 + 0.12 * fine;

    // Flowers: one in every few cells of a fine grid, as a little dot.
    vec3 cell = p * 160.0;
    vec3 id = floor(cell);
    float pick = hash(id);
    float dotSize = smoothstep(0.3, 0.18, length(fract(cell) - 0.5));
    if (pick > 0.9) colour = mix(colour, uFlowers[int(hash(id + 7.0) * 3.99)], dotSize);

    float route = 1e3;
    for (int i = 0; i < ${MAX_PATHS}; i++) {
      if (i >= uPathCount) break;
      route = min(route, angleToArc(p, uPathFrom[i], uPathTo[i], uPathNormal[i]));
    }
    route *= uRadius;
    float pad = 0.0;
    for (int i = 0; i < ${MAX_PADS}; i++) {
      if (i >= uPadCount) break;
      float d = acos(clamp(dot(p, uPads[i].xyz), -1.0, 1.0)) * uRadius;
      pad = max(pad, smoothstep(uPads[i].w + 0.4, uPads[i].w - 0.4, d));
    }
    float sand = max(smoothstep(1.45, 1.15, route + fine * 0.2), pad);
    float verge = smoothstep(1.8, 1.5, route) * (1.0 - sand);
    colour = mix(colour, uVerge, verge * 0.8);
    return mix(colour, uSand * (0.95 + 0.08 * fine), sand);
  }
`

export class Planet {
  readonly mesh: THREE.Mesh

  constructor(
    scene: THREE.Scene,
    physics: Physics,
    readonly terrain: Terrain,
  ) {
    const { radius } = terrain
    const geometry = this.shape(radius)

    const material = new THREE.MeshStandardMaterial({ roughness: 1 })
    material.onBeforeCompile = (shader) => {
      const { paths, flats } = terrain
      Object.assign(shader.uniforms, {
        uPathFrom: { value: pad(paths.map((p) => p.from), MAX_PATHS) },
        uPathTo: { value: pad(paths.map((p) => p.to), MAX_PATHS) },
        uPathNormal: { value: pad(paths.map((p) => p.normal), MAX_PATHS) },
        uPathCount: { value: Math.min(paths.length, MAX_PATHS) },
        uPads: { value: pad(flats.map((f) => new THREE.Vector4(f.direction.x, f.direction.y, f.direction.z, f.reach - 1)), MAX_PADS) },
        uPadCount: { value: Math.min(flats.length, MAX_PADS) },
        uRadius: { value: radius },
        uGrassDark: { value: linear('#7eaf5b') },
        uGrassLight: { value: linear('#a9cc74') },
        uSand: { value: linear('#f2e3c2') },
        uVerge: { value: linear('#d6bd8a') },
        uFlowers: { value: ['#fff6e3', '#e0735a', '#f2c14e', '#a99be0'].map(linear) },
      })
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSphere;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSphere = normalize(position);')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${meadow}`)
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = meadow(normalize(vSphere));')
    }

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.receiveShadow = true
    scene.add(this.mesh)

    const vertices = geometry.attributes.position.array as Float32Array
    const indices = new Uint32Array(geometry.index!.array)
    physics.world.createCollider(RAPIER.ColliderDesc.trimesh(vertices, indices).setFriction(1))
  }

  get radius() {
    return this.terrain.radius
  }

  // Where the ground is above a unit direction.
  surfaceAt(direction: THREE.Vector3, lift = 0) {
    return direction.clone().multiplyScalar(this.terrain.radius + this.terrain.heightAt(direction) + lift)
  }

  private shape(radius: number) {
    let geometry: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 48)
    geometry.deleteAttribute('normal')
    geometry.deleteAttribute('uv')
    geometry = mergeVertices(geometry)
    const position = geometry.attributes.position
    const direction = new THREE.Vector3()
    for (let i = 0; i < position.count; i++) {
      direction.fromBufferAttribute(position, i).normalize()
      direction.multiplyScalar(radius + this.terrain.heightAt(direction))
      position.setXYZ(i, direction.x, direction.y, direction.z)
    }
    geometry.computeVertexNormals()
    return geometry
  }
}

// Uniform arrays have a fixed length in GLSL.
function pad<T extends THREE.Vector3 | THREE.Vector4>(items: T[], length: number): T[] {
  const filler = items[0] ?? new THREE.Vector3()
  return Array.from({ length }, (_, i) => items[i] ?? (filler.clone() as T))
}
