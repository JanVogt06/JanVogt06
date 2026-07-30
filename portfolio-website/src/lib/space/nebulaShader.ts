/**
 * Nebel-Hintergrund als Fragment-Shader.
 *
 * Unveraendert aus NebulaWebGL.tsx uebernommen, nur aus der Komponente
 * herausgelost: die Szene rendert jetzt Hintergrund UND Kristalle, und ein
 * 300-Zeilen-Shader-String hat in einer React-Komponente ohnehin nichts zu
 * suchen.
 *
 * uQuality steuert die Zahl der FBM-Oktaven und der Sternebenen (0 = Eco bis
 * 1 = Ultra); die Stufe bestimmt lib/quality.ts und korrigiert sich an der
 * gemessenen Bildrate nach unten.
 */

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
    /* Deckkraft. Muss im Shader liegen und nicht als opacity am Wrapper:
       dieselbe Canvas traegt jetzt auch die Kristalle, die NICHT mitausblenden
       sollen. */
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
    // STARS - 5 quality levels
    // ============================================
    
    float stars(vec2 uv, float density, float brightness) {
        vec2 gv = fract(uv * density) - 0.5;
        vec2 id = floor(uv * density);
        
        float star = 0.0;
        
        // Ultra (1.0): Full 3x3 neighbor check with twinkle
        if (uQuality > 0.875) {
            for (int y = -1; y <= 1; y++) {
                for (int x = -1; x <= 1; x++) {
                    vec2 offset = vec2(float(x), float(y));
                    vec2 cellId = id + offset;
                    
                    float n = hash(cellId);
                    
                    if (n > 0.85) {
                        vec2 starPos = vec2(n, hash(cellId + 100.0)) - 0.5;
                        vec2 diff = gv - offset - starPos;
                        float dist = length(diff);
                        
                        float twinkle = sin(n * 100.0 + uTime * (2.0 + n * 3.0)) * 0.5 + 0.5;
                        float intensity = brightness * (0.5 + twinkle * 0.5);
                        
                        star += intensity * smoothstep(0.05, 0.0, dist);
                        star += intensity * 0.3 * smoothstep(0.1, 0.0, dist);
                    }
                }
            }
        }
        // High (0.75): 3x3 neighbor check, simpler twinkle
        else if (uQuality > 0.625) {
            for (int y = -1; y <= 1; y++) {
                for (int x = -1; x <= 1; x++) {
                    vec2 offset = vec2(float(x), float(y));
                    vec2 cellId = id + offset;
                    
                    float n = hash(cellId);
                    
                    if (n > 0.86) {
                        vec2 starPos = vec2(n, hash(cellId + 100.0)) - 0.5;
                        vec2 diff = gv - offset - starPos;
                        float dist = length(diff);
                        
                        float twinkle = sin(n * 80.0 + uTime * 2.5) * 0.4 + 0.6;
                        star += brightness * twinkle * smoothstep(0.05, 0.0, dist);
                    }
                }
            }
        }
        // Mid (0.5): Single cell with twinkle
        else if (uQuality > 0.375) {
            float n = hash(id);
            if (n > 0.87) {
                vec2 starPos = vec2(n, hash(id + 100.0)) - 0.5;
                float dist = length(gv - starPos * 0.7);
                float twinkle = sin(n * 80.0 + uTime * 2.0) * 0.35 + 0.65;
                star = brightness * twinkle * smoothstep(0.055, 0.0, dist);
            }
        }
        // Low (0.25): Single cell, minimal twinkle
        else if (uQuality > 0.125) {
            float n = hash(id);
            if (n > 0.88) {
                vec2 starPos = vec2(n, hash(id + 100.0)) - 0.5;
                float dist = length(gv - starPos * 0.6);
                float twinkle = sin(n * 50.0 + uTime * 1.5) * 0.25 + 0.75;
                star = brightness * twinkle * smoothstep(0.06, 0.0, dist);
            }
        }
        // Eco (0): Simplest stars, no twinkle
        else {
            float n = hash(id);
            if (n > 0.9) {
                vec2 starPos = vec2(n, hash(id + 100.0)) - 0.5;
                float dist = length(gv - starPos * 0.5);
                star = brightness * 0.8 * smoothstep(0.07, 0.0, dist);
            }
        }
        
        return star;
    }
    
    // ============================================
    // NEBULA - 5 quality levels
    // ============================================
    
    vec3 nebula(vec2 uv, float time) {
        vec3 col = vec3(0.0);
        float t = time * 0.05;
        
        // === LAYER 1: Deep background (all levels) ===
        float n1 = warpedFbm(uv * 1.5 + t * 0.3, time * 0.3);
        col += mix(vec3(0.05, 0.1, 0.2), vec3(0.15, 0.05, 0.25), n1) * 0.8;
        
        // === LAYER 2: Main purple/magenta clouds (all levels) ===
        float n2 = warpedFbm(uv * 2.0 + vec2(100.0, 50.0) + t * 0.5, time * 0.4);
        n2 = pow(n2, 1.2);
        vec3 cloud1 = mix(vec3(0.5, 0.2, 0.7), vec3(0.7, 0.15, 0.5), fbm(uv * 2.0 + t));
        col += cloud1 * n2 * 0.6;
        
        // === LAYER 3: Cyan accent (Low+ : quality >= 0.25) ===
        if (uQuality >= 0.2) {
            float n3 = warpedFbm(uv * 2.5 + vec2(-50.0, 30.0) - t * 0.4, time * 0.35);
            n3 = pow(n3, 1.5);
            vec3 cloud2 = mix(vec3(0.15, 0.5, 0.6), vec3(0.1, 0.7, 0.8), fbm(uv * 1.5 - t));
            float cyanMask = smoothstep(0.6, 0.2, uv.x) * smoothstep(0.4, 0.8, uv.y);
            col += cloud2 * n3 * 0.5 * (0.3 + cyanMask * 0.7);
        }
        
        // === LAYER 4: Pink highlights (Mid+ : quality >= 0.5) ===
        if (uQuality >= 0.45) {
            float n4 = warpedFbm(uv * 3.0 + vec2(25.0, -40.0) + t * 0.6, time * 0.5);
            n4 = pow(n4, 2.0);
            float pinkMask = smoothstep(0.3, 0.7, uv.x);
            col += vec3(0.9, 0.3, 0.6) * n4 * 0.4 * pinkMask;
        }
        
        // === LAYER 5: Bright cores (High+ : quality >= 0.75) ===
        if (uQuality >= 0.7) {
            float n5 = warpedFbm(uv * 1.8 + vec2(10.0, 20.0) + t * 0.2, time * 0.25);
            n5 = pow(n5, 3.0);
            col += vec3(0.8, 0.6, 0.9) * n5 * 0.3;
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
        
        // === NEBEL ===
        /* NEBULA_GAIN: der Nebel war als saftiges Magenta die lauteste Flaeche
           der Seite – eher Gaming-Wallpaper als Weltraum. Heruntergezogen wird er
           zu Schlieren, durch die man Sterne sieht, statt zu einer Wolke, die
           alles einfaerbt. Die Sterne bleiben dabei voll hell: sie kosten fast
           nichts und tragen den Weltraum-Eindruck allein. */
        vec3 col = nebula(correctedUv, time) * 0.42;

        // === STERNE – Ebenen je nach Qualitaet ===
        float starField = 0.0;

        // Ebene 1: immer
        starField += stars(correctedUv, 80.0, 0.8);

        // Ebene 2: ab Low
        if (uQuality >= 0.2) {
            starField += stars(correctedUv + 0.5, 40.0, 1.0);
        }

        // Ebene 3: ab High
        if (uQuality >= 0.7) {
            starField += stars(correctedUv + 0.25, 20.0, 1.2);
        }

        col += vec3(0.92, 0.96, 1.0) * starField;

        // === RANDSCHIMMER – dezent, nur als Andeutung von Tiefe ===
        col += vec3(0.16, 0.06, 0.30) * smoothstep(0.5, 0.0, uv.x) * 0.22;
        col += vec3(0.10, 0.16, 0.26) * smoothstep(0.5, 1.0, uv.x) * 0.18;

        // === VIGNETTE ===
        vec2 vignetteUv = uv * (1.0 - uv);
        float vignette = vignetteUv.x * vignetteUv.y * 15.0;
        vignette = pow(vignette, 0.25);
        col *= vignette;

        // === ABSCHLUSS ===
        col = clamp(col, 0.0, 1.0);

        float alpha = clamp(length(col) * 1.15, 0.0, 0.8);
        alpha *= smoothstep(0.0, 0.3, uv.y);

        gl_FragColor = vec4(col, alpha * uFade);
    }
`;
