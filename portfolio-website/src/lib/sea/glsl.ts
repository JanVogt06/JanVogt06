// Every surface fades into the sky colour of its own bearing on the horizon,
// so the sea, the panels and the sky meet without a seam.
export const SKY = /* glsl */ `
    uniform vec3 uZenith;
    uniform vec3 uHorizon;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform float uSunSize;
    uniform float uHalo;
    uniform float uFogDensity;
    uniform float uTime;

    float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
                   mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.03 + vec2(17.1, 9.2);
            a *= 0.5;
        }
        return v;
    }

    vec3 skyColor(vec3 dir) {
        float e = dir.y;
        float up = pow(clamp(e, 0.0, 1.0), 0.5);
        vec3 col = mix(uHorizon, uZenith, smoothstep(0.0, 1.0, up));

        // A low band of haze sits on the horizon in every light.
        col += uHorizon * 0.18 * exp(-abs(e) * 22.0);

        // Thin layers of stratus, stretched along the horizon.
        if (e > 0.0) {
            vec2 q = dir.xz / (e + 0.12);
            float layer = fbm(vec2(q.x * 0.55, q.y * 1.6) + vec2(uTime * 0.004, 0.0));
            col *= 1.0 + (layer - 0.5) * 0.16 * smoothstep(0.0, 0.08, e) * (1.0 - smoothstep(0.35, 0.9, e));
        }

        float mu = max(dot(dir, uSunDir), 0.0);
        col += uSunColor * uHalo * (pow(mu, 6.0) * 0.16 + pow(mu, 48.0) * 0.32 + pow(mu, 600.0) * 0.6);
        col += uSunColor * smoothstep(cos(uSunSize), cos(uSunSize * 0.82), mu) * 1.6;
        return col;
    }

    vec3 horizonColor(vec3 dir) {
        return skyColor(normalize(vec3(dir.x, 0.0, dir.z) + vec3(0.0, 1e-4, 0.0)));
    }

    float fogAmount(float dist) {
        return 1.0 - exp(-pow(dist * uFogDensity, 1.35));
    }
`

export const skyVertex = /* glsl */ `
    varying vec3 vWorld;

    void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
        gl_Position.z = gl_Position.w;
    }
`

export const skyFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    varying vec3 vWorld;

    void main() {
        vec3 dir = normalize(vWorld - cameraPosition);
        gl_FragColor = vec4(skyColor(dir), 1.0);
    }
`

export const starVertex = /* glsl */ `
    attribute float aSize;
    attribute float aPhase;

    uniform float uTime;
    uniform float uPixelRatio;

    varying float vTwinkle;
    varying float vLift;

    void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vLift = normalize(world.xyz - cameraPosition).y;
        vTwinkle = 0.75 + 0.25 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0);
        gl_PointSize = aSize * uPixelRatio;
        gl_Position = projectionMatrix * viewMatrix * world;
        gl_Position.z = gl_Position.w * 0.99999;
    }
`

export const starFragment = /* glsl */ `
    precision highp float;

    uniform float uAmount;

    varying float vTwinkle;
    varying float vLift;

    void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float core = smoothstep(0.5, 0.0, d);
        // Stars drown in the haze near the horizon, as they do.
        float fade = smoothstep(0.02, 0.22, abs(vLift));
        float a = core * core * vTwinkle * uAmount * fade;
        gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a, a);
    }
