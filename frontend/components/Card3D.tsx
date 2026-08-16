"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Card3D — envuelve CUALQUIER tarjeta real (ícono, título, texto) y la
 * anima con una rotación/profundidad 3D de verdad (perspective + rotateX
 * + translateZ vía CSS, acelerado por GPU) la primera vez que entra en
 * pantalla al scrollear. No inventa geometría aparte: el contenido que se
 * mueve es el contenido real.
 */
export default function Card3D({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { transformPerspective: 900, transformOrigin: "50% 100%", opacity: 0 });

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          gsap.fromTo(
            el,
            { rotateX: -25, y: 40, z: -80, opacity: 0 },
            {
              rotateX: 0,
              y: 0,
              z: 0,
              opacity: 1,
              duration: 0.7,
              delay,
              ease: "power2.out",
            }
          );
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`h-full ${className}`} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}
