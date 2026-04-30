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

export default function Navbar({ lang, setLang, t }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'pt-4' : 'pt-0'}`}>
      <div className={`max-w-7xl mx-auto px-6 h-20 md:h-24 flex justify-between items-center transition-all duration-500 
        ${scrolled ? 'glass-effect rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/5 mx-4 md:mx-auto' : 'bg-transparent border-b border-white/5'}`}>
        
        {/* LOGO PUMA CODE - FIX ASPECT RATIO */}
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="relative transition-transform duration-500 group-hover:scale-105">
            <Image 
              src="/logo-puma.png" 
              alt="Puma Code Logo"
              width={330} // Definir ancho base
              height={120} // Definir alto base para calcular el ratio
              style={{ width: 'auto', height: 'auto' }} // Solución al error de ratio
              className="h-8 w-auto md:h-12 object-contain block drop-shadow-[0_0_8px_rgba(37,99,235,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]"
              priority
            />
          </div>
        </div>

        {/* LINKS (High-Tech Style) */}
        <div className="hidden xl:flex items-center gap-10">
          {[
            { label: t.nav_home, href: "#" },
            { label: t.nav_services, href: "#services" },
            { label: t.nav_contact, href: "#contact" }
          ].map((link, i) => (
            <a 
              key={i}
              href={link.href} 
              className="relative text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white transition-all group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-blue-500 transition-all duration-300 group-hover:w-full group-hover:shadow-[0_0_8px_#2563eb]"></span>
            </a>
          ))}
        </div>

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

          {/* MENÚ DESPLEGABLE (Cyber-Panel) */}
          {isOpen && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
              <div className="absolute right-0 mt-4 w-56 glass-effect rounded-2xl border-blue-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 grid grid-cols-1">
                  <div className="px-3 py-2 text-[9px] font-bold text-blue-500/50 uppercase tracking-[0.2em] mb-1">System Interface</div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setIsOpen(false);
                      }}
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
      </div>
    </nav>
  );
}