export const gemVertexShader = `
    varying vec3 vViewPosition;

    void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = view.xyz;
        gl_Position = projectionMatrix * view;
    }
`

export const gemFragmentShader = `
    precision highp float;

    uniform vec3 uBody;
    uniform vec3 uEdge;
    uniform vec3 uSpark;

    uniform vec3 uCoreDir;
    uniform vec3 uKeyDir;
    uniform vec3 uRimDir;

    uniform float uTime;
    uniform float uHighlight;
    uniform float uFade;
    uniform float uGain;

    varying vec3 vViewPosition;

    float lobe(vec3 dir, vec3 axis, float tightness) {
        return pow(max(dot(dir, axis), 0.0), tightness);
    }

    void main() {
        vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
        vec3 viewDir = normalize(-vViewPosition);

        normal *= sign(dot(normal, viewDir));

        float facing = max(dot(normal, viewDir), 0.0);
        float fresnel = pow(1.0 - facing, 3.0);

        vec3 mirror = reflect(-viewDir, normal);

        float key = lobe(mirror, uKeyDir, 240.0) + lobe(mirror, uKeyDir, 14.0) * 0.16;
        float rim = lobe(mirror, uRimDir, 180.0);
        float core = lobe(mirror, uCoreDir, 70.0) + lobe(mirror, uCoreDir, 6.0) * 0.12;

        float travel = 0.5 + 0.5 * sin(mirror.y * 3.1 + mirror.x * 2.2 + uTime * 0.12);
        vec3 chroma = mix(uBody, uEdge, travel);

        vec3 col = chroma * (0.12 + 0.34 * facing);
        col += uEdge * fresnel * 1.5;
        col += uSpark * (key * 2.6 + rim * 1.8 + core * 1.5);
        col += uSpark * uHighlight * (fresnel * 1.2 + 0.25);

        float alpha = uFade * clamp(
            fresnel * 0.8 + facing * 0.2 + key + rim * 0.7 + core * 0.6, 0.0, 1.0);

        gl_FragColor = vec4(col * uGain * alpha, alpha);
    }
`
