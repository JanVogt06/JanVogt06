import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {detectQuality, stepDown} from '@/lib/quality';

const vertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uQuality; // 0.0=Eco, 0.25=Low, 0.5=Mid, 0.75=High, 1.0=Ultra
    
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
        
        // === NEBULA ===
        vec3 col = nebula(correctedUv, time);
        
        // === STARS - layers based on quality ===
        float starField = 0.0;
        
        // Layer 1: Always present
        starField += stars(correctedUv, 80.0, 0.8);
        
        // Layer 2: Low+ (quality >= 0.25)
        if (uQuality >= 0.2) {
            starField += stars(correctedUv + 0.5, 40.0, 1.0);
        }
        
        // Layer 3: High+ (quality >= 0.75)
        if (uQuality >= 0.7) {
            starField += stars(correctedUv + 0.25, 20.0, 1.2);
        }
        
        col += vec3(0.9, 0.95, 1.0) * starField;
        
        // === EDGE GLOW ===
        col += vec3(0.3, 0.1, 0.5) * smoothstep(0.5, 0.0, uv.x) * 0.4;
        col += vec3(0.5, 0.1, 0.4) * smoothstep(0.5, 1.0, uv.x) * 0.3;
        col += vec3(0.2, 0.1, 0.3) * smoothstep(0.5, 1.0, uv.y) * 0.3;
        
        // === VIGNETTE ===
        vec2 vignetteUv = uv * (1.0 - uv);
        float vignette = vignetteUv.x * vignetteUv.y * 15.0;
        vignette = pow(vignette, 0.25);
        col *= vignette;
        
        // === FINAL ===
        col = pow(col, vec3(0.95));
        col = clamp(col, 0.0, 1.0);
        
        float alpha = length(col) * 1.5;
        alpha = clamp(alpha, 0.0, 0.95);
        alpha *= smoothstep(0.0, 0.35, uv.y);
        
        gl_FragColor = vec4(col, alpha);
    }
