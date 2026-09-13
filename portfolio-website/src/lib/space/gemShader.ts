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
    uniform vec3 uBand;
    uniform vec3 uWarm;

    uniform vec3 uPoleDir;
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

    // The sky the facets have to work with. Analytic rather than a cube map:
    // it costs no texture, and every direction gives a different answer, which
    // is the whole reason a cut stone reads as a cut stone.
    vec3 sky(vec3 dir) {
        float band = exp(-pow(abs(dot(dir, uPoleDir)) / 0.36, 1.6));

        float speck = sin(dir.x * 9.0) * sin(dir.y * 11.0) * sin(dir.z * 7.0);
        speck = pow(max(speck, 0.0), 5.0);

        vec3 col = uBand * 0.16;
        col += uBand * band * 1.0;
        col += uBand * speck * 0.9;

        col += uWarm * lobe(dir, uCoreDir, 4.0) * 0.30;
        col += uWarm * lobe(dir, uCoreDir, 40.0) * 4.5;

        col += uSpark * lobe(dir, uKeyDir, 7.0) * 0.22;
        col += uSpark * lobe(dir, uKeyDir, 70.0) * 7.0;

        col += uEdge * lobe(dir, uRimDir, 110.0) * 4.0;

        return col;
    }

    void main() {
        vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
        vec3 viewDir = normalize(-vViewPosition);

        normal *= sign(dot(normal, viewDir));

        float facing = max(dot(normal, viewDir), 0.0);
        float fresnel = pow(1.0 - facing, 6.0);

        vec3 mirror = reflect(-viewDir, normal);

        vec3 through = refract(-viewDir, normal, 0.62);
        if (dot(through, through) < 0.001) through = mirror;

        vec3 reflected = sky(mirror);
        vec3 transmitted = sky(through) * uBody * 6.5;

        vec3 col = mix(transmitted, reflected, 0.10 + 0.90 * fresnel);

        col += uEdge * fresnel * 1.6;
        col += uSpark * uHighlight * (fresnel * 1.1 + 0.22);

        float body = dot(col, vec3(0.2126, 0.7152, 0.0722));
        float alpha = uFade * clamp(0.14 + fresnel * 0.55 + body * 0.9, 0.0, 1.0);

        gl_FragColor = vec4(col * uGain * alpha, alpha);
    }
`
