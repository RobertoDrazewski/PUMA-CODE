"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// El motor 3D solo corre en el cliente.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/**
 * HeroIntro — la secuencia completa que pediste:
 *
 *  1) Se reproduce el video real del puma corriendo en la nieve, con el
 *     código lloviendo encima (recortado justo hasta el instante del salto).
 *  2) En el momento exacto del salto (~3.15s) hay un flash blanco y el video
 *     se apaga.
 *  3) Entra <HeroScene />: las partículas de código retoman el estallido y
 *     convergen hasta armar tu logo real (cabeza del puma), coloreado con
 *     los colores exactos de /public/logotrans.png.
 *
 * Si el navegador bloquea el autoplay del video (pasa en algunos entornos),
 * hay una red de seguridad: a los 6s, si el video nunca arrancó, se pasa
 * igual a la fase de partículas para que el hero nunca quede vacío.
 */
export default function HeroIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"video" | "particles">("video");
  const [flash, setFlash] = useState(false);
  const advancedRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const advance = () => {
      if (advancedRef.current) return;
      advancedRef.current = true;
      setFlash(true);
      setTimeout(() => setFlash(false), 260);
      setPhase("particles");
    };

    const onTimeUpdate = () => {
      if (v.currentTime >= 3.15) advance();
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", advance);
    v.addEventListener("error", advance);

    v.play().catch(() => {
      /* autoplay bloqueado: la red de seguridad de abajo se encarga */
    });

    const safety = setTimeout(advance, 6000);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", advance);
      v.removeEventListener("error", advance);
      clearTimeout(safety);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {phase === "video" && (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            preload="auto"
            className="absolute top-1/2 left-1/2 w-[130%] h-[130%] -translate-x-1/2 -translate-y-1/2 object-cover"
            style={{ filter: "saturate(1.05) contrast(1.05) brightness(0.95)" }}
          >
            <source src="/assets/videos/puma-run.mp4" type="video/mp4" />
          </video>
          {/* vi\u00f1eta: funde los bordes del video con el fondo negro del hero
              y de paso tapa las marcas de agua de las esquinas */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.95) 100%)",
            }}
          />
        </div>
      )}

      {phase === "particles" && <HeroScene />}

      <div
        className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-300"
        style={{ opacity: flash ? 0.95 : 0 }}
      />
    </div>
  );
}