`;

/**
 * Aufloesung pro Qualitaetsstufe (0 = Eco ... 1 = Ultra). Auf schmalen
 * Viewports niedriger, weil dort meist der schwaechere Chip sitzt.
 */
const PIXEL_RATIOS = {
    mobile: [0.5, 0.75, 1.0, 1.5, 2.0],
    desktop: [0.75, 1.0, 1.25, 1.75, 2.5],
} as const;

const pixelRatioFor = (quality: number, width: number) => {
    const ratios = PIXEL_RATIOS[width < 768 ? 'mobile' : 'desktop'];
    return Math.min(window.devicePixelRatio, ratios[Math.round(quality * 4)]);
};

/* Messfenster und Schwelle der Selbstkorrektur: 45 fps ist der Punkt, ab dem
   eine Hintergrundanimation anfaengt, sich zaeh anzufuehlen. */
const SAMPLE_FRAMES = 60;
const MIN_ACCEPTABLE_FPS = 45;

const NebulaWebGL = ({className = '', paused = false}: {className?: string; paused?: boolean}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number>(0);
    /**
     * `paused` von aussen, zusaetzlich zu Sichtbarkeit und Viewport.
     *
     * Seit das Canvas `fixed` hinter der ganzen Seite liegt, ist es immer im
     * Viewport – der IntersectionObserver kann die Schleife also nie mehr
     * anhalten. Ohne diesen Schalter liefe der Shader ueber die volle
     * Seitenlaenge, auch wenn er fast ausgeblendet ist.
     *
     * Ueber Ref und nicht ueber die Dependency-Liste: eine Aenderung darf nur
     * die Schleife umschalten, nicht den WebGL-Kontext neu aufbauen.
     */
    const pausedRef = useRef(paused);
    const syncRef = useRef<() => void>(() => {});

    useEffect(() => {
        pausedRef.current = paused;
        syncRef.current();
    }, [paused]);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        let quality = detectQuality();

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: 'default',
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(pixelRatioFor(quality, width));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const geometry = new THREE.PlaneGeometry(2, 2);

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: {value: 0},
                uResolution: {value: new THREE.Vector2(width, height)},
                uQuality: {value: quality},
            },
            transparent: true,
            depthWrite: false,
        });
        scene.add(new THREE.Mesh(geometry, material));

        const clock = new THREE.Clock();
        const render = () => {
            material.uniforms.uTime.value = clock.getElapsedTime();
            renderer.render(scene, camera);
        };

        /**
         * Selbstkorrektur nach unten.
         *
         * detectQuality() raet anhand von Kernzahl und RAM – beides sagt nichts
         * ueber die GPU, und genau die entscheidet hier. Statt zu raten und
         * dabei zu bleiben, wird die echte Bildrate gemessen und die Stufe
         * gesenkt, solange sie nicht reicht.
         *
         * Nur abwaerts: ein Hoch- und Runterschalten wuerde pendeln, sobald die
         * Bildrate um die Schwelle herum liegt.
         */
        let frames = 0;
        let sampleStart = 0;

        const adapt = (now: number) => {
            if (quality === 0) return;
            if (frames === 0) sampleStart = now;
            if (++frames < SAMPLE_FRAMES) return;

            const fps = (frames * 1000) / (now - sampleStart);
            frames = 0;
            if (fps >= MIN_ACCEPTABLE_FPS) return;

            const lower = stepDown(quality);
            if (lower === null) return;
            quality = lower;
            material.uniforms.uQuality.value = quality;
            renderer.setPixelRatio(pixelRatioFor(quality, container.clientWidth));
        };

        /* Bewegung reduziert: EIN Bild, danach nichts mehr. Ein sich ewig
           umwaelzender Nebel ist genau die Art Bewegung, die gemeint ist. */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            render();
            return () => {
                geometry.dispose();
                material.dispose();
                renderer.dispose();
                if (container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement);
                }
            };
        }

        /**
         * Der Shader ist teuer (bis zu sechs FBM-Oktaven pro Pixel). Er laeuft
         * deshalb nur, wenn das Canvas wirklich zu sehen ist: nicht wenn es aus
         * dem Viewport gescrollt wurde und nicht in einem Hintergrund-Tab.
         */
        let onScreen = true;
        let running = false;

        const loop = (now: number) => {
            frameRef.current = requestAnimationFrame(loop);
            adapt(now);
            render();
        };

        const sync = () => {
            const shouldRun =
                onScreen && !pausedRef.current && document.visibilityState === 'visible';
            if (shouldRun === running) return;
            running = shouldRun;
            if (shouldRun) {
                /* Messung neu beginnen: die Pause haette sonst als ein sehr
                   langsames Bild in den Durchschnitt gezaehlt und die Stufe
                   grundlos gesenkt. */
                frames = 0;
                frameRef.current = requestAnimationFrame(loop);
            } else {
                cancelAnimationFrame(frameRef.current);
            }
        };

        const observer = new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            sync();
        });
        observer.observe(container);
        document.addEventListener('visibilitychange', sync);
        // Damit der paused-Effect oben dieselbe sync-Funktion ausloesen kann.
        syncRef.current = sync;
        sync();

        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            renderer.setSize(newWidth, newHeight);
            renderer.setPixelRatio(pixelRatioFor(material.uniforms.uQuality.value, newWidth));
            material.uniforms.uResolution.value.set(newWidth, newHeight);
            /* Bei angehaltener Schleife wuerde die Groessenaenderung sonst erst
               sichtbar, wenn das Canvas wieder in den Viewport kommt. */
            if (!running) render();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', sync);
            syncRef.current = () => {};
            observer.disconnect();
            cancelAnimationFrame(frameRef.current);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 pointer-events-none ${className}`}
            style={{zIndex: 0}}
        />
    );
};

export default NebulaWebGL;