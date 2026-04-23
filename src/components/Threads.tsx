"use client";

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

import './Threads.css';

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;

#define PI 3.1415926538

// DRASTICALLY REDUCED FOR MOBILE PERFORMANCE
const int u_line_count = 12; 
const float u_line_width = 4.0;
const float u_line_blur = 6.0;

// Simplified Hash for Perlin
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float mouse_y, float time, float amplitude, float distance) {
    float split_point = 0.1 + (perc * 0.4);
    float amp_norm = smoothstep(split_point, 0.7, st.x);
    float finalAmp = amp_norm * 0.5 * amplitude * (1.0 + (mouse_y - 0.5) * 0.2);

    float time_scaled = time / 12.0;
    float blur = smoothstep(split_point, split_point + 0.1, st.x) * perc;

    float xnoise = noise(vec2(time_scaled, st.x + perc) * 2.0);
    float y = 0.5 + (perc - 0.5) * distance + xnoise * finalAmp;

    float dist = abs(st.y - y);
    float thickness = (width / 2.0) + (u_line_blur * pixel(1.0, iResolution.xy) * blur);
    
    return smoothstep(thickness, 0.0, dist) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.4)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float strength = 0.0;
    
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        strength += lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            uMouse.y,
            iTime,
            uAmplitude,
            uDistance
        );
    }

    fragColor = vec4(uColor * strength, strength);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

const Threads = ({ 
  color = [0.91, 0.79, 0.48], 
  amplitude = 1, 
  distance = 0, 
  enableMouseInteraction = true, 
  ...rest 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Use lower dpr on mobile to save GPU
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const dpr = isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio;

    const renderer = new Renderer({ alpha: true, dpr });
    const gl = renderer.gl;
    if (!gl) return;

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height])
        },
        uColor: { value: new Float32Array(color) },
        uAmplitude: { value: amplitude },
        uDistance: { value: distance },
        uMouse: { value: new Float32Array([0.5, 0.5]) }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight);
      program.uniforms.iResolution.value[0] = gl.canvas.width;
      program.uniforms.iResolution.value[1] = gl.canvas.height;
      program.uniforms.iResolution.value[2] = gl.canvas.width / gl.canvas.height;
    }
    window.addEventListener('resize', resize);
    resize();

    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    function handleMouseMove(e: MouseEvent) {
      const rect = container.getBoundingClientRect();
      targetMouse = [(e.clientX - rect.left) / rect.width, 1.0 - (e.clientY - rect.top) / rect.height];
    }
    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        targetMouse = [(e.touches[0].clientX - rect.left) / rect.width, 1.0 - (e.touches[0].clientY - rect.top) / rect.height];
      }
    }
    
    if (enableMouseInteraction) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    function update(t: number) {
      if (enableMouseInteraction) {
        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
        program.uniforms.uMouse.value[0] = currentMouse[0];
        program.uniforms.uMouse.value[1] = currentMouse[1];
      }
      program.uniforms.iTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      animationFrameId.current = requestAnimationFrame(update);
    }
    animationFrameId.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', resize);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [color, amplitude, distance, enableMouseInteraction]);

  return <div ref={containerRef} className="threads-container" {...rest} />;
};

export default Threads;