`

export const waterVertex = /* glsl */ `
    uniform mat4 textureMatrix;

    varying vec4 vMirror;
    varying vec3 vWorld;

    void main() {
        vMirror = textureMatrix * vec4(position, 1.0);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`

// Deep-water swell: every component travels at the speed the dispersion
// relation gives its wavelength, so the surface moves like real water.
export const waterFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    uniform sampler2D tDiffuse;
    uniform vec3 color;
    uniform vec3 uDeep;
    uniform float uChop;
    uniform float uGlitter;

    varying vec4 vMirror;
    varying vec3 vWorld;

    const int WAVES = 12;

    vec2 slope(vec2 p, float footprint) {
        vec2 g = vec2(0.0);
        float lambda = 11.0;
        float steep = 0.055;
        float angle = 0.35;
        for (int i = 0; i < WAVES; i++) {
            float k = 6.2831853 / lambda;
            float w = sqrt(9.81 * k);
            vec2 d = vec2(cos(angle), sin(angle));
            // A wave shorter than a few pixels only flickers, so it fades out
            // before the surface can alias it.
            float keep = 1.0 - smoothstep(lambda * 0.12, lambda * 0.45, footprint);
            g += d * steep * keep * cos(dot(d, p) * k - w * uTime + float(i) * 1.7);
            lambda *= 0.69;
            steep *= 0.93;
            angle += 2.399;
        }
        return g;
    }

    void main() {
        vec3 toEye = cameraPosition - vWorld;
        float dist = length(toEye);
        vec3 v = toEye / dist;

        float footprint = length(fwidth(vWorld.xz));
        vec2 g = slope(vWorld.xz, footprint) * uChop;
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));

        float facing = max(dot(n, v), 0.0);
        float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);

        // Ripples stretch a reflection downwards far more than sideways, so
        // the mirror is pulled apart along the vertical and smeared a little.
        vec4 mirror = vMirror;
        float reach = min(mirror.w, 6.0);
        mirror.xy += vec2(n.x * 0.012, n.z * 0.045) * reach;
        vec2 smear = vec2(0.0, 0.006 + abs(n.z) * 0.03) * reach;
        vec3 reflected = texture2DProj(tDiffuse, mirror).rgb * 0.4;
        reflected += texture2DProj(tDiffuse, mirror + vec4(smear, 0.0, 0.0)).rgb * 0.3;
        reflected += texture2DProj(tDiffuse, mirror - vec4(smear, 0.0, 0.0)).rgb * 0.3;

        vec3 body = uDeep * (0.7 + 0.3 * n.y);
        vec3 col = mix(body, reflected, fresnel);

        vec3 r = reflect(-v, n);
        float mu = max(dot(r, uSunDir), 0.0);
        col += uSunColor * uGlitter * (pow(mu, 900.0) * 9.0 + pow(mu, 90.0) * 0.35);

        col = mix(col, horizonColor(-v), fogAmount(dist));
        gl_FragColor = vec4(col, 1.0);
    }
`

export const panelVertex = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorld;

    void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`

export const panelFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    uniform sampler2D uMap;
    uniform float uHasMap;
    uniform float uFocus;
    uniform float uLight;
    uniform float uAspect;
    uniform vec3 uBlank;
    uniform float uVeil;

    varying vec2 vUv;
    varying vec3 vWorld;

    void main() {
        vec3 c = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : uBlank;

        // Out of focus a panel is a print left in the fog; in focus it lights up.
        float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(luma), c, mix(0.08, 1.0, uFocus));
        c *= uLight * mix(0.62, 1.0, uFocus);

        vec2 edge = min(vUv, 1.0 - vUv) * vec2(uAspect, 1.0);
        float rim = 1.0 - smoothstep(0.0, 0.006, min(edge.x, edge.y));
        c = mix(c, vec3(0.8), rim * 0.12);

        // Even up close there is a little air between the eye and the print.
        c = mix(c, uHorizon, 0.06 + 0.06 * (1.0 - uFocus));

        float dist = length(cameraPosition - vWorld);
        c = mix(c, horizonColor(vWorld - cameraPosition), max(fogAmount(dist), uVeil));
        gl_FragColor = vec4(c, 1.0);
    }
`

export const solidFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    uniform vec3 uColor;
    uniform float uVeil;

    varying vec2 vUv;
    varying vec3 vWorld;

    void main() {
        float dist = length(cameraPosition - vWorld);
        vec3 c = mix(uColor, horizonColor(vWorld - cameraPosition), max(fogAmount(dist), uVeil));
        gl_FragColor = vec4(c, 1.0);
    }
`

export const passVertex = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`
