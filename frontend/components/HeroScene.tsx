"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOGO_POINTS } from "../lib/pumaLogoPoints";

/**
 * HeroScene — cabeza de Puma Code armándose con caracteres de código.
 *
 * Cómo funciona:
 * - LOGO_POINTS son ~840 puntos muestreados píxel a píxel de /public/logotrans.png
 *   (posición + color real del logo), ahora en lib/pumaLogoPoints.ts para
 *   compartirlos con PumaFace (la cabeza del asistente de voz del panel).
 * - Cada punto es una partícula (sprite) con un glyph de código random
 *   (0 1 { } < > / ; #) que arranca dispersa y converge hacia su posición
 *   real del logo, coloreada con el color exacto de esa zona del logo.
 * - Al asentarse, algunos glyphs titilan cambiando de carácter (efecto matrix).
 * - La cámara tiene un parallax sutil siguiendo el mouse.
 *
 * Próximo paso (fase 2, pendiente del video): cuando tengamos el clip del
 * puma corriendo, se agrega como capa de video detrás de este canvas y el
 * "burst" inicial de las partículas se sincroniza con el salto del puma.
 */

const GLYPHS = ["0", "1", "{", "}", "<", ">", "/", ";", "#", "+"];
const SCENE_SCALE = 1.7; // tamaño del logo dentro de su propio contenedor
const ASSEMBLE_DELAY = 0.15;   // segundos antes de arrancar
const BURST_DURATION = 0.35;   // fase de estallido hacia afuera
const CONVERGE_DURATION = 1.1; // fase de convergencia al logo
const SETTLED_OPACITY = 0.95;  // protagonista: vívido, no compite con nada detrás
const REVEAL_DELAY = 0.25;     // pausa breve mostrando el logo de caracteres
const REVEAL_DURATION = 0.6;   // duración del crossfade caracteres -> logo real
const REVEAL_START = ASSEMBLE_DELAY + BURST_DURATION + CONVERGE_DURATION + REVEAL_DELAY;
// Proporción real de /public/assets/images/puma-hero-icon.png tras recortar
// el margen transparente (521x537px, usando el canal alfa con umbral real
// para ignorar ruido de anti-aliasing) — la nube de puntos fue muestreada
// de este mismo recorte, así que calzan exacto.
const IMAGE_ASPECT = 521 / 537;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function buildGlyphTexture(ch: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 46px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ch, 32, 36);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

type Particle = {
  sprite: THREE.Sprite;
  start: THREE.Vector3;
  burstEnd: THREE.Vector3;
  target: THREE.Vector3;
  offset: number;
};

