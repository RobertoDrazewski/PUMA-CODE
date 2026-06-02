"use client";

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AIChat from '../components/AIChat';
import { translations } from '../constants/translations';

/* ---------- Iconos inline reutilizables ---------- */
const Check = () => (
  <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ArrowRight = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);

/* ---------- Tarjeta de servicio (con imagen expandible) ---------- */
const ServiceCard = ({ num, icon, t, fileName }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group p-8 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border transition-all duration-500 cursor-pointer overflow-hidden ${
        isExpanded
          ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_40px_rgba(37,99,235,0.15)]'
          : 'border-white/10 hover:border-blue-500/50 hover:-translate-y-2'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={`text-5xl transition-all duration-500 ${isExpanded ? 'scale-110 grayscale-0' : 'grayscale group-hover:grayscale-0'}`}>
            {icon}
          </div>
          <div className={`text-blue-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>

        <h3 className={`text-2xl font-bold mb-2 transition-colors ${isExpanded ? 'text-blue-400' : 'group-hover:text-blue-400'}`}>
          {t[`s${num}_title`]}
        </h3>

        <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <p className="text-gray-400 leading-relaxed text-sm md:text-base mb-6">
              {t[`s${num}_desc`]}
            </p>

            <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/${fileName}.PNG`}
                alt={t[`s${num}_title`]}
                loading="lazy"
                className="w-full h-auto object-cover transform transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {!isExpanded && (
          <p className="text-gray-400 text-sm leading-relaxed mt-1 line-clamp-2">
            {t[`s${num}_desc`]}
          </p>
        )}
      </div>
    </div>
  );
};

/* ---------- Tarjeta de industria / telemetría ---------- */
const IndustryCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="group relative p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:bg-blue-500/[0.06] hover:border-blue-500/40 transition-all duration-500 overflow-hidden">
    <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      <div className="text-4xl mb-5">{icon}</div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

/* ---------- Componente principal ---------- */
export default function Home() {
  const [lang, setLang] = useState('es');
  const [showChat, setShowChat] = useState(false);

  const t = translations[lang] || translations['es'];

  useEffect(() => {
    document.body.style.overflow = showChat ? 'hidden' : 'unset';
  }, [showChat]);

  const serviceIcons = ["🌐", "📱", "📡", "🧠", "🤖", "💎"];
  const serviceFileNames = [
    "desarrollo-web",
    "apps-nativas",
    "iot-telemetria",
    "ia-machine-learning",
    "optimizacion-eficiencia",
    "qa-calidad",
  ];

  const stats = [
    { v: t.st1_v, l: t.st1_l },
    { v: t.st2_v, l: t.st2_l },
    { v: t.st3_v, l: t.st3_l },
    { v: t.st4_v, l: t.st4_l },
  ];

  const steps = [
    { icon: "💬", title: t.p1_title, desc: t.p1_desc },
    { icon: "🧩", title: t.p2_title, desc: t.p2_desc },
    { icon: "📋", title: t.p3_title, desc: t.p3_desc },
    { icon: "⚙️", title: t.p4_title, desc: t.p4_desc },
  ];

  const industries = [
    { icon: "🍇", title: t.ind1_title, desc: t.ind1_desc },
    { icon: "⛏️", title: t.ind2_title, desc: t.ind2_desc },
    { icon: "🚚", title: t.ind3_title, desc: t.ind3_desc },
    { icon: "📦", title: t.ind4_title, desc: t.ind4_desc },
  ];

  const aiFeatures = [
    { icon: "🤖", title: t.ai_f1_title, desc: t.ai_f1_desc },
    { icon: "📈", title: t.ai_f2_title, desc: t.ai_f2_desc },
    { icon: "⚡", title: t.ai_f3_title, desc: t.ai_f3_desc },
  ];

  const securityFeatures = [
    { icon: "🛡️", title: t.sec_f1_title, desc: t.sec_f1_desc },
    { icon: "🔍", title: t.sec_f2_title, desc: t.sec_f2_desc },
    { icon: "🔐", title: t.sec_f3_title, desc: t.sec_f3_desc },
    { icon: "📑", title: t.sec_f4_title, desc: t.sec_f4_desc },
  ];

  return (
    <main className="relative min-h-screen bg-black text-white overflow-x-hidden flex flex-col selection:bg-blue-500/30 scroll-smooth">
      <Navbar lang={lang} setLang={setLang} t={t} />

      {/* FONDO DECORATIVO */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -z-10" />

      {/* --- HERO --- */}
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setShowChat(true)}
              className="px-10 py-5 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.4)] font-black text-lg active:scale-95 flex items-center gap-3 btn-futuristic"
            >
              {t.chat_button_start}
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#cases"
              className="px-10 py-5 border border-white/15 text-gray-300 rounded-full hover:border-blue-500/50 hover:text-white transition-all duration-300 font-bold text-lg active:scale-95"
            >
              {t.hero_cta_secondary}
            </a>
          </div>

          <p className="mt-10 text-gray-600 text-xs font-bold uppercase tracking-[0.25em]">
            {t.hero_trust}
          </p>
        </div>
      </section>

      {/* --- BARRA DE STATS --- */}
      <div className="w-full border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-futuristic">{s.v}</div>
              <div className="mt-2 text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CÓMO FUNCIONA (vende el chat con IA) --- */}
      <section id="process" className="py-28 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-futuristic">{t.process_title}</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.process_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative p-7 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:border-blue-500/40 transition-all duration-500">
              <div className="flex items-center justify-between mb-5">
                <span className="text-3xl">{step.icon}</span>
                <span className="text-5xl font-black text-blue-500/15 leading-none">{i + 1}</span>
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <button
            onClick={() => setShowChat(true)}
            className="px-10 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all font-black active:scale-95 inline-flex items-center gap-3 btn-futuristic"
          >
            {t.chat_button_start}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* --- SERVICIOS --- */}
      <section id="services" className="py-28 px-6 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-futuristic">{t.services_title}</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.services_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((num, index) => (
            <ServiceCard
              key={num}
              num={num}
              icon={serviceIcons[index]}
              fileName={serviceFileNames[index]}
              t={t}
            />
          ))}
        </div>
      </section>

      {/* --- INDUSTRIAS / TELEMETRÍA (banda completa) --- */}
      <div className="w-full border-t border-white/5 bg-gradient-to-b from-blue-950/10 to-black">
        <section id="industries" className="py-28 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="inline-block mb-4 px-4 py-1.5 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black tracking-[0.25em] uppercase">
              📡 IoT · Telemetría
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">{t.industries_title}</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.industries_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((ind, i) => (
              <IndustryCard key={i} icon={ind.icon} title={ind.title} desc={ind.desc} />
            ))}
          </div>
        </section>
      </div>

      {/* --- IA & MACHINE LEARNING (banda completa) --- */}
      <div className="w-full border-t border-white/5">
        <section id="ai" className="py-28 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="inline-block mb-4 px-4 py-1.5 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black tracking-[0.25em] uppercase">
              🧠 AI · Machine Learning
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-futuristic">{t.ai_title}</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.ai_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aiFeatures.map((f, i) => (
              <div key={i} className="p-8 rounded-[2rem] glass-effect border-blue-500/10">
                <div className="text-4xl mb-5">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- CIBERSEGURIDAD (banda completa) --- */}
      <div className="w-full border-t border-white/5 bg-gradient-to-b from-black to-red-950/10">
        <section id="security" className="py-28 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="inline-block mb-4 px-4 py-1.5 border border-red-500/30 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black tracking-[0.25em] uppercase">
              🛡️ {t.sec_badge}
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-futuristic">{t.sec_title}</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.sec_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((f, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:bg-red-500/[0.06] hover:border-red-500/40 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="text-4xl mb-5">{f.icon}</div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-red-300 transition-colors">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Banda de riesgo / importancia comercial */}
          <div className="mt-16 grid lg:grid-cols-2 gap-10 items-center glass-effect rounded-[2.5rem] border-red-500/15 p-8 md:p-12">
            <div>
              <span className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                {t.sec_risk_badge}
              </span>
              <h3 className="text-2xl md:text-3xl font-black mb-4 tracking-tight leading-tight">{t.sec_risk_title}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">{t.sec_risk_desc}</p>
              <button
                onClick={() => setShowChat(true)}
                className="px-9 py-4 bg-red-600 text-white rounded-full hover:bg-red-500 transition-all font-black active:scale-95 inline-flex items-center gap-3 btn-futuristic shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              >
                {t.sec_cta}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-4">
              {[t.sec_b1, t.sec_b2, t.sec_b3, t.sec_b4].map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300 text-sm md:text-base">
                  <Check />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* --- CASO DE ÉXITO (banda completa) --- */}
      <div className="w-full border-t border-white/5 bg-gradient-to-b from-black to-blue-950/10">
        <section id="cases" className="py-28 px-6 max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block mb-5 px-4 py-1.5 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black tracking-[0.25em] uppercase">
                ⭐ {t.case_badge}
              </span>
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">{t.case_title}</h2>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-8">{t.case_desc}</p>

              <ul className="space-y-4 mb-10">
                {[t.case_b1, t.case_b2, t.case_b3].map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300 text-sm md:text-base">
                    <Check />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowChat(true)}
                className="px-9 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all font-black active:scale-95 inline-flex items-center gap-3 btn-futuristic"
              >
                {t.case_cta}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Mockup de dashboard (visual, sin imagen externa) */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full" />
              <div className="relative glass-effect rounded-[2rem] border-blue-500/20 p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">rental · dashboard</span>
                </div>

                {/* Banner promocional con caducidad */}
                <div className="relative rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 p-4 mb-4 overflow-hidden">
                  <div className="absolute top-2 right-2 text-[8px] font-black bg-black/30 px-2 py-0.5 rounded-full uppercase tracking-widest">⏳ 02:14:55</div>
                  <p className="text-xs font-black uppercase tracking-wider">-20% Fin de semana</p>
                  <p className="text-[10px] text-blue-100 mt-1">Banner auto-expirable</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { k: "Flota activa", v: "42" },
                    { k: "Reservas hoy", v: "17" },
                    { k: "Ocupación", v: "88%" },
                  ].map((m, i) => (
                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <div className="text-xl font-black text-blue-400">{m.v}</div>
                      <div className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-1">{m.k}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {[70, 45, 90, 30].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[9px] text-gray-600 w-10 shrink-0">{`AUTO 0${i + 1}`}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* --- CTA FINAL --- */}
      <div className="w-full border-t border-white/5">
        <section className="py-32 px-6 max-w-4xl mx-auto w-full text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">{t.cta_title}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">{t.cta_subtitle}</p>
          <button
            onClick={() => setShowChat(true)}
            className="px-12 py-5 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.4)] font-black text-xl active:scale-95 inline-flex items-center gap-3 mx-auto btn-futuristic"
          >
            {t.chat_button_start}
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>
      </div>

      {/* --- CONTACTO & FOOTER --- */}
      <div className="w-full bg-gradient-to-t from-blue-900/10 to-black border-t border-white/5">
        <section id="contact" className="py-28 px-6 max-w-4xl mx-auto w-full text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">{t.contact_title}</h2>

          <div className="flex flex-wrap justify-center items-center gap-5">
            <a href="mailto:info@puma-code.com" className="group flex items-center gap-4 px-9 py-5 bg-white text-black font-black rounded-3xl hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-2xl active:scale-95 btn-futuristic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              {t.contact_btn_mail}
            </a>

            <a href="https://www.linkedin.com/in/robert-drazewski" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-9 py-5 bg-[#0077b5] text-white font-black rounded-3xl hover:bg-[#005582] transition-all duration-500 shadow-2xl active:scale-95 btn-futuristic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              LinkedIn
            </a>

            <a href="https://www.instagram.com/puma_code" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-9 py-5 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-black rounded-3xl hover:scale-105 transition-all duration-500 shadow-2xl active:scale-95 btn-futuristic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              Instagram
            </a>
          </div>

          <div className="mt-28 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            <span>PUMA CODE ENGINE v2.0</span>
            <span>MENDOZA, ARGENTINA • WORLDWIDE SERVICE</span>
            <span>© 2026</span>
          </div>
        </section>
      </div>

      {showChat && (
        <AIChat lang={lang} t={t} onClose={() => setShowChat(false)} />
      )}
    </main>
  );
}
