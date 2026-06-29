"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

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
  const [isOpen, setIsOpen] = useState(false);        // selector de idiomas
  const [menuOpen, setMenuOpen] = useState(false);    // menú móvil
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloquea el scroll del fondo mientras el menú móvil está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  // Cada item del navbar abre una VISTA (no hace scroll)
  const navItems = [
    { id: 'home',       label: t.nav_home },
    { id: 'process',    label: t.nav_process },
    { id: 'services',   label: t.nav_services },
    { id: 'express',    label: t.nav_express },
    { id: 'industries', label: t.nav_industries },
    { id: 'security',   label: t.nav_security },
    { id: 'cases',      label: t.nav_cases },
    { id: 'contact',    label: t.nav_contact },
  ];

  const go = (id: string) => {
    onNavigate?.(id);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'pt-4' : 'pt-0'}`}>
        <div className={`max-w-7xl mx-auto px-6 h-20 md:h-24 flex justify-between items-center transition-all duration-500
          ${scrolled ? 'glass-effect rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/5 mx-4 md:mx-auto' : 'bg-transparent border-b border-white/5'}`}>

          {/* LOGO PUMA CODE */}
          <button
            type="button"
            className="flex items-center cursor-pointer group bg-transparent border-0 p-0"
            onClick={() => go('home')}
            aria-label="Puma Code — Inicio"
          >
            <div className="relative transition-transform duration-500 group-hover:scale-105">
              <Image
                src="/logo-puma.png"
                alt="Puma Code Logo"
                width={330}
                height={120}
                style={{ width: 'auto', height: 'auto' }}
                className="h-8 w-auto md:h-12 object-contain block drop-shadow-[0_0_8px_rgba(37,99,235,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                priority
              />
            </div>
          </button>

          {/* LINKS DE ESCRITORIO (cambian de vista) */}
          <div className="hidden xl:flex items-center gap-9">
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={`relative text-[10px] font-black uppercase tracking-[0.3em] transition-all group bg-transparent border-0 cursor-pointer
                    ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-[1px] bg-blue-500 transition-all duration-300 shadow-[0_0_8px_#2563eb]
                      ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}
                  ></span>
                </button>
              );
            })}
          </div>

          {/* CONTROLES DERECHA: idioma + hamburguesa (móvil) */}
          <div className="flex items-center gap-3">
            {/* SELECTOR DE IDIOMAS */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-white/5 hover:bg-blue-600/10 px-4 py-2 rounded-full border border-white/10 transition-all group active:scale-90"
              >
                <span className="text-xl filter drop-shadow-md group-hover:scale-110 transition-transform">{currentLang.flag}</span>
                <span className="text-white text-[10px] font-black uppercase hidden sm:inline tracking-widest">{currentLang.code}</span>
                <svg
                  className={`w-3 h-3 text-blue-500 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
                  <div className="absolute right-0 mt-4 w-56 glass-effect rounded-2xl border-blue-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 grid grid-cols-1">
                      <div className="px-3 py-2 text-[9px] font-bold text-blue-500/50 uppercase tracking-[0.2em] mb-1">System Interface</div>
                      {languages.map((l) => (
                        <button
                          key={l.code}
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

            {/* ACCESO AL PANEL ADMIN */}
            <a
              href="/admin"
              aria-label="Acceso al panel de administración"
              title="Panel de administración"
              className="flex items-center gap-2 bg-white/5 hover:bg-blue-600/10 px-3 sm:px-4 py-2 rounded-full border border-white/10 transition-all group active:scale-90"
            >
              <svg
                className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform"
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0v4" />
              </svg>
              <span className="text-white text-[10px] font-black uppercase hidden sm:inline tracking-widest">Admin</span>
            </a>

            {/* HAMBURGUESA (visible debajo de xl) */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="xl:hidden flex items-center justify-center w-11 h-11 rounded-full bg-white/5 border border-white/10 hover:bg-blue-600/10 active:scale-90 transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* MENÚ MÓVIL A PANTALLA COMPLETA */}
      {menuOpen && (
        <div className="mobile-menu xl:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            className="absolute top-6 right-6 flex items-center justify-center w-11 h-11 rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={`mobile-link ${active ? 'is-active' : ''}`}
                >
                  {item.label}
                  {active && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#2563eb]" />}
                </button>
              );
            })}

            {/* ACCESO AL PANEL ADMIN (móvil) */}
            <a
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="mobile-link flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0v4" />
              </svg>
              Admin
            </a>
          </div>
        </div>
      )}
    </>
  );
}
