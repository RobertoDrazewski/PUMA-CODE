"use client";

import { useState } from 'react';
import Navbar from '../components/Navbar';
import AIChat from '../components/AIChat';
import { translations } from '../constants/translations';

export default function Home() {
  const [lang, setLang] = useState('es');
  const [showChat, setShowChat] = useState(false);
  
  const t = translations[lang] || translations['es'];

  // Definimos los iconos para que no se pierdan
  const serviceIcons = ["🌐", "📱", "📡", "🧠", "🤖", "💎"];

  return (
    <main className="relative min-h-screen bg-black text-white overflow-x-hidden flex flex-col selection:bg-blue-500/30">
      
      <Navbar lang={lang} setLang={setLang} t={t} />

      {/* FONDO DECORATIVO - ESTILO PUMA */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -z-10" />

      {/* --- SECCIÓN HERO --- */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 pt-32 text-center">
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="mb-6 inline-block px-4 py-1.5 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase">
            {t.hero_badge}
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent">
            {t.hero_title}
          </h1>
          
          <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed mb-12">
            {t.hero_subtitle}
          </p>

          <button 
            onClick={() => setShowChat(true)}
            className="px-12 py-5 bg-blue-600 rounded-full hover:bg-blue-500 transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.4)] font-black text-xl active:scale-95 flex items-center gap-3 mx-auto"
          >
            {t.chat_button_start}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </button>
        </div>
      </section>

      {/* --- SECCIÓN DE SERVICIOS (Estilo Recuperado) --- */}
      <section id="services" className="py-32 px-6 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">{t.services_title}</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.services_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((num, index) => (
            <div 
              key={num} 
              className="group p-10 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-3"
            >
              <div className="text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">
                {serviceIcons[index]}
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                {t[`s${num}_title`]}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {t[`s${num}_desc`]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECCIÓN DE CONTACTO (LinkedIn y Email) --- */}
      <section id="contact" className="py-32 px-6 bg-gradient-to-t from-blue-900/10 to-black border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter">
            {t.contact_title}
          </h2>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            {/* Email Button */}
            <a href="mailto:info@puma-code.com" className="group flex items-center gap-4 px-10 py-5 bg-white text-black font-black rounded-3xl hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-2xl active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {t.contact_btn_mail}
            </a>

            {/* LinkedIn Button */}
            <a href="https://www.linkedin.com/in/robert-drazewski" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-10 py-5 bg-[#0077b5] text-white font-black rounded-3xl hover:bg-[#005582] transition-all duration-500 shadow-2xl active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              {t.contact_btn_linkedin}
            </a>
          </div>

          <div className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            <span>PUMA CODE ENGINE v2.0</span>
            <span>MENDOZA, ARGENTINA • WORLDWIDE SERVICE</span>
            <span>© 2026</span>
          </div>
        </div>
      </section>

      {/* COMPONENTE DE CHAT (CAPA SUPERIOR) */}
      {showChat && (
        <AIChat 
          lang={lang} 
          t={t} 
          onClose={() => setShowChat(false)} 
        />
      )}
    </main>
  );
}