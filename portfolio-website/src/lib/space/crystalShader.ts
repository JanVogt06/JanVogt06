export const crystalVertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;

        vec4 view = viewMatrix * world;
        vViewPosition = view.xyz;

        gl_Position = projectionMatrix * view;
    }
`

export const crystalFragmentShader = `
    precision highp float;

    uniform vec3  uCore;
    uniform vec3  uRim;
    uniform float uTime;
    uniform float uHighlight;
    uniform float uFade;

    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
        vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
        vec3 viewDir = normalize(-vViewPosition);

        float facing = abs(dot(normal, viewDir));

        float fresnel = pow(1.0 - facing, 2.6);

        float core = pow(facing, 1.7);

        float breathe = 0.9 + 0.1 * sin(uTime * 0.7 + vWorldPosition.z * 0.6);

        float body = 0.16 + 0.20 * facing;

        vec3 col = uCore * (core * 0.95 + body) + uRim * fresnel * 1.9;

        col += uRim * fresnel * uHighlight * 1.4;
        col += uCore * core * uHighlight * 0.45;

        col *= breathe;

        float alpha = clamp(fresnel * 0.95 + core * 0.45 + body * 0.8, 0.0, 1.0);

        gl_FragColor = vec4(col, alpha * uFade);
    }
`
