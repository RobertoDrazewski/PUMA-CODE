"use client";
import React from 'react';
import Image from 'next/image';

const languages = [
  { code: 'es', flag: '🇦🇷', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
];

export default function Navbar({ lang, setLang, t }: any) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      {/* Aumentamos la altura de h-20 a h-28 para dar espacio al logo 1.5x más grande */}
      <div className="max-w-7xl mx-auto px-6 h-28 flex justify-between items-center">
        
        {/* LOGO PUMA CODE: AGRANDADO Y CON PROTECCIÓN DE LÍNEA */}
        <div 
          className="flex items-center cursor-pointer group bg-transparent py-4" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="transition-transform duration-300 group-hover:scale-105">
            <Image 
              src="/logo-puma.png" 
              alt="Puma Code Logo"
              // Dimensiones base aumentadas para evitar el error de Next.js
              width={450} 
              height={120} 
              // w-[270px] es 1.5x de los 180px originales | md:w-[330px] es 1.5x de los 220px originales
              className="h-auto w-[270px] md:w-[330px] object-contain block drop-shadow-[0_0_15px_rgba(37,99,235,0.2)]"
              priority
            />
          </div>
        </div>

        {/* LINKS (Adaptado el margen superior por la nueva altura) */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-gray-400">
          <a href="#" className="hover:text-blue-400 transition-colors tracking-[0.2em]">
            {t.nav_home}
          </a>
          <a href="#services" className="hover:text-blue-400 transition-colors tracking-[0.2em]">
            {t.nav_services}
          </a>
          <a href="#contact" className="hover:text-blue-400 transition-colors tracking-[0.2em]">
            {t.nav_contact}
          </a>
        </div>

        {/* BANDERAS */}
        <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/10 shadow-inner">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-lg transition-all duration-300 ${
                lang === l.code 
                  ? 'bg-blue-600/30 border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.3)] scale-110' 
                  : 'grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
              }`}
              title={l.label}
            >
              {l.flag}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}