function ParticleLogo() {
  const group = useRef<THREE.Group>(null!);
  const particles = useRef<Particle[]>([]);
  const glyphTextures = useRef<Record<string, THREE.CanvasTexture>>({});
  const settled = useRef(false);

  useEffect(() => {
    GLYPHS.forEach((ch) => {
      glyphTextures.current[ch] = buildGlyphTexture(ch);
    });

    const list: Particle[] = [];
    LOGO_POINTS.forEach((p) => {
      const target = new THREE.Vector3(
        p.x * SCENE_SCALE,
        p.y * SCENE_SCALE + 0.3,
        (Math.random() - 0.5) * 0.6
      );
      // Arrancan dispersos por TODA la pantalla (más allá de los bordes
      // visibles de la cámara), no en una cajita chica cerca del centro.
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 5.2, // ancho de sobra respecto al frustum visible (~±1.35)
        (Math.random() - 0.5) * 5.2,
        (Math.random() - 0.5) * 1.8 - 0.4 // leve profundidad, no domina el movimiento
      );
      const dir = start.clone().normalize();
      const burstEnd = start.clone().lerp(new THREE.Vector3(0, 0.3, 0), 0.12);

      const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const mat = new THREE.SpriteMaterial({
        map: glyphTextures.current[ch],
        color: new THREE.Color(p.c),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const s = 0.07 + Math.random() * 0.03;
      sprite.scale.set(s, s, 1);
      sprite.position.copy(start);
      group.current.add(sprite);

      list.push({ sprite, start, burstEnd, target, offset: Math.random() * 0.18 });
    });
    particles.current = list;

    return () => {
      list.forEach((p) => {
        group.current?.remove(p.sprite);
        p.sprite.material.dispose();
      });
      Object.values(glyphTextures.current).forEach((t) => t.dispose());
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const elapsed = Math.max(0, t - ASSEMBLE_DELAY);
    const totalDuration = BURST_DURATION + CONVERGE_DURATION;

    particles.current.forEach((pt) => {
      const localElapsed = Math.max(0, elapsed - pt.offset);
      const localProgress = clamp01(localElapsed / (totalDuration - pt.offset || 1));

      if (localProgress < BURST_DURATION / totalDuration) {
        const bt = easeOutCubic(localProgress / (BURST_DURATION / totalDuration));
        pt.sprite.position.lerpVectors(pt.start, pt.burstEnd, bt);
        pt.sprite.material.opacity = Math.min(1, bt * 2.2);
      } else {
        const ct = easeInOutQuad(
          (localProgress - BURST_DURATION / totalDuration) / (CONVERGE_DURATION / totalDuration)
        );
        pt.sprite.position.lerpVectors(pt.burstEnd, pt.target, ct);
        pt.sprite.material.opacity = 1;

        if (ct >= 1) {
          if (!settled.current) settled.current = true;
          const revealElapsed = t - REVEAL_START;
          if (revealElapsed > 0) {
            // Se está disolviendo hacia el logo real nítido: baja opacidad.
            const fade = clamp01(revealElapsed / REVEAL_DURATION);
            pt.sprite.material.opacity = SETTLED_OPACITY * (1 - fade);
          } else {
            // Ya asentado, todavía mostrando el mosaico de caracteres:
            // fijo y nítido, con un titileo muy ocasional (efecto matrix).
            pt.sprite.material.opacity = SETTLED_OPACITY;
            if (Math.random() < 0.0006) {
              const newCh = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              pt.sprite.material.map = glyphTextures.current[newCh];
              pt.sprite.material.needsUpdate = true;
            }
          }
        }
      }
    });

    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.15) * 0.018;
      group.current.rotation.x = Math.sin(t * 0.12) * 0.009;
    }
  });

  return <group ref={group} />;
}

function CrispLogoReveal() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/assets/images/puma-hero-icon.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = tex;
      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshBasicMaterial;
        mat.map = tex;
        mat.needsUpdate = true;
      }
    });
    return () => {
      textureRef.current?.dispose();
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const revealElapsed = t - REVEAL_START;
    const opacity = clamp01(revealElapsed / REVEAL_DURATION);
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity;
      // sutil respiración una vez visible, igual que el resto del hero
      const breathe = 1 + (opacity >= 1 ? Math.sin(t * 1.1) * 0.01 : 0);
      meshRef.current.scale.set(breathe, breathe, 1);
    }
  });

  const height = SCENE_SCALE;
  const width = SCENE_SCALE * IMAGE_ASPECT;

  return (
    <mesh ref={meshRef} position={[0, 0.3, 0.02]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function ParallaxRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.04;
    camera.position.y += (pointer.y * 0.25 - camera.position.y) * 0.04;
    camera.lookAt(0, 0.25, 0);
  });
  return null;
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Resplandor ambiental cálido detrás de la cabeza — rompe el genérico
          "azul sobre negro" y hace juego con el pelaje del puma real */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(217,162,83,0.35) 0%, rgba(79,168,232,0.18) 55%, transparent 75%)' }}
      />
      <Canvas
        camera={{ position: [0, 0.25, 3.6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          // Fondo 100% transparente desde el primer frame: evita cualquier
          // flash blanco/negro mientras carga la textura del logo.
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ParallaxRig />
        <ParticleLogo />
        <CrispLogoReveal />
      </Canvas>
    </div>
  );
}
