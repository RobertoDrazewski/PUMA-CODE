"use client";
import React, { useLayoutEffect, useRef } from 'react';

/* Footer global, fijo abajo del todo, visible en cualquier vista (no solo
   en Contacto). Mide su propia altura y la publica en --footer-h para que
   .view-shell reserve el espacio justo, igual que hace el navbar con
   --nav-h — así nunca tapa el último bloque de contenido. */
export default function Footer({ t }: any) {
  const footerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty('--footer-h', `${el.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <footer
      ref={footerRef}
      className="fixed bottom-0 w-full z-40 border-t border-white/5"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-3.5 flex flex-col md:flex-row items-center justify-between gap-1.5 md:gap-4 text-gray-600 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-center">
        <span>{t?.footer_engine || 'PUMA CODE ENGINE v2.0'}</span>
        <span className="hidden sm:inline">{t?.footer_location || 'MENDOZA, ARGENTINA · WORLDWIDE SERVICE'}</span>
        <span>© {new Date().getFullYear()} Puma Code</span>
      </div>
    </footer>
  );
}
