"use client";
import React, { useState, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { Globe, Settings, Gem, Zap, Cpu, Shield, Star, MessageCircle } from './Icons';

const languages = [
  { code: 'es', flag: '🇦🇷', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'ca', flag: '🚩', label: 'Català' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'pl', flag: '🇵🇱', label: 'Polski' },
  { code: 'sv', flag: '🇸🇪', label: 'Svenska' },
  { code: 'no', flag: '🇳🇴', label: 'Norsk' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
];

export default function Navbar({ lang, setLang, t, activeView = 'home', onNavigate }: any) {
  const [isOpen, setIsOpen] = useState(false); // selector de idiomas
  const navRef = useRef<HTMLElement>(null);

  // Mide la altura real del navbar (logo + fila de botones) y se la pasa
  // a --nav-h para que .view-shell reserve exactamente ese espacio.
  // El navbar es siempre fijo y sólido: el contenido del body simplemente
  // scrollea por detrás y queda tapado de forma limpia, sin transparencia.
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`);
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

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  // Cada item abre una VISTA (no hace scroll). Ícono propio por sección.
  const navItems = [
    { id: 'home',       label: t.nav_home,       icon: Globe },
    { id: 'process',    label: t.nav_process,    icon: Settings },
    { id: 'services',   label: t.nav_services,   icon: Gem },
    { id: 'express',    label: t.nav_express,    icon: Zap },
    { id: 'industries', label: t.nav_industries, icon: Cpu },
    { id: 'security',   label: t.nav_security,   icon: Shield },
    { id: 'cases',      label: t.nav_cases,      icon: Star },
    { id: 'contact',    label: t.nav_contact,    icon: MessageCircle },
  ];

  const go = (id: string) => {
    onNavigate?.(id);
    setIsOpen(false);
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 w-full z-50 shadow-[0_10px_25px_rgba(0,0,0,0.45)]"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* ===================== LOGO — fijo siempre, sólido, protagonista ===================== */}
      <div className="relative">
        {/* Idioma + admin: flotando en la esquina, sobre la fila del logo,
            sin ocupar su propia fila (así no suman altura extra) */}
        <div className="absolute right-3 xl:right-6 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
          <LanguageSelector isOpen={isOpen} setIsOpen={setIsOpen} currentLang={currentLang} lang={lang} setLang={setLang} />
          <a
            href="/admin"
            aria-label="Acceso al panel de administración"
            title="Panel de administración"
            className="h-9 w-9 xl:h-10 xl:w-10 flex items-center justify-center bg-white/5 hover:bg-blue-600/10 rounded-full border border-white/10 transition-all active:scale-90 group"
          >
            <AdminIcon className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </a>
        </div>

        {/* Logo — a todo el ancho, única fila (ya no hay margen extra arriba) */}
        <button
          type="button"
          onClick={() => go('home')}
          aria-label="Puma Code — Inicio"
          className="w-full flex items-center justify-center py-3 xl:py-4 bg-transparent border-0 cursor-pointer group"
        >
          <div className="relative transition-transform duration-500 group-hover:scale-105">
            <Image
              src="/logo-puma.png"
              alt="Puma Code Logo"
              width={330}
              height={120}
              // Sin "style" acá: un style inline pisa las clases de Tailwind
              // (h-9/xl:h-14) sin importar su especificidad, así que el logo
              // terminaba renderizando a su tamaño natural en vez del que
              // pedían las clases. Dejamos que h-9/xl:h-14 + w-auto controlen
              // el tamaño real, con proporción automática.
              className="h-9 xl:h-14 w-auto object-contain block drop-shadow-[0_0_8px_rgba(37,99,235,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]"
              priority
            />
          </div>
        </button>
      </div>

      {/* ===================== BOTONES — uno al lado del otro, debajo del logo, siempre visibles ===================== */}
      <div className="px-3 xl:px-6 pb-3">
        <div className="grid grid-cols-4 gap-2 xl:flex xl:flex-nowrap xl:items-center xl:justify-center xl:gap-2 max-w-6xl xl:mx-auto">
          {navItems.map((item) => {
            const active = activeView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`flex flex-col xl:flex-row items-center justify-center gap-1.5 xl:gap-2 h-[72px] xl:h-11 px-1 xl:px-5 rounded-2xl xl:rounded-full border whitespace-nowrap transition-all duration-300 active:scale-90 cursor-pointer
                  ${active
                    ? 'bg-blue-600/25 border-blue-500/50 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                    : 'bg-white/[0.06] border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
              >
                <Icon className={`w-5 h-5 xl:w-3.5 xl:h-3.5 shrink-0 ${active ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className="text-[8.5px] xl:text-[10px] font-black uppercase tracking-tight xl:tracking-[0.2em] leading-[1.1] text-center xl:text-left line-clamp-2 xl:line-clamp-1 px-0.5 xl:px-0">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ---------- Selector de idiomas (compacto, siempre en la esquina) ---------- */
function LanguageSelector({ isOpen, setIsOpen, currentLang, lang, setLang }: any) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 xl:h-10 xl:w-10 flex items-center justify-center bg-white/5 hover:bg-blue-600/10 rounded-full border border-white/10 transition-all group active:scale-90"
      >
        <span className="text-base xl:text-lg filter drop-shadow-md group-hover:scale-110 transition-transform">
          {currentLang.flag}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-3 w-56 glass-effect rounded-2xl border-blue-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 grid grid-cols-1">
              <div className="px-3 py-2 text-[9px] font-bold text-blue-500/50 uppercase tracking-[0.2em] mb-1">System Interface</div>
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { setLang(l.code); setIsOpen(false); }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    lang === l.code
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{l.flag}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider">{l.label}</span>
                  </div>
                  {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#2563eb]"></div>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Ícono de admin (inline) ---------- */
const AdminIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0v4" />
  </svg>
);
