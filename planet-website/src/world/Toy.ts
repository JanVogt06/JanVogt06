import * as THREE from 'three'

// A faint light round the edges of every model, tinted by its own colour,
// as on soft plastic toys lit from all sides. The uniforms are shared, so a
// change of light can retint every model at once.
export const rim = {
  colour: { value: new THREE.Color('#fff0d4') },
  strength: { value: 0.3 },
}

// What a see-through material keeps clear: everything within `radius` of
// the line from the camera to `focus`, short of the focus itself. A radius
// of 0 turns it off.
export const clear = {
  focus: { value: new THREE.Vector3() },
  radius: { value: 0 },
}

// Marks a material to thin out where it stands between the camera and the
// focus, as trees do in front of the rover.
export function seeThrough(material: THREE.Material) {
  material.userData.seeThrough = true
}

const rimFragment = /* glsl */ `
  float facing = saturate(dot(normal, normalize(vViewPosition)));
  outgoingLight += uRimColour * mix(vec3(1.0), diffuseColor.rgb, 0.5) * uRimStrength * pow(1.0 - facing, 3.0);
  #include <opaque_fragment>`

// Where the fragment is in the world, instances included.
const clearVertex = /* glsl */ `
  #include <project_vertex>
  vec4 clearWorld = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    clearWorld = instanceMatrix * clearWorld;
  #endif
  vClearWorld = (modelMatrix * clearWorld).xyz;`

// Drops a share of the fragments near the line of sight in an ordered
// pattern, thinning out towards the edge: see-through without sorting.
const clearFragment = /* glsl */ `
  #include <clipping_planes_fragment>
  if (uClearRadius > 0.0) {
    vec3 sight = uClearFocus - cameraPosition;
    float reach = length(sight);
    vec3 along = sight / reach;
    float ahead = dot(vClearWorld - cameraPosition, along);
    if (ahead > 0.0 && ahead < reach - 1.2) {
      float off = length(vClearWorld - cameraPosition - along * ahead);
      float thin = 1.0 - smoothstep(uClearRadius * 0.55, uClearRadius, off);
      vec2 cell = mod(floor(gl_FragCoord.xy), 4.0);
      float order = mod(cell.x * 4.0 + cell.y * 9.0 + cell.x * cell.y * 3.0, 16.0) / 16.0;
      if (order < thin * 0.8) discard;
    }
  }`

// Gives every standard material under `root` the rim, except on `skip`, and
// the see-through ones their clearing.
export function soften(root: THREE.Object3D, skip: THREE.Object3D[] = []) {
  const done = new Set<THREE.Material>()
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || skip.includes(child)) return
    for (const material of [child.material].flat()) {
      if (!(material instanceof THREE.MeshStandardMaterial) || done.has(material)) continue
      done.add(material)
      const clears = Boolean(material.userData.seeThrough)
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uRimColour = rim.colour
        shader.uniforms.uRimStrength = rim.strength
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec3 uRimColour;\nuniform float uRimStrength;')
          .replace('#include <opaque_fragment>', rimFragment)
        if (!clears) return
        shader.uniforms.uClearFocus = clear.focus
        shader.uniforms.uClearRadius = clear.radius
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vClearWorld;')
          .replace('#include <project_vertex>', clearVertex)
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec3 uClearFocus;\nuniform float uClearRadius;\nvarying vec3 vClearWorld;')
          .replace('#include <clipping_planes_fragment>', clearFragment)
      }
      material.customProgramCacheKey = () => (clears ? 'soft-clear' : 'soft')
    }
  })
}
