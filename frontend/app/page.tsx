"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';

// El motor 3D (Three.js/WebGL) solo puede correr en el navegador del cliente,
// nunca en el server durante el build est\u00e1tico. ssr:false evita errores de
// build y hace que se cargue reci\u00e9n cuando el navegador lo necesita.
const HeroScene = dynamic(() => import('../components/HeroScene'), { ssr: false });
import { translations } from '../constants/translations';
import {
  Globe, Smartphone, Radio, Cpu, Bot, Gem,
  MessageCircle, ScanEye, ClipboardList, Settings,
  TrendingUp, Zap, Sprout, Gauge, Truck, Package,
  Shield, Search, Lock, FileText, Radar,
  Store, ShoppingCart, LayoutDashboard, GridPlus, Star, Clock,
} from '../components/Icons';

/* ---------- Contenedor de ícono profesional (reemplaza emojis) ----------
   Hereda el glow/flotación de .icon-fx y tiñe según la sección. */
const ICON_TONES: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  red: 'bg-red-500/10 border-red-500/25 text-red-400',
};

/* El ícono LLENA todo el tile: svg a w-full/h-full, el padding marca el respiro. */
const ICON_SIZES: Record<string, { tile: string; svg: string }> = {
  sm: { tile: 'w-12 h-12 p-2.5 rounded-xl', svg: 'w-full h-full' },
  md: { tile: 'w-16 h-16 p-3 rounded-2xl', svg: 'w-full h-full' },
  lg: { tile: 'w-20 h-20 p-3.5 rounded-[1.4rem]', svg: 'w-full h-full' },
};

const IconTile = ({ icon: I, tone = 'blue', size = 'md', className = '' }: { icon: any; tone?: string; size?: string; className?: string }) => {
  const s = ICON_SIZES[size] || ICON_SIZES.md;
  return (
    <span className={`icon-fx inline-flex items-center justify-center border ${s.tile} ${ICON_TONES[tone] || ICON_TONES.blue} ${className}`}>
      <I className={s.svg} />
    </span>
  );
};

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

const ExternalLinkIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

/* ---------- Contenedor de VISTA ----------
   Cada item del navbar muestra una de estas. Solo la activa se ve;
   las demás quedan en el DOM (ocultas) para no perder SEO.
   Si el contenido es alto, la vista crece y se hace scroll dentro de ella. */
const View = ({ id, active, accent, children }: any) => (
  <div
    data-view={id}
    aria-hidden={!active}
    style={accent ? ({ ['--fx' as any]: accent }) : undefined}
    className={`view-shell ${active ? 'view-active' : 'view-hidden'}`}
  >
    {children}
  </div>
);

/* ---------- Tarjeta de servicio ---------- */
const ServiceCard = ({ num, icon, t, fileName }: any) => {
  return (
    <div className="card-glow group relative flex flex-col p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-blue-500/50 hover:-translate-y-2 transition-all duration-500 overflow-hidden hover:shadow-[0_0_40px_rgba(37,99,235,0.15)]">
      <div className="pointer-events-none absolute -right-12 -top-12 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative flex items-center justify-between mb-5">
        <IconTile icon={icon} size="lg" />
        <span className="text-[11px] font-black text-blue-500/40 tracking-[0.3em] tabular-nums">0{num}</span>
      </div>

      <h3 className="relative text-xl md:text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
        {t[`s${num}_title`]}
      </h3>

      <p className="relative text-gray-400 leading-relaxed text-sm mb-6 flex-1">
        {t[`s${num}_desc`]}
      </p>

      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/50 aspect-[16/10]">
        <img
          src={`/${fileName}.PNG`}
          alt={t[`s${num}_title`]}
          loading="lazy"
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    </div>
  );
};

