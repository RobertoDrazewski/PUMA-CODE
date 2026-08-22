"use client";

/**
 * PumaFace — el logo real de Puma Code (/public/logotrans.png), con un
 * halo de color detrás que cambia según el estado del asistente.
 *
 * Probamos antes con la nube de partículas del Hero, pero a este tamaño
 * (un ícono chico) se ve como ruido borroso, no como el logo — así que
 * acá va la imagen real, nítida, con el glow SIEMPRE detrás de ella
 * (nunca tapándola).
 */

export type PumaFaceState = "idle" | "listening" | "thinking" | "speaking";

const GLOW_COLOR: Record<PumaFaceState, string> = {
  idle: "rgba(6,238,255,0.65)",       // cian — reposo
  listening: "rgba(37,99,235,0.7)",   // azul — escuchando
  thinking: "rgba(139,92,246,0.7)",   // violeta — pensando
  speaking: "rgba(217,162,83,0.7)",   // ámbar — hablando
};

const PULSE_CLASS: Record<PumaFaceState, string> = {
  idle: "puma-pulse-idle",
  listening: "puma-pulse-fast",
  thinking: "puma-pulse-thinking",
  speaking: "puma-pulse-fast",
};

export default function PumaFace({ state = "idle" }: { state?: PumaFaceState }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Halo — bien atrás, bien grande, se lo deja "sangrar" fuera del ícono. */}
      <div
        className={`absolute w-[220%] h-[220%] rounded-full blur-2xl transition-colors duration-500 ${PULSE_CLASS[state]}`}
        style={{ background: `radial-gradient(circle, ${GLOW_COLOR[state]} 0%, transparent 65%)`, zIndex: 0 }}
      />
      {/* El logo, nítido, arriba de todo. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logotrans.png"
        alt="Puma"
        className="relative w-[78%] h-[78%] object-contain drop-shadow-lg"
        style={{ zIndex: 1 }}
        draggable={false}
      />
    </div>
  );
}
