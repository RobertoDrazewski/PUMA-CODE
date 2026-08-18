"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export type RevealVariant = "tilt" | "slideBlur" | "scaleGlow" | "flip" | "scan";

/**
 * Reveal — como Card3D, pero con varias "personalidades" de entrada.
 * Envuelve el contenido real (no inventa geometría) y lo anima una sola
 * vez cuando entra en pantalla al scrollear, vía IntersectionObserver + GSAP.
 *
 * Variantes:
 *  - tilt:      rotación 3D hacia arriba (la que ya usa "Proceso").
 *  - slideBlur: entra desde el costado, de borroso a nítido. Ideal para
 *               grillas densas (Soluciones) — da sensación de "enfoque".
 *  - scaleGlow: crece desde chico y oscuro hasta su tamaño con un rebote
 *               sutil. Pensada para las tarjetas de IA — se siente "viva".
 *  - flip:      gira sobre el eje Y como una placa que se voltea. Para
 *               Industrias/IoT — evoca un panel físico encendiéndose.
 *  - scan:      barrido tipo escáner de seguridad (de abajo hacia arriba
 *               revelando el contenido). Pensada para Ciberseguridad.
 */
export default function Reveal({
  children,
  delay = 0,
  variant = "tilt",
  direction = "left",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: RevealVariant;
  direction?: "left" | "right";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, {
      transformPerspective: 900,
      transformOrigin: variant === "flip" ? (direction === "left" ? "0% 50%" : "100% 50%") : "50% 100%",
    });

    let fromVars: gsap.TweenVars;
    let toVars: gsap.TweenVars;

    switch (variant) {
      case "slideBlur":
        fromVars = { x: direction === "left" ? -70 : 70, opacity: 0, filter: "blur(12px)" };
        toVars = { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" };
        break;
      case "scaleGlow":
        fromVars = { scale: 0.8, opacity: 0, filter: "brightness(0.35) saturate(0.6)" };
        toVars = { scale: 1, opacity: 1, filter: "brightness(1) saturate(1)", duration: 0.75, ease: "back.out(1.6)" };
        break;
      case "flip":
        fromVars = { rotateY: direction === "left" ? -75 : 75, opacity: 0 };
        toVars = { rotateY: 0, opacity: 1, duration: 0.9, ease: "power3.out" };
        break;
      case "scan":
        // Antes usaba clip-path para simular un barrido, pero podía quedar
        // trabado invisible si la propiedad no se revertía a tiempo.
        // Este "unfurl" (se despliega desde arriba) da la misma sensación
        // de escaneo con transform/opacity nomás — siempre reversible.
        fromVars = { scaleY: 0.85, y: -24, opacity: 0, transformOrigin: "50% 0%" };
        toVars = { scaleY: 1, y: 0, opacity: 1, duration: 0.7, ease: "power2.out" };
        break;
      case "tilt":
      default:
        fromVars = { rotateX: -25, y: 50, z: -80, opacity: 0 };
        toVars = { rotateX: 0, y: 0, z: 0, opacity: 1, duration: 0.8, ease: "power2.out" };
        break;
    }

    gsap.set(el, fromVars);

    // rootMargin negativo abajo: el disparo ocurre un poco ANTES de que la
    // tarjeta termine de entrar, así el movimiento se alcanza a ver en vez
    // de completarse ya con la tarjeta casi visible del todo.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          gsap.to(el, { ...toVars, delay });
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);

    // Fallback: si el elemento ya está visible en el momento del montaje
    // (por ejemplo, secciones altas o navegación directa por el menú),
    // el observer puede no disparar de forma perceptible — chequeamos una
    // vez a mano.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      gsap.to(el, { ...toVars, delay: delay + 0.05 });
      io.disconnect();
    }

    return () => io.disconnect();
  }, [delay, variant, direction]);

  return (
    <div ref={ref} className={`h-full ${className}`} style={{ willChange: "transform, opacity, filter" }}>
      {children}
    </div>
  );
}
