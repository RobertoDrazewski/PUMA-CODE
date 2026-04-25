"use client";

import { useState } from 'react';
import Navbar from '../components/Navbar';
import AIChat from '../components/AIChat';
import { translations } from '../constants/translations';

export default function Home() {
  const [lang, setLang] = useState('es');
  const [showChat, setShowChat] = useState(false);
  
  // Accedemos a las traducciones según el idioma seleccionado
  const t = translations[lang] || translations['es'];

  return (
    <main className="relative min-h-screen bg-black text-white overflow-x-hidden flex flex-col selection:bg-blue-500/30">
      
      {/* NAVBAR CON SELECTOR DE IDIOMAS */}
      <Navbar lang={lang} setLang={setLang} t={t} />

      {/* FONDO DECORATIVO */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -z-10" />

      {/* --- SECCIÓN PRINCIPAL / HERO --- */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 pt-32">
        {!showChat ? (
          <div className="flex flex-col items-center text-center max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="mb-6 px-4 py-1.5 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase">
              {t.hero_badge}
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent">
              {t.hero_title}
            </h1>
            
            <p className="text-gray-400 text-lg md:text-2xl max-w-2xl leading-relaxed mb-12">
              {t.hero_subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => setShowChat(true)}
                className="px-12 py-5 bg-blue-600 rounded-full hover:bg-blue-500 transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.4)] font-black text-xl active:scale-95 flex items-center gap-3"
              >
                {t.chat_button_start}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </button>
            </div>
            
            {/* TECH STACK VISUAL */}
            <div className="mt-24 flex flex-wrap justify-center gap-10 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              {["NEXT.JS", "OPENAI 4o", "NODE.JS", "RESEND"].map((tech) => (
                <div key={tech} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-black tracking-widest">{tech}</span>
                  <div className="h-[1px] w-8 bg-blue-500"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --- MODO CONSULTORÍA (CHAT ACTIVO) --- */
          <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-500 py-10">
            <div className="flex items-center justify-between mb-8 bg-gray-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,1)]"></span>
                  {t.chat_title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{t.chat_welcome.replace("{name}", "")}</p>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                title="Volver"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <AIChat lang={lang} t={t} />
          </div>
        )}
      </section>

      {/* --- SECCIÓN DE SERVICIOS --- */}
      <section id="services" className="py-32 px-6 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">{t.services_title}</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.services_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: t.s1_title, desc: t.s1_desc, icon: "🌐" },
            { title: t.s2_title, desc: t.s2_desc, icon: "📱" },
            { title: t.s3_title, desc: t.s3_desc, icon: "📡" },
            { title: t.s4_title, desc: t.s4_desc, icon: "🧠" },
            { title: t.s5_title, desc: t.s5_desc, icon: "🤖" },
            { title: t.s6_title, desc: t.s6_desc, icon: "💎" },
          ].map((service, index) => (
            <div 
              key={index} 
              className="group p-10 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-3"
            >
              <div className="text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">{service.icon}</div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{service.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECCIÓN DE CONTACTO / FOOTER --- */}
      <section id="contact" className="py-32 px-6 bg-gradient-to-t from-blue-900/10 to-black border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter">
            {t.contact_title}
          </h2>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            {/* Botón Mail */}
            <a 
              href="mailto:info@puma-code.com" 
              className="group flex items-center gap-4 px-10 py-5 bg-white text-black font-black rounded-3xl hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-2xl active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {t.contact_btn_mail}
            </a>

            {/* Botón LinkedIn */}
            <a 
              href="https://www.linkedin.com/in/robert-drazewski" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-4 px-10 py-5 bg-[#0077b5] text-white font-black rounded-3xl hover:bg-[#005582] transition-all duration-500 shadow-2xl active:scale-95"
            >
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
    </main>
  );
}