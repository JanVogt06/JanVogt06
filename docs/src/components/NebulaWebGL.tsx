import {useEffect, useRef} from 'react';
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
    
    varying vec2 vUv;
    
    // ============================================
    // NOISE FUNCTIONS
    // ============================================
    
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    
    float hash3(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
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
    
    // Fractal Brownian Motion
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        
        for (int i = 0; i < 6; i++) {
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
        
        for (int i = 0; i < 5; i++) {
            v += a * abs(noise(p) * 2.0 - 1.0);
            p *= 2.0;
            a *= 0.5;
        }
        return v;
    }
    
    // Warped FBM for swirling effect
    float warpedFbm(vec2 p, float time) {
        vec2 q = vec2(
            fbm(p + vec2(0.0, 0.0)),
            fbm(p + vec2(5.2, 1.3))
        );
        
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
        
        // Check neighboring cells for smoother distribution
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec2 offset = vec2(float(x), float(y));
                vec2 cellId = id + offset;
                
                float n = hash(cellId);
                
                // Only some cells have stars
                if (n > 0.85) {
                    vec2 starPos = vec2(n, hash(cellId + 100.0)) - 0.5;
                    vec2 diff = gv - offset - starPos;
                    float dist = length(diff);
                    
                    // Star intensity with twinkle
                    float twinkle = sin(n * 100.0 + uTime * (2.0 + n * 3.0)) * 0.5 + 0.5;
                    float intensity = brightness * (0.5 + twinkle * 0.5);
                    
                    // Star glow
                    star += intensity * smoothstep(0.05, 0.0, dist);
                    star += intensity * 0.3 * smoothstep(0.1, 0.0, dist);
                }
            }
        }
        
        return star;
    }
    
    // ============================================
    // NEBULA
    // ============================================
    
    vec3 nebula(vec2 uv, float time) {
        vec3 col = vec3(0.0);
        
        // Slow time for gentle movement
        float t = time * 0.05;
        
        // === LAYER 1: Deep background nebula ===
        vec2 p1 = uv * 1.5;
        float n1 = warpedFbm(p1 + t * 0.3, time * 0.3);
        
        vec3 deepPurple = vec3(0.15, 0.05, 0.25);
        vec3 deepBlue = vec3(0.05, 0.1, 0.2);
        col += mix(deepBlue, deepPurple, n1) * 0.8;
        
        // === LAYER 2: Main nebula clouds ===
        vec2 p2 = uv * 2.0 + vec2(100.0, 50.0);
        float n2 = warpedFbm(p2 + t * 0.5, time * 0.4);
        n2 = pow(n2, 1.2);
        
        vec3 purple = vec3(0.5, 0.2, 0.7);
        vec3 magenta = vec3(0.7, 0.15, 0.5);
        vec3 cloud1 = mix(purple, magenta, fbm(p2 * 2.0 + t));
        col += cloud1 * n2 * 0.6;
        
        // === LAYER 3: Cyan/teal accent clouds ===
        vec2 p3 = uv * 2.5 + vec2(-50.0, 30.0);
        float n3 = warpedFbm(p3 - t * 0.4, time * 0.35);
        n3 = pow(n3, 1.5);
        
        vec3 cyan = vec3(0.1, 0.7, 0.8);
        vec3 teal = vec3(0.15, 0.5, 0.6);
        vec3 cloud2 = mix(teal, cyan, fbm(p3 * 1.5 - t));
        
        // Position cyan more to the left/top
        float cyanMask = smoothstep(0.6, 0.2, uv.x) * smoothstep(0.4, 0.8, uv.y);
        col += cloud2 * n3 * 0.5 * (0.3 + cyanMask * 0.7);
        
        // === LAYER 4: Pink highlights ===
        vec2 p4 = uv * 3.0 + vec2(25.0, -40.0);
        float n4 = warpedFbm(p4 + t * 0.6, time * 0.5);
        n4 = pow(n4, 2.0);
        
        vec3 pink = vec3(0.9, 0.3, 0.6);
        
        // Position pink more to the right
        float pinkMask = smoothstep(0.3, 0.7, uv.x);
        col += pink * n4 * 0.4 * pinkMask;
        
        // === LAYER 5: Bright core regions ===
        vec2 p5 = uv * 1.8 + vec2(10.0, 20.0);
        float n5 = warpedFbm(p5 + t * 0.2, time * 0.25);
        n5 = pow(n5, 3.0);
        
        vec3 brightCore = vec3(0.8, 0.6, 0.9);
        col += brightCore * n5 * 0.3;
        
        // === Dust lanes (darker regions) ===
        vec2 p6 = uv * 4.0;
        float dust = turbulence(p6 + t * 0.5);
        dust = smoothstep(0.3, 0.6, dust);
        col *= (0.7 + (1.0 - dust) * 0.3);
        
        return col;
    }
    
    // ============================================
    // MAIN
    // ============================================
    
    void main() {
        vec2 uv = vUv;
        float time = uTime;
        
        // === NEBULA ===
        vec3 col = nebula(uv, time);
        
        // === STARS ===
        // Multiple star layers for depth
        float starField = 0.0;
        starField += stars(uv, 80.0, 0.8);  // Distant stars
        starField += stars(uv + 0.5, 40.0, 1.0);  // Medium stars
        starField += stars(uv + 0.25, 20.0, 1.2);  // Closer, brighter stars
        
        // Stars are white/slightly blue
        vec3 starColor = vec3(0.9, 0.95, 1.0);
        col += starColor * starField;
        
        // === ATMOSPHERIC GLOW at edges ===
        float edgeGlow = 0.0;
        edgeGlow += smoothstep(0.5, 0.0, uv.x) * 0.3;  // Left edge purple glow
        edgeGlow += smoothstep(0.5, 1.0, uv.x) * 0.25;  // Right edge pink glow
        
        vec3 leftGlow = vec3(0.3, 0.1, 0.5);
        vec3 rightGlow = vec3(0.5, 0.1, 0.4);
        col += leftGlow * smoothstep(0.5, 0.0, uv.x) * 0.4;
        col += rightGlow * smoothstep(0.5, 1.0, uv.x) * 0.3;
        
        // Top glow
        float topGlow = smoothstep(0.5, 1.0, uv.y);
        col += vec3(0.2, 0.1, 0.3) * topGlow * 0.3;
        
        // === VIGNETTE ===
        vec2 vignetteUv = uv * (1.0 - uv);
        float vignette = vignetteUv.x * vignetteUv.y * 15.0;
        vignette = pow(vignette, 0.25);
        col *= vignette;
        
        // === FINAL ADJUSTMENTS ===
        // Slight color grading
        col = pow(col, vec3(0.95));
        
        // Ensure we don't blow out
        col = clamp(col, 0.0, 1.0);
        
        // Calculate alpha - more opaque where nebula is dense
        float alpha = length(col) * 1.5;
        alpha = clamp(alpha, 0.0, 0.95);
        
        // Fade out at bottom to blend with page content
        alpha *= smoothstep(0.0, 0.35, uv.y);
        
        gl_FragColor = vec4(col, alpha);
    }
`;

interface NebulaProps {
    className?: string;
}

const NebulaWebGL = ({className = ''}: NebulaProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const geometry = new THREE.PlaneGeometry(2, 2);

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: {value: 0},
                uResolution: {value: new THREE.Vector2(width, height)},
            },
            transparent: true,
            depthWrite: false,
        });

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
            renderer.setSize(newWidth, newHeight);
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