/* ---------- Tarjeta de industria / telemetría (más grande) ---------- */
const IndustryCard = ({ icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="card-glow group relative p-9 md:p-10 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:bg-blue-500/[0.06] hover:border-blue-500/40 transition-all duration-500 overflow-hidden">
    <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      <IconTile icon={icon} size="lg" className="mb-6" />
      <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-gray-400 text-sm md:text-base leading-relaxed">{desc}</p>
    </div>
  </div>
);

/* ---------- Lógica Live Projects ---------- */
const FACTORY_URL = 'https://www.puma-code.com/';

const LIVE_PROJECTS = [
  {
    id: 'goodtrip',
    name: 'Good Trip Car Rentals',
    url: 'https://goodtrip.com.ar/',
    tags: ['React', 'Node/Express', 'MySQL', 'OpenAI'],
    accent: '#3b82f6',
    descKey: 'live_goodtrip_desc',
    localImage: '/assets/images/goodtrip-preview.png',
  },
  {
    id: 'agrotech',
    name: 'Puma Agrotech',
    url: 'https://agrotech-pumacode.com.ar/',
    tags: ['IoT', 'LoRaWAN', 'ML', 'React'],
    accent: '#22c55e',
    descKey: 'live_agrotech_desc',
    localImage: '/assets/images/agrotech-preview.png',
  },
  {
    id: 'kalyber',
    name: 'Kalyber',
    url: 'https://kalyber.com.ar/',
    tags: ['React', 'Node/Express', 'Tailwind'],
    accent: '#f97316',
    descKey: 'live_kalyber_desc',
    localImage: '/assets/images/kalyber-preview.png',
  },
  {
    id: 'mendozapp',
    name: 'Mendozapp',
    url: 'https://mendozapp.com.ar/',
    tags: ['React', 'Node/Express', 'Tailwind'],
    accent: '#a855f7',
    descKey: 'live_mendozapp_desc',
    localImage: '/assets/images/mendozapp-preview.png',
  }
];

const shotFor = (url: string) =>
  `https://image.thum.io/get/width/1200/crop/750/noanimate/${url}`;

const LiveCard = ({ project, index, t }: any) => {
  const cardRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const handleTilt = (e: any) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(px * 6).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100 + 50).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100 + 50).toFixed(1)}%`);
  };

  const resetTilt = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleTilt}
      onMouseLeave={resetTilt}
      style={{
        '--accent': project.accent,
        transform: 'perspective(1200px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))',
        animationDelay: `${index * 120}ms`
      } as React.CSSProperties}
      className="live-card group relative flex flex-col h-full rounded-2xl overflow-hidden
                 bg-[#0b0b0c] border border-white/10 transition-[transform,border-color,box-shadow]
                 duration-300 ease-out will-change-transform animate-fade-in
                 hover:border-[color:var(--accent)]/60"
    >
      {/* Glow que sigue al cursor */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
        style={{
          background: 'radial-gradient(420px circle at var(--mx,50%) var(--my,50%), color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)',
        }}
      />

      {/* Marco de navegador */}
      <div className="relative z-10 m-3 mb-0 rounded-xl overflow-hidden border border-white/10 bg-[#111]">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#161618] border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-2 flex-1 truncate text-[10px] font-mono text-gray-500 bg-black/40 rounded px-2 py-0.5">
            {project.url.replace('https://', '')}
          </div>
          <span className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-[color:var(--accent)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--accent)] opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--accent)]" />
            </span>
            LIVE
          </span>
        </div>

        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0d0d0d]">
          {!loaded && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-[color:var(--accent)] animate-spin" />
            </div>
          )}
          {stage === 0 ? (
            <iframe
              title={project.name}
              src={project.url}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setStage(1)}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin"
              className="absolute top-0 left-0 origin-top-left border-0 w-[200%] h-[200%] scale-50 transition-transform duration-700 group-hover:scale-[0.52]"
            />
          ) : (
            <img
              src={stage === 1 ? shotFor(project.url) : project.localImage}
              alt={project.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
              onError={() => stage === 1 && setStage(2)}
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${project.name}`}
            className="absolute inset-0 z-20"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-transparent to-transparent opacity-70" />
        </div>
      </div>

      <div className="relative z-10 p-5 pt-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[color:var(--accent)] transition-colors">
            {project.name}
          </h3>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-gray-500 hover:text-[color:var(--accent)] transition-all hover:scale-110"
          >
            <ExternalLinkIcon size={14} />
          </a>
        </div>

        <p className="text-gray-400 text-xs leading-relaxed mt-2 mb-4">
          {t[project.descKey] || 'Proyecto desarrollado por Puma Code.'}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded text-gray-300 bg-white/[0.04] border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>

        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/90 hover:gap-3 transition-all w-fit"
        >
          <span className="border-b-2 pb-0.5" style={{ borderColor: project.accent }}>
            {t.live_visit || 'VISITAR WEB'}
          </span>
          <ArrowRight className="text-[color:var(--accent)] w-3 h-3" />
        </a>
      </div>
    </article>
  );
};

/* ---------- Orden de las vistas (coincide con el navbar) ---------- */
const VIEW_IDS = ['home', 'process', 'services', 'express', 'industries', 'security', 'cases', 'contact'];

/* ---------- Componente principal ---------- */
export default function Home() {
  const [lang, setLang] = useState('es');
  const [showChat, setShowChat] = useState(false);
  const [activeView, setActiveView] = useState('home');

  const t = translations[lang] || translations['es'];

  /* Navegar a una vista: actualiza estado, URL (#) y sube al inicio */
  const navigate = useCallback((id: string) => {
    if (!VIEW_IDS.includes(id)) id = 'home';
    setActiveView(id);
    if (typeof window !== 'undefined') {
      const hash = id === 'home' ? ' ' : `#${id}`;
      history.pushState(null, '', id === 'home' ? window.location.pathname : hash);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  /* Soporta enlaces directos (#security) y el botón Atrás del navegador */
  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace('#', '');
      setActiveView(VIEW_IDS.includes(id) ? id : 'home');
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    apply();
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showChat ? 'hidden' : 'unset';
  }, [showChat]);

  const serviceIcons = [Globe, Smartphone, Radio, Cpu, Bot, Gem];
  const serviceFileNames = [
    "desarrollo-web", "apps-nativas", "iot-telemetria",
    "ia-machine-learning", "optimizacion-eficiencia", "qa-calidad",
  ];

  const stats = [
    { v: t.st1_v, l: t.st1_l }, { v: t.st2_v, l: t.st2_l },
    { v: t.st3_v, l: t.st3_l }, { v: t.st4_v, l: t.st4_l },
  ];

  const steps = [
    { icon: MessageCircle, title: t.p1_title, desc: t.p1_desc },
    { icon: ScanEye, title: t.p2_title, desc: t.p2_desc },
    { icon: ClipboardList, title: t.p3_title, desc: t.p3_desc },
    { icon: Settings, title: t.p4_title, desc: t.p4_desc },
  ];

  const industries = [
    { icon: Sprout, title: t.ind1_title, desc: t.ind1_desc },
    { icon: Gauge, title: t.ind2_title, desc: t.ind2_desc },
    { icon: Truck, title: t.ind3_title, desc: t.ind3_desc },
    { icon: Package, title: t.ind4_title, desc: t.ind4_desc },
  ];

  const aiFeatures = [
    { icon: Bot, title: t.ai_f1_title, desc: t.ai_f1_desc },
    { icon: TrendingUp, title: t.ai_f2_title, desc: t.ai_f2_desc },
    { icon: Zap, title: t.ai_f3_title, desc: t.ai_f3_desc },
  ];

  const securityFeatures = [
    { icon: Shield, title: t.sec_f1_title, desc: t.sec_f1_desc },
    { icon: Search, title: t.sec_f2_title, desc: t.sec_f2_desc },
    { icon: Lock, title: t.sec_f3_title, desc: t.sec_f3_desc },
    { icon: FileText, title: t.sec_f4_title, desc: t.sec_f4_desc },
  ];

  const expressPlans = [
    { icon: Globe, title: t.exp_p1_title, desc: t.exp_p1_desc },
    { icon: Store, title: t.exp_p2_title, desc: t.exp_p2_desc },
    { icon: ShoppingCart, title: t.exp_p3_title, desc: t.exp_p3_desc, featured: true },
    { icon: LayoutDashboard, title: t.exp_p4_title, desc: t.exp_p4_desc },
  ];

  const expressAddons = [
    { icon: GridPlus, title: t.exp_addon1_title, desc: t.exp_addon1_desc },
    { icon: Bot, title: t.exp_addon2_title, desc: t.exp_addon2_desc },
  ];

  const securityPlans = [
    { price: "80", title: t.sec_plan1_title, ideal: t.sec_plan1_ideal, days: t.sec_plan1_days,
      items: [t.sec_plan1_i1, t.sec_plan1_i2, t.sec_plan1_i3, t.sec_plan1_i4] },
    { price: "180", title: t.sec_plan2_title, ideal: t.sec_plan2_ideal, days: t.sec_plan2_days, featured: true,
      items: [t.sec_plan2_i1, t.sec_plan2_i2, t.sec_plan2_i3, t.sec_plan2_i4, t.sec_plan2_i5, t.sec_plan2_i6] },
    { price: "420", title: t.sec_plan3_title, ideal: t.sec_plan3_ideal, days: t.sec_plan3_days,
      items: [t.sec_plan3_i1, t.sec_plan3_i2, t.sec_plan3_i3, t.sec_plan3_i4, t.sec_plan3_i5, t.sec_plan3_i6] },
  ];

  return (
    <main className="relative min-h-screen bg-black text-white overflow-x-hidden flex flex-col selection:bg-blue-500/30">
      <Navbar lang={lang} setLang={setLang} t={t} activeView={activeView} onNavigate={navigate} />
      <Footer t={t} />

      {/* LUCES AMBIENTALES FLOTANTES (fondo de toda la app) */}
      <div className="bg-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      {/* FONDO DECORATIVO */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black -z-10" />

      {/* ===================== VISTA: HOME (Hero + Stats) ===================== */}
      <View id="home" active={activeView === 'home'}>
        <section className="flex flex-col items-center justify-center text-center w-full">
          {/* Protagonista del hero: la cabeza de Puma Code armándose con
              caracteres de código. Tiene su propio espacio, en primer plano,
              arriba del headline — no compite con el texto por el mismo lugar. */}
          <div
            className="relative w-full max-w-xl mx-auto mb-6 rounded-3xl overflow-hidden"
            style={{ aspectRatio: '0.846 / 1' }}
          >
            <HeroScene />
          </div>

          <div className="max-w-4xl relative z-10">
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
              <button
                onClick={() => navigate('cases')}
                className="px-10 py-5 border border-white/15 text-gray-300 rounded-full hover:border-blue-500/50 hover:text-white transition-all duration-300 font-bold text-lg active:scale-95"
              >
                {t.hero_cta_secondary}
              </button>
            </div>

            <p className="mt-10 text-gray-600 text-xs font-bold uppercase tracking-[0.25em]">
              {t.hero_trust}
            </p>
          </div>

          {/* BARRA DE STATS */}
          <div className="w-full max-w-5xl mt-16 border-y border-white/5 bg-white/[0.015] rounded-3xl">
            <div className="px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-black text-futuristic">{s.v}</div>
                  <div className="mt-2 text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </View>

      {/* ===================== VISTA: PROCESO (corta → agrandada) ===================== */}
      <View id="process" active={activeView === 'process'}>
        <section className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter text-futuristic">{t.process_title}</h2>
            <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">{t.process_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, i) => (
              <div key={i} className="card-glow group relative p-8 md:p-10 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:border-blue-500/40 transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <IconTile icon={step.icon} size="lg" />
                  <span className="text-5xl md:text-6xl font-black text-blue-500/15 leading-none">{i + 1}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed">{step.desc}</p>
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
      </View>

      {/* ===================== VISTA: SERVICIOS (+ banda de IA) ===================== */}
      <View id="services" active={activeView === 'services'}>
        <section className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-futuristic">{t.services_title}</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.services_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((num, index) => (
              <ServiceCard key={num} num={num} icon={serviceIcons[index]} fileName={serviceFileNames[index]} t={t} />
            ))}
          </div>

          {/* Banda IA & Machine Learning */}
          <div className="mt-20 pt-16 border-t border-white/5">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black tracking-[0.25em] uppercase">
                <Cpu className="w-3.5 h-3.5" /> AI · Machine Learning
              </span>
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter text-futuristic">{t.ai_title}</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.ai_subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {aiFeatures.map((f, i) => (
                <div key={i} className="card-glow group p-8 rounded-[2rem] glass-effect border-blue-500/10">
                  <IconTile icon={f.icon} className="mb-5" />
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </View>

      {/* ===================== VISTA: EXPRESS ===================== */}
      <View id="express" active={activeView === 'express'} accent="rgba(16,185,129,0.5)">
        <section className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 border border-emerald-500/30 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-[0.25em] uppercase">
              <Zap className="w-3.5 h-3.5" /> {t.exp_badge}
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-futuristic">{t.exp_title}</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.exp_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {expressPlans.map((p, i) => (
              <div
                key={i}
                className={`card-glow group relative flex flex-col p-7 rounded-[2rem] border transition-all duration-500 overflow-hidden hover:-translate-y-2 ${
                  p.featured
                    ? "border-emerald-500/50 bg-emerald-500/[0.06] shadow-[0_0_40px_rgba(16,185,129,0.12)]"
                    : "border-white/10 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
                }`}
              >
                {p.featured && (
                  <span className="absolute top-5 right-5 text-[9px] font-black bg-emerald-500 text-black px-2.5 py-1 rounded-full uppercase tracking-widest z-10">
                    {t.exp_popular}
                  </span>
                )}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <IconTile icon={p.icon} tone="emerald" className="mb-5" />
                  <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-300 transition-colors">{p.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 min-h-[60px]">{p.desc}</p>
                  <button
                    onClick={() => setShowChat(true)}
                    className="inline-flex items-center gap-2 text-emerald-400 font-black text-sm hover:text-emerald-300 transition-colors group/cta"
                  >
                    {t.exp_cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {expressAddons.map((a, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-[1.75rem] border border-white/10 bg-white/[0.02]">
                <IconTile icon={a.icon} tone="emerald" size="sm" className="shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">{a.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm max-w-2xl mx-auto mb-8 leading-relaxed">{t.exp_note}</p>
            <button
              onClick={() => setShowChat(true)}
              className="px-10 py-5 bg-emerald-600 text-white rounded-full hover:bg-emerald-500 transition-all duration-300 shadow-[0_0_40px_rgba(16,185,129,0.35)] font-black text-lg active:scale-95 inline-flex items-center gap-3 btn-futuristic"
            >
              {t.exp_cta}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </View>

      {/* ===================== VISTA: INDUSTRIAS (corta → agrandada) ===================== */}
      <View id="industries" active={activeView === 'industries'}>
        <section className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black tracking-[0.25em] uppercase">
              <Radio className="w-3.5 h-3.5" /> IoT · Telemetría
            </span>
            <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter">{t.industries_title}</h2>
            <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">{t.industries_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {industries.map((ind, i) => (
              <IndustryCard key={i} icon={ind.icon} title={ind.title} desc={ind.desc} />
            ))}
          </div>
        </section>
      </View>

      {/* ===================== VISTA: SEGURIDAD (alta → scroll interno) ===================== */}
      <View id="security" active={activeView === 'security'} accent="rgba(239,68,68,0.5)">
        <section className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 border border-red-500/30 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black tracking-[0.25em] uppercase">
              <Shield className="w-3.5 h-3.5" /> {t.sec_badge}
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-futuristic">{t.sec_title}</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t.sec_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((f, i) => (
              <div key={i} className="card-glow group relative p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:bg-red-500/[0.06] hover:border-red-500/40 transition-all duration-500 overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <IconTile icon={f.icon} tone="red" className="mb-5" />
                  <h3 className="text-xl font-bold mb-3 group-hover:text-red-300 transition-colors">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {securityPlans.map((p, i) => (
              <div
                key={i}
                className={`card-glow group relative flex flex-col p-7 rounded-[2rem] border transition-all duration-500 overflow-hidden hover:-translate-y-2 ${
                  p.featured
                    ? "border-red-500/50 bg-red-500/[0.06] shadow-[0_0_40px_rgba(239,68,68,0.12)]"
                    : "border-white/10 bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.04]"
                }`}
              >
                {p.featured && (
                  <span className="absolute top-5 right-5 text-[9px] font-black bg-red-500 text-white px-2.5 py-1 rounded-full uppercase tracking-widest z-10">
                    {t.exp_popular}
                  </span>
                )}
                <h3 className="text-lg font-black mb-1 group-hover:text-red-300 transition-colors uppercase tracking-tight">{p.title}</h3>
                <p className="text-gray-500 text-xs mb-4 leading-relaxed min-h-[32px]">{p.ideal}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-black text-red-400">USD {p.price}</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-4">
                  {p.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-gray-300 text-[13px] leading-snug">
                      <Check />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <p className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold uppercase tracking-wider border-t border-white/5 pt-3"><Clock className="w-3.5 h-3.5 shrink-0" /> {p.days}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-7 rounded-[2rem] border border-red-500/20 bg-gradient-to-r from-red-950/20 to-transparent">
            <div className="flex items-start gap-4">
              <IconTile icon={Radar} tone="red" size="sm" className="shrink-0" />
              <div>
                <h4 className="font-black mb-1 uppercase tracking-tight">{t.sec_monitor_title} · <span className="text-red-400">USD 80/{t.sec_monitor_per}</span></h4>
                <p className="text-gray-400 text-sm leading-relaxed">{t.sec_monitor_desc}</p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(true)}
              className="shrink-0 px-7 py-3.5 bg-red-600 text-white rounded-full hover:bg-red-500 transition-all font-black text-sm active:scale-95 inline-flex items-center gap-2 btn-futuristic"
            >
              {t.sec_cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

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
      </View>

      {/* ===================== VISTA: CASO DE ÉXITO (Ahora Live Projects) ===================== */}
      <View id="cases" active={activeView === 'cases'}>
        <section className="relative max-w-7xl mx-auto w-full px-4 md:px-0">
          {/* Glow ambiental de fondo */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 left-1/4 w-[36rem] h-[36rem] rounded-full bg-blue-600/10 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] rounded-full bg-emerald-500/10 blur-[120px]" />
          </div>

          <div className="mb-14 relative z-10 text-center md:text-left">
            <span className="font-mono text-[11px] tracking-[0.32em] uppercase text-emerald-400 flex items-center justify-center md:justify-start gap-2.5">
              <span className="w-6 h-px bg-emerald-500 inline-block" /> {t.live_eyebrow || 'LIVE LABS'}
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mt-4 leading-none">
              {t.live_title_1 || 'PROYECTOS'}{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-white to-blue-400 bg-clip-text text-transparent">
                {t.live_title_2 || 'EN PRODUCCIÓN'}
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mt-4 mx-auto md:mx-0">
              {t.live_subtitle || 'Software real operando para nuestros clientes en'}{' '}
              <a
                href={FACTORY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-semibold underline decoration-blue-500/60 underline-offset-4 hover:decoration-blue-400 transition"
              >
                Puma Code
              </a>
              .
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-7">
            {LIVE_PROJECTS.map((p, i) => (
              <LiveCard key={p.id} project={p} index={i} t={t} />
            ))}
          </div>
        </section>
      </View>

      {/* ===================== VISTA: CONTACTO (+ CTA final) ===================== */}
      <View id="contact" active={activeView === 'contact'}>
        <section className="max-w-4xl mx-auto w-full text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">{t.cta_title}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">{t.cta_subtitle}</p>

          <div className="flex flex-wrap justify-center items-center gap-5 mb-16">
            <a href="mailto:info@puma-code.com" className="group flex items-center gap-4 px-9 py-5 bg-white text-black font-black rounded-3xl hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-2xl active:scale-95 btn-futuristic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              {t.contact_btn_mail}
            </a>

            <a href="https://www.linkedin.com/company/puma-code" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-9 py-5 bg-[#0077b5] text-white font-black rounded-3xl hover:bg-[#005582] transition-all duration-500 shadow-2xl active:scale-95 btn-futuristic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              LinkedIn
            </a>

            <a href="https://www.instagram.com/puma_code" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 px-9 py-5 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-black rounded-3xl hover:scale-105 transition-all duration-500 shadow-2xl active:scale-95 btn-futuristic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              Instagram
            </a>
          </div>
        </section>
      </View>

      {showChat && (
        <AIChat lang={lang} t={t} onClose={() => setShowChat(false)} />
      )}
    </main>
  );
}