"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * ScrollScene — capa ambiental sutil detrás de TODO el sitio (no solo el
 * hero). Vive DETRÁS del contenido (z-index bajo), así solo se asoma en
 * los espacios vacíos entre secciones y nunca compite con el texto de una
 * tarjeta. Los puntos son círculos suaves (no cuadrados) que:
 *
 *  - Flotan despacio hacia arriba, como luciérnagas — da vida sin ser ruido.
 *  - Cambian de color según la sección activa (azul / verde en Express /
 *    rojo en Seguridad).
 *  - Rotan levemente según cuánto scrolleaste en total (GSAP ScrollTrigger).
 */

const SECTION_COLORS: Record<string, string> = {
  home: "#3B82F6",
  process: "#3B82F6",
  services: "#3B82F6",
  express: "#10B981",
  industries: "#3B82F6",
  security: "#EF4444",
  cases: "#3B82F6",
  contact: "#3B82F6",
};

const PARTICLE_COUNT = 140;

function buildGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function ParticleField({ activeSection }: { activeSection: string }) {
  const group = useRef<THREE.Group>(null!);
  const pointsMatRef = useRef<THREE.PointsMaterial>(null!);
  const colorRef = useRef(new THREE.Color(SECTION_COLORS.home));
  const targetColor = useRef(new THREE.Color(SECTION_COLORS.home));
  const progress = useRef(0);
  const glowTexture = useMemo(() => buildGlowTexture(), []);

  useEffect(() => {
    targetColor.current = new THREE.Color(SECTION_COLORS[activeSection] || SECTION_COLORS.home);
  }, [activeSection]);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    return () => st.kill();
  }, []);

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      spd[i] = 0.05 + Math.random() * 0.08;
    }
    return { positions: pos, speeds: spd };
  }, []);

  const geomRef = useRef<THREE.BufferGeometry>(null!);

  useFrame((state, delta) => {
    colorRef.current.lerp(targetColor.current, Math.min(1, delta * 1.4));
    if (pointsMatRef.current) {
      pointsMatRef.current.color = colorRef.current;
    }

    // deriva lenta hacia arriba, tipo luciérnaga, con wrap-around
    const posAttr = geomRef.current?.attributes.position as THREE.BufferAttribute | undefined;
    if (posAttr) {
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        arr[i * 3 + 1] += speeds[i] * delta;
        if (arr[i * 3 + 1] > 7.5) arr[i * 3 + 1] = -7.5;
      }
      posAttr.needsUpdate = true;
    }

    const p = progress.current;
    if (group.current) {
      group.current.rotation.y = p * Math.PI * 0.9;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMatRef}
          map={glowTexture}
          size={0.16}
          sizeAttenuation
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function ScrollScene({ activeSection }: { activeSection: string }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.75]}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ParticleField activeSection={activeSection} />
      </Canvas>
    </div>
  );
}
