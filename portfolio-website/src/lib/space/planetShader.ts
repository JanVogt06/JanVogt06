export const planetVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);

        vec4 view = viewMatrix * modelMatrix * vec4(position, 1.0);
        vViewPosition = view.xyz;

        gl_Position = projectionMatrix * view;
    }
`

export const planetFragmentShader = `
    precision highp float;

    uniform sampler2D uMap;

    uniform float uHasMap;

    uniform vec3  uSurface;
    uniform vec3  uShadow;
    uniform vec3  uRim;

    uniform float uAtmosphere;
    uniform float uFade;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    const vec3 LIGHT = vec3(-0.55, 0.5, 0.67);

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vViewPosition);

        vec3 albedo = mix(uSurface, texture2D(uMap, vUv).rgb, uHasMap);

        float lambert = dot(normal, normalize(LIGHT));
        float day = smoothstep(-0.22, 0.5, lambert);

        float limb = pow(max(dot(normal, viewDir), 0.0), 0.35);

        vec3 lit = albedo * (0.35 + 0.65 * limb);
        vec3 col = mix(uShadow * albedo * 1.6, lit, day);

        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.4);
        col += uRim * fresnel * (0.2 + 0.8 * day) * uAtmosphere;

        gl_FragColor = vec4(col, uFade);
    }
`

export const ringVertexShader = `
    varying vec3 vLocal;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vLocal = position;
        vNormal = normalize(normalMatrix * normal);

        vec4 view = viewMatrix * modelMatrix * vec4(position, 1.0);
        vViewPosition = view.xyz;

        gl_Position = projectionMatrix * view;
    }
`

export const ringFragmentShader = `
    precision highp float;

    uniform sampler2D uMap;
    uniform float uHasMap;
    uniform vec3  uColor;
    uniform float uFade;

    uniform vec2  uRadii;

    uniform float uPlanetRadius;

    uniform vec3  uLight;

    varying vec3 vLocal;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        float r = length(vLocal.xy);
        float t = clamp((r - uRadii.x) / max(uRadii.y - uRadii.x, 0.001), 0.0, 1.0);

        vec4 sampled = texture2D(uMap, vec2(t, 0.5));

        float fallback = (1.0 - abs(t - 0.5) * 2.0);
        fallback *= 1.0 - 0.6 * smoothstep(0.62, 0.68, t) * (1.0 - smoothstep(0.72, 0.78, t));

        vec3 col = mix(uColor, sampled.rgb, uHasMap);
        float alpha = mix(fallback * fallback, sampled.a, uHasMap);

        vec3 light = normalize(uLight);
        float along = dot(vLocal, light);
        float perp = length(vLocal - light * along);
        float shadow = smoothstep(uPlanetRadius * 1.08, uPlanetRadius * 0.82, perp)
                     * smoothstep(0.0, -0.15, along);
        col *= 1.0 - 0.82 * shadow;

        vec3 viewDir = normalize(-vViewPosition);
        float grazing = 1.0 - abs(dot(normalize(vNormal), viewDir));
        alpha *= 0.72 + 0.5 * grazing;

        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * uFade);
    }
`
