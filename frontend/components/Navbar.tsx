"use client";
import React, { useState } from 'react';
import Image from 'next/image';

const languages = [
  { code: 'es', flag: '🇦🇷', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'pl', flag: '🇵🇱', label: 'Polski' },
  { code: 'sv', flag: '🇸🇪', label: 'Svenska' },
  { code: 'no', flag: '🇳🇴', label: 'Norsk' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
];

export default function Navbar({ lang, setLang, t }: any) {
  const [isOpen, setIsOpen] = useState(false);

  // Encontrar la bandera del idioma seleccionado
  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-28 flex justify-between items-center">
        
        {/* LOGO PUMA CODE */}
        <div 
          className="flex items-center cursor-pointer group bg-transparent py-4" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="transition-transform duration-300 group-hover:scale-105">
            <Image 
              src="/logo-puma.png" 
              alt="Puma Code Logo"
              width={450} 
              height={120} 
              className="h-auto w-[240px] md:w-[330px] object-contain block drop-shadow-[0_0_15px_rgba(37,99,235,0.2)]"
              priority
            />
          </div>
        </div>

        {/* LINKS (Escritorio) */}
        <div className="hidden xl:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-gray-400">
          <a href="#" className="hover:text-blue-400 transition-colors tracking-[0.2em]">{t.nav_home}</a>
          <a href="#services" className="hover:text-blue-400 transition-colors tracking-[0.2em]">{t.nav_services}</a>
          <a href="#contact" className="hover:text-blue-400 transition-colors tracking-[0.2em]">{t.nav_contact}</a>
        </div>

        {/* SELECTOR DE IDIOMAS (Dropdown) */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all shadow-lg active:scale-95"
          >
            <span className="text-xl">{currentLang.flag}</span>
            <span className="text-white text-xs font-bold uppercase hidden sm:inline">{currentLang.code}</span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Menú Desplegable con efecto Blur */}
          {isOpen && (
            <>
              {/* Fondo invisible para cerrar al hacer clic fuera */}
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
              
              <div className="absolute right-0 mt-3 w-48 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="grid grid-cols-1 p-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        lang === l.code 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{l.flag}</span>
                      <span className="text-sm font-medium">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}