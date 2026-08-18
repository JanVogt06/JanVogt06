export const nebulaVertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

export const nebulaFragmentShader = `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uQuality; // 0.0=Eco, 0.25=Low, 0.5=Mid, 0.75=High, 1.0=Ultra
    uniform float uFade;
    
    varying vec2 vUv;
    
    // ============================================
    // NOISE FUNCTIONS
    // ============================================
    
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    // FBM - 5 quality levels: Eco=2, Low=3, Mid=4, High=5, Ultra=6 octaves
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        
        // Map quality to octaves: 0->2, 0.25->3, 0.5->4, 0.75->5, 1.0->6
        int octaves = 2 + int(uQuality * 4.0 + 0.5);
        
        for (int i = 0; i < 6; i++) {
            if (i >= octaves) break;
            v += a * noise(p);
            p = rot * p * 2.0;
            a *= 0.5;
        }
        return v;
    }
    
    // Turbulent noise - 5 quality levels: Eco=1, Low=2, Mid=3, High=4, Ultra=5 octaves
    float turbulence(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        
        // Map quality to octaves: 0->1, 0.25->2, 0.5->3, 0.75->4, 1.0->5
        int octaves = 1 + int(uQuality * 4.0 + 0.5);
        
        for (int i = 0; i < 5; i++) {
            if (i >= octaves) break;
            v += a * abs(noise(p) * 2.0 - 1.0);
            p *= 2.0;
            a *= 0.5;
        }
        return v;
    }
    
    // Warped FBM - complexity based on 5 quality levels
    float warpedFbm(vec2 p, float time) {
        vec2 q = vec2(
            fbm(p),
            fbm(p + vec2(5.2, 1.3))
        );
        
        // Eco (0): No warp, just basic fbm
        if (uQuality < 0.125) {
            return fbm(p + 2.0 * q);
        }
        
        // Low (0.25): Single simple warp
        if (uQuality < 0.375) {
            return fbm(p + 3.0 * q + vec2(time * 0.1, time * 0.08));
        }
        
        // Mid (0.5): Single warp with time variation
        if (uQuality < 0.625) {
            return fbm(p + 3.5 * q + vec2(time * 0.12, time * 0.1));
        }
        
        // High (0.75) & Ultra (1.0): Double warp
        vec2 r = vec2(
            fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * time),
            fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.12 * time)
        );
        
        return fbm(p + 4.0 * r);
    }
    

    // ============================================
    // NEBULA - 5 quality levels
    // ============================================
    
    vec3 nebula(vec2 uv, float time) {
        vec3 col = vec3(0.0);
        float t = time * 0.05;
        
        float n1 = warpedFbm(uv * 1.5 + t * 0.3, time * 0.3);
        col += mix(vec3(0.010, 0.014, 0.026), vec3(0.020, 0.020, 0.034), n1) * 0.9;

        float n2 = warpedFbm(uv * 2.0 + vec2(100.0, 50.0) + t * 0.5, time * 0.4);
        n2 = pow(n2, 1.6);
        vec3 dust = mix(vec3(0.115, 0.052, 0.042), vec3(0.140, 0.070, 0.058), fbm(uv * 2.0 + t));
        col += dust * n2 * 0.62;

        if (uQuality >= 0.2) {
            float n3 = warpedFbm(uv * 2.5 + vec2(-50.0, 30.0) - t * 0.4, time * 0.35);
            n3 = pow(n3, 2.1);
            vec3 oiii = mix(vec3(0.035, 0.088, 0.092), vec3(0.028, 0.105, 0.115), fbm(uv * 1.5 - t));
            float mask = smoothstep(0.6, 0.2, uv.x) * smoothstep(0.4, 0.8, uv.y);
            col += oiii * n3 * 0.5 * (0.25 + mask * 0.75);
        }

        if (uQuality >= 0.45) {
            float n4 = warpedFbm(uv * 3.0 + vec2(25.0, -40.0) + t * 0.6, time * 0.5);
            n4 = pow(n4, 3.2);
            float mask = smoothstep(0.3, 0.7, uv.x);
            col += vec3(0.28, 0.085, 0.075) * n4 * 0.5 * mask;
        }

        if (uQuality >= 0.7) {
            float n5 = warpedFbm(uv * 1.8 + vec2(10.0, 20.0) + t * 0.2, time * 0.25);
            n5 = pow(n5, 3.6);
            col += vec3(0.10, 0.13, 0.20) * n5 * 0.45;
        }
        
        // === Dust lanes (Ultra only : quality >= 1.0) ===
        if (uQuality >= 0.95) {
            float dust = turbulence(uv * 4.0 + t * 0.5);
            dust = smoothstep(0.3, 0.6, dust);
            col *= (0.7 + (1.0 - dust) * 0.3);
        }
        
        return col;
    }
    
    // ============================================
    // MAIN
    // ============================================
    
    void main() {
        vec2 uv = vUv;
        float time = uTime;
        float aspect = uResolution.x / uResolution.y;
        
        // Aspect ratio correction
        vec2 correctedUv = uv;
        correctedUv.x *= aspect;
        
        // === NEBULA ===
        vec3 col = nebula(correctedUv, time) * 0.72;

        col += vec3(0.055, 0.045, 0.085) * smoothstep(0.5, 0.0, uv.x) * 0.30;
        col += vec3(0.035, 0.060, 0.090) * smoothstep(0.5, 1.0, uv.x) * 0.26;

        // === VIGNETTE ===
        vec2 vignetteUv = uv * (1.0 - uv);
        float vignette = vignetteUv.x * vignetteUv.y * 15.0;
        vignette = pow(vignette, 0.25);
        col *= vignette;

        // === OUTPUT ===
        col = clamp(col, 0.0, 1.0);

        float alpha = clamp(length(col) * 1.6, 0.0, 0.92);

        alpha *= smoothstep(0.0, 0.1, uv.y);

        gl_FragColor = vec4(col, alpha * uFade);
    }
`;
