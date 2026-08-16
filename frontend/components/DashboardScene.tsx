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
 * DashboardScene — primera escena 3D "de verdad" (geometría real, no
 * partículas sueltas) para la sección Cómo Funciona.
 *
 * Qué arma, en orden, atado al scroll DENTRO de esta sección (no a toda
 * la página):
 *  1. Un panel central (la "pantalla" del dashboard) aparece primero.
 *  2. 4 tarjetas de estado (una por paso: Consulta, Diagnóstico, Propuesta,
 *     Desarrollo) vuelan desde afuera y se acomodan alrededor.
 *  3. Un cluster de barras de datos crece desde el piso, como un gráfico
 *     cargando.
 *  4. Líneas finas conectan cada tarjeta con el panel central.
 *  5. La cámara se acerca despacio a medida que scrolleás por la sección.
 *
 * Todo el progreso (0 a 1) viene de un único GSAP ScrollTrigger con scrub,
 * acotado al contenedor de esta escena — no toca el resto de la página.
 */

const PANEL_COUNT = 4;

function useSectionProgress(containerRef: React.RefObject<HTMLDivElement | null>) {
  const progress = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 85%",
      end: "bottom 55%",
      scrub: 0.5,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    return () => st.kill();
  }, [containerRef]);

  return progress;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function DashboardRig({ progress }: { progress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null!);

  // -------- panel central (la "pantalla") --------
  const hubRef = useRef<THREE.Group>(null!);

  // -------- 4 tarjetas de estado --------
  const cardData = useMemo(() => {
    const angles = [-0.65, -0.22, 0.22, 0.65];
    return angles.map((a, i) => {
      const targetX = Math.sin(a) * 2.1;
      const targetY = 0.4 + (i % 2 === 0 ? 0.55 : -0.15);
      const targetZ = Math.cos(a) * 0.6 + 0.4;
      const start = new THREE.Vector3(
        targetX + (Math.random() - 0.5) * 6,
        targetY + (Math.random() - 0.5) * 4 + 3,
        targetZ - 4 - Math.random() * 2
      );
      return {
        target: new THREE.Vector3(targetX, targetY, targetZ),
        start,
        delay: i * 0.08,
      };
    });
  }, []);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);

  // -------- barras de datos --------
  const barData = useMemo(() => {
    const n = 6;
    return new Array(n).fill(0).map((_, i) => ({
      x: -1.3 + i * 0.32,
      maxHeight: 0.35 + Math.random() * 0.9,
      delay: 0.45 + i * 0.03,
    }));
  }, []);
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);

  // -------- líneas de conexión --------
  const lineRefs = useRef<(THREE.Line | null)[]>([]);

  useFrame((state) => {
    const p = progress.current;
    const t = state.clock.getElapsedTime();

    // fase 1 (0 -> 0.22): panel central aparece
    const hubP = easeOutCubic(clamp01(p / 0.22));
    if (hubRef.current) {
      hubRef.current.scale.setScalar(hubP);
      (hubRef.current.children as THREE.Object3D[]).forEach((child) => {
        const mat = (child as THREE.Mesh).material as THREE.Material & { opacity?: number };
        if (mat && "opacity" in mat) mat.opacity = hubP * (mat.userData?.baseOpacity ?? 1);
      });
    }

    // fase 2 (0.15 -> 0.6): tarjetas vuelan a su lugar
    cardData.forEach((c, i) => {
      const local = clamp01((p - 0.15 - c.delay) / 0.35);
      const eased = easeOutCubic(local);
      const ref = cardRefs.current[i];
      if (ref) {
        ref.position.lerpVectors(c.start, c.target, eased);
        ref.rotation.y = (1 - eased) * 1.2;
        const mat = (ref.children[0] as THREE.Mesh)?.material as THREE.Material & { opacity?: number };
        if (mat) mat.opacity = eased;
      }
    });

    // fase 3 (0.45 -> 0.85): barras crecen
    barData.forEach((b, i) => {
      const local = clamp01((p - b.delay) / 0.3);
      const eased = easeOutCubic(local);
      const ref = barRefs.current[i];
      if (ref) {
        const h = Math.max(0.001, b.maxHeight * eased);
        ref.scale.y = h;
        ref.position.y = -0.55 + h / 2;
      }
    });

    // fase 4 (0.55 -> 1): líneas de conexión se revelan
    lineRefs.current.forEach((line, i) => {
      if (!line) return;
      const local = clamp01((p - 0.55 - i * 0.05) / 0.3);
      (line.material as THREE.LineBasicMaterial).opacity = local * 0.5;
    });

    // cámara: leve acercamiento + órbita continua atada al progreso de scroll
    if (group.current) {
      group.current.rotation.y = p * 0.5 + Math.sin(t * 0.15) * 0.03;
    }
  });

  return (
    <group ref={group}>
      {/* panel central */}
      <group ref={hubRef} position={[0, 0.35, -0.3]}>
        <mesh>
          <planeGeometry args={[2.4, 1.4]} />
          <meshBasicMaterial color="#0f1b2e" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(2.4, 1.4)]} />
          <lineBasicMaterial color="#3B82F6" transparent opacity={0.9} />
        </lineSegments>
        {/* líneas internas tipo "grid de datos" */}
        {[-0.7, -0.35, 0, 0.35, 0.7].map((y, i) => (
          <lineSegments key={i} position={[0, y, 0.01]}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([-1.1, 0, 0, 1.1, 0, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#3B82F6" transparent opacity={0.15} />
          </lineSegments>
        ))}
      </group>

      {/* barras de datos, ancladas debajo del panel */}
      <group position={[0, 0, 0.55]}>
        {barData.map((b, i) => (
          <mesh
            key={i}
            ref={(el) => { barRefs.current[i] = el; }}
            position={[b.x, -0.55, 0]}
            scale={[1, 0.001, 1]}
          >
            <boxGeometry args={[0.16, 1, 0.16]} />
            <meshStandardMaterial color="#3B82F6" emissive="#1d4ed8" emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>

      {/* tarjetas de estado */}
      {cardData.map((c, i) => (
        <group key={i} ref={(el) => { cardRefs.current[i] = el; }} position={c.start}>
          <mesh>
            <planeGeometry args={[0.85, 0.5]} />
            <meshBasicMaterial color="#132339" transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(0.85, 0.5)]} />
            <lineBasicMaterial color="#60A5FA" transparent opacity={0.9} />
          </lineSegments>
        </group>
      ))}

      {/* líneas de conexión tarjeta -> panel central */}
      {cardData.map((c, i) => (
        <lineSegments key={`ln-${i}`} ref={(el) => { lineRefs.current[i] = el as any; }}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0.35, -0.3, c.target.x, c.target.y, c.target.z]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#3B82F6" transparent opacity={0} />
        </lineSegments>
      ))}
    </group>
  );
}

export default function DashboardScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(containerRef);

  return (
    <div ref={containerRef} className="relative w-full h-[340px] md:h-[440px] pointer-events-none">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 72%)" }}
      />
      <Canvas
        camera={{ position: [0, 0.6, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <DashboardRig progress={progress} />
      </Canvas>
    </div>
  );
}
