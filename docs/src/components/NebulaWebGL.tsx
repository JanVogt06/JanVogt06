import {useEffect, useRef, useImperativeHandle, forwardRef} from 'react';
import * as THREE from 'three';

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
    uniform float uQuality; // 0.0 = low, 1.0 = high
    
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
    
    // FBM - dynamic octaves based on quality
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        
        // 3-6 octaves based on quality
        int octaves = 3 + int(uQuality * 3.0);
        
        for (int i = 0; i < 6; i++) {
            if (i >= octaves) break;
            v += a * noise(p);
            p = rot * p * 2.0;
            a *= 0.5;
        }
        return v;
    }
    
    // Turbulent noise
    float turbulence(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        
        int octaves = 2 + int(uQuality * 3.0);
        
        for (int i = 0; i < 5; i++) {
            if (i >= octaves) break;
            v += a * abs(noise(p) * 2.0 - 1.0);
            p *= 2.0;
            a *= 0.5;
        }
        return v;
    }
    
    // Warped FBM - complexity based on quality
    float warpedFbm(vec2 p, float time) {
        vec2 q = vec2(
            fbm(p),
            fbm(p + vec2(5.2, 1.3))
        );
        
        // Low quality: single warp
        if (uQuality < 0.5) {
            return fbm(p + 3.5 * q + vec2(time * 0.12, time * 0.1));
        }
        
        // High quality: double warp
        vec2 r = vec2(
            fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * time),
            fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.12 * time)
        );
        
        return fbm(p + 4.0 * r);
    }
    
    // ============================================
    // STARS
    // ============================================
    
    float stars(vec2 uv, float density, float brightness) {
        vec2 gv = fract(uv * density) - 0.5;
        vec2 id = floor(uv * density);
        
        float star = 0.0;
        
        // High quality: check neighboring cells
        if (uQuality > 0.6) {
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
        } else {
            // Low quality: single cell check
            float n = hash(id);
            if (n > 0.88) {
                vec2 starPos = vec2(n, hash(id + 100.0)) - 0.5;
                float dist = length(gv - starPos * 0.7);
                float twinkle = sin(n * 100.0 + uTime * 2.5) * 0.4 + 0.6;
                star = brightness * twinkle * smoothstep(0.06, 0.0, dist);
            }
        }
        
        return star;
    }
    
    // ============================================
    // NEBULA
    // ============================================
    
    vec3 nebula(vec2 uv, float time) {
        vec3 col = vec3(0.0);
        float t = time * 0.05;
        
        // === LAYER 1: Deep background ===
        float n1 = warpedFbm(uv * 1.5 + t * 0.3, time * 0.3);
        col += mix(vec3(0.05, 0.1, 0.2), vec3(0.15, 0.05, 0.25), n1) * 0.8;
        
        // === LAYER 2: Main purple/magenta clouds ===
        float n2 = warpedFbm(uv * 2.0 + vec2(100.0, 50.0) + t * 0.5, time * 0.4);
        n2 = pow(n2, 1.2);
        vec3 cloud1 = mix(vec3(0.5, 0.2, 0.7), vec3(0.7, 0.15, 0.5), fbm(uv * 2.0 + t));
        col += cloud1 * n2 * 0.6;
        
        // === LAYER 3: Cyan accent ===
        float n3 = warpedFbm(uv * 2.5 + vec2(-50.0, 30.0) - t * 0.4, time * 0.35);
        n3 = pow(n3, 1.5);
        vec3 cloud2 = mix(vec3(0.15, 0.5, 0.6), vec3(0.1, 0.7, 0.8), fbm(uv * 1.5 - t));
        float cyanMask = smoothstep(0.6, 0.2, uv.x) * smoothstep(0.4, 0.8, uv.y);
        col += cloud2 * n3 * 0.5 * (0.3 + cyanMask * 0.7);
        
        // === LAYER 4: Pink highlights ===
        float n4 = warpedFbm(uv * 3.0 + vec2(25.0, -40.0) + t * 0.6, time * 0.5);
        n4 = pow(n4, 2.0);
        float pinkMask = smoothstep(0.3, 0.7, uv.x);
        col += vec3(0.9, 0.3, 0.6) * n4 * 0.4 * pinkMask;
        
        // === LAYER 5: Bright cores (only on high quality) ===
        if (uQuality > 0.5) {
            float n5 = warpedFbm(uv * 1.8 + vec2(10.0, 20.0) + t * 0.2, time * 0.25);
            n5 = pow(n5, 3.0);
            col += vec3(0.8, 0.6, 0.9) * n5 * 0.3;
        }
        
        // === Dust lanes (only on high quality) ===
        if (uQuality > 0.7) {
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
        
        // === STARS ===
        float starField = 0.0;
        starField += stars(correctedUv, 80.0, 0.8);
        starField += stars(correctedUv + 0.5, 40.0, 1.0);
        
        // Third star layer only on high quality
        if (uQuality > 0.5) {
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

export interface NebulaHandle {
    setQuality: (quality: number) => void;
}

interface NebulaProps {
    className?: string;
    initialQuality?: number;
}

const NebulaWebGL = forwardRef<NebulaHandle, NebulaProps>(({className = '', initialQuality = 0.5}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number>(0);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

    useImperativeHandle(ref, () => ({
        setQuality: (quality: number) => {
            if (materialRef.current) {
                materialRef.current.uniforms.uQuality.value = quality;
            }
            // Adjust pixel ratio based on quality
            if (rendererRef.current && containerRef.current) {
                const isMobile = containerRef.current.clientWidth < 768;
                const baseRatio = isMobile ? 1 : 1.5;
                const maxRatio = isMobile ? 2 : 2.5;
                const pixelRatio = baseRatio + quality * (maxRatio - baseRatio);
                rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));
            }
        }
    }));

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: 'default',
        });
        renderer.setSize(width, height);

        const isMobile = width < 768;
        const baseRatio = isMobile ? 1 : 1.5;
        const maxRatio = isMobile ? 2 : 2.5;
        const pixelRatio = baseRatio + initialQuality * (maxRatio - baseRatio);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const geometry = new THREE.PlaneGeometry(2, 2);

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: {value: 0},
                uResolution: {value: new THREE.Vector2(width, height)},
                uQuality: {value: initialQuality},
            },
            transparent: true,
            depthWrite: false,
        });
        materialRef.current = material;

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const clock = new THREE.Clock();

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            material.uniforms.uTime.value = clock.getElapsedTime();
            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!container) return;
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            const isMobileNow = newWidth < 768;
            const currentQuality = material.uniforms.uQuality.value;
            const baseRatioNow = isMobileNow ? 1 : 1.5;
            const maxRatioNow = isMobileNow ? 2 : 2.5;
            const newPixelRatio = baseRatioNow + currentQuality * (maxRatioNow - baseRatioNow);

            renderer.setSize(newWidth, newHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, newPixelRatio));
            material.uniforms.uResolution.value.set(newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameRef.current);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [initialQuality]);

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 pointer-events-none ${className}`}
            style={{zIndex: 0}}
        />
    );
});

NebulaWebGL.displayName = 'NebulaWebGL';

export default NebulaWebGL;