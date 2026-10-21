import * as THREE from 'three'

// A faint light round the edges of every model, tinted by its own colour,
// as on soft plastic toys lit from all sides. The uniforms are shared, so a
// change of light can retint every model at once.
export const rim = {
  colour: { value: new THREE.Color('#fff0d4') },
  strength: { value: 0.3 },
}

// Gives every standard material under `root` the rim, except on `skip`.
export function soften(root: THREE.Object3D, skip: THREE.Object3D[] = []) {
  const done = new Set<THREE.Material>()
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || skip.includes(child)) return
    for (const material of [child.material].flat()) {
      if (!(material instanceof THREE.MeshStandardMaterial) || done.has(material)) continue
      done.add(material)
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uRimColour = rim.colour
        shader.uniforms.uRimStrength = rim.strength
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec3 uRimColour;\nuniform float uRimStrength;')
          .replace(
            '#include <opaque_fragment>',
            /* glsl */ `
            float facing = saturate(dot(normal, normalize(vViewPosition)));
            outgoingLight += uRimColour * mix(vec3(1.0), diffuseColor.rgb, 0.5) * uRimStrength * pow(1.0 - facing, 3.0);
            #include <opaque_fragment>`,
          )
      }
      material.customProgramCacheKey = () => 'soft'
    }
  })
}
