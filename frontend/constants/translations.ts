// Cada idioma hereda las claves en inglés como respaldo.
// Si una clave nueva todavía no está traducida en un idioma, se muestra en
// inglés en lugar de aparecer como "undefined". (Ver el merge al final.)

type Dict = Record<string, string>;

const en: Dict = {
  // --- NAV ---
  nav_home: "Home",
  nav_process: "How it works",
  nav_services: "Solutions",
  nav_industries: "Industries",
  nav_cases: "Case Study",
  nav_contact: "Contact",

  // --- HERO ---
  hero_badge: "Software Factory · AI-Native · From Mendoza to the world",
  hero_title: "We Build the Software Your Business Needs",
  hero_subtitle:
    "From custom web platforms and mobile apps to AI assistants and industrial telemetry. Describe your idea in a 2-minute chat and get an estimated quote in minutes.",
  hero_cta_secondary: "See case study",
  hero_trust: "Trusted by businesses in Argentina and around the world",

  // --- STATS BAR ---
  st1_v: "2 min",
  st1_l: "From idea to estimate",
  st2_v: "100%",
  st2_l: "Custom-built software",
  st3_v: "12",
  st3_l: "Languages supported",
  st4_v: "24/7",
  st4_l: "Real-time monitoring",

  // --- PROCESS ---
  process_title: "From idea to quote in a single conversation",
  process_subtitle:
    "Our AI consultant scopes your project live. No forms, no waiting.",
  p1_title: "Tell us your idea",
  p1_desc: "Chat with our AI consultant about what you want to build or automate.",
  p2_title: "AI scopes it out",
  p2_desc: "It understands your needs, the right stack and the effort involved.",
  p3_title: "Get a real estimate",
  p3_desc: "Receive scope, technologies, timeline and a price in USD.",
  p4_title: "We build it",
  p4_desc: "Roberto reviews the brief and we start engineering your solution.",

  // --- SERVICES ---
  services_title: "Our Solutions",
  services_subtitle:
    "Cutting-edge technology to scale your business and optimize every process.",
  s1_title: "High-Performance Web Development",
  s1_desc:
    "We build high-impact digital platforms using Next.js and React to ensure instant load times and a scalable architecture.",
  s2_title: "Native & Cross-Platform Apps",
  s2_desc:
    "We develop robust mobile applications for iOS and Android, focusing on performance, data security and an intuitive user interface.",
  s3_title: "IoT Connectivity & Telemetry",
  s3_desc:
    "Bridging the physical and digital worlds. We design real-time data acquisition and custom remote hardware monitoring.",
  s4_title: "AI Architecture & Machine Learning",
  s4_desc:
    "Integrating advanced language models and native predictive analytics into your workflow to automate decision-making.",
  s5_title: "Optimization & Operational Efficiency",
  s5_desc:
    "Eliminating operational fatigue by automating administrative processes and stock management for higher-value tasks.",
  s6_title: "Strategic QA & Industrial Quality",
  s6_desc:
    "Ensuring product integrity through rigorous testing methodologies, guaranteeing every deployment is secure and bug-free.",

  // --- INDUSTRIES / TELEMETRY ---
  industries_title: "Telemetry for the real world",
  industries_subtitle:
    "We connect physical assets to the cloud and turn the data into decisions.",
  ind1_title: "Smart Vineyards",
  ind1_desc:
    "Soil moisture, climate and irrigation sensors that protect every harvest and cut water waste.",
  ind2_title: "Oil, Gas & Mining",
  ind2_desc:
    "Remote asset control and predictive maintenance for equipment in the harshest environments.",
  ind3_title: "Fleets & Logistics",
  ind3_desc:
    "Live vehicle tracking, route optimization and automated alerts across your whole fleet.",
  ind4_title: "Retail, Wineries & Stock",
  ind4_desc:
    "Real-time inventory, turns and operations from a single panel. No more spreadsheets.",

  // --- AI / ML BAND ---
  ai_title: "AI that works for your business",
  ai_subtitle:
    "Conversational assistants, predictive models and automation built into your operation.",
  ai_f1_title: "Conversational AI Assistants",
  ai_f1_desc:
    "Virtual agents that talk to your customers, qualify leads and answer 24/7. Just like the one quoting your project right now.",
  ai_f2_title: "Predictive Machine Learning",
  ai_f2_desc:
    "Forecast demand, detect anomalies and anticipate failures before they cost you money.",
  ai_f3_title: "Decision Automation",
  ai_f3_desc:
    "Let the system handle the repetitive calls so your team focuses on what matters.",

  // --- CASE STUDY ---
  case_badge: "Success Story",
  case_title: "A car-rental SaaS, controlled end to end",
  case_desc:
    "We built a complete rental platform where the owner runs the entire business from one dashboard: fleet, bookings, pricing and marketing, including promotional banners that publish and expire on their own.",
  case_b1: "Unified control panel for the whole operation",
  case_b2: "Self-expiring promotional banners. Set it once, forget it",
  case_b3: "Real-time fleet and booking management",
  case_cta: "Want something like this?",

  // --- FINAL CTA ---
  cta_title: "Your project starts with a conversation",
  cta_subtitle:
    "Describe your idea to our AI and get an estimated quote: scope, stack, timeline and price.",

  // --- CHAT (used by AIChat.tsx) ---
  chat_title: "Live Consultancy",
  chat_welcome:
    "Welcome to Puma Code, {name}! 🐆 Tell us, how do you want to improve your business?",
  chat_placeholder: "Type your message...",
  chat_button_send: "Send",
  chat_button_start: "Start Consultancy",
  chat_form_name: "Full Name",
  chat_form_email: "your@email.com",
  chat_form_desc: "Before starting, tell me who you are so I can send the proposal.",
  chat_btn_quote: "🚀 GET ESTIMATED QUOTE",
  chat_success_title: "Request Received!",
  chat_success_desc:
    "Your request has been processed successfully. We will be in touch with you soon.",
  chat_success_close: "CLOSE",
  interacciones_label: "Interactions",

  // --- CONTACT ---
  contact_title: "Let's Talk About Your Project",
  contact_btn_mail: "Send Email",
  contact_btn_linkedin: "LinkedIn",
};

const es: Dict = {
  nav_home: "Inicio",
  nav_process: "Cómo funciona",
  nav_services: "Soluciones",
  nav_industries: "Industrias",
  nav_cases: "Caso de Éxito",
  nav_contact: "Contacto",

  hero_badge: "Software Factory · IA Nativa · De Mendoza al mundo",
  hero_title: "Creamos el Software que tu Negocio Necesita",
  hero_subtitle:
    "Desde plataformas web y apps a medida hasta asistentes de IA y telemetría industrial. Contanos tu idea en un chat de 2 minutos y recibí una cotización estimada en minutos.",
  hero_cta_secondary: "Ver caso de éxito",
  hero_trust: "Empresas en Argentina y el mundo ya confían en nosotros",

  st1_v: "2 min",
  st1_l: "De la idea al presupuesto",
  st2_v: "100%",
  st2_l: "Software a medida",
  st3_v: "12",
  st3_l: "Idiomas disponibles",
  st4_v: "24/7",
  st4_l: "Monitoreo en tiempo real",

  process_title: "De la idea al presupuesto en una sola charla",
  process_subtitle:
    "Nuestro consultor con IA arma tu proyecto en vivo. Sin formularios, sin esperas.",
  p1_title: "Contanos tu idea",
  p1_desc: "Charlá con nuestro consultor de IA sobre lo que querés construir o automatizar.",
  p2_title: "La IA define el alcance",
  p2_desc: "Entiende lo que necesitás, la tecnología justa y el trabajo que implica.",
  p3_title: "Recibí un presupuesto real",
  p3_desc: "Alcance, tecnologías, plazos y un precio en USD.",
  p4_title: "Lo construimos",
  p4_desc: "Roberto revisa el informe y empezamos a desarrollar tu solución.",

  services_title: "Nuestras Soluciones",
  services_subtitle:
    "Tecnología de vanguardia para escalar tu negocio y optimizar cada proceso.",
  s1_title: "Desarrollo Web de Alto Rendimiento",
  s1_desc:
    "No construimos simples sitios, creamos plataformas digitales de alto impacto. Usamos Next.js y React para garantizar tiempos de carga instantáneos y una arquitectura escalable.",
  s2_title: "Apps Nativas y Multiplataforma",
  s2_desc:
    "Desarrollamos aplicaciones móviles robustas para iOS y Android con foco en rendimiento óptimo, seguridad de datos e interfaz intuitiva.",
  s3_title: "Conectividad IoT y Telemetría",
  s3_desc:
    "Conectamos el mundo físico con el digital. Diseñamos sistemas de adquisición de datos en tiempo real y monitoreo remoto de hardware a medida.",
  s4_title: "Arquitectura de IA y Machine Learning",
  s4_desc:
    "Integramos modelos de lenguaje avanzados y análisis predictivo en tu flujo de trabajo para automatizar la toma de decisiones.",
  s5_title: "Optimización y Eficiencia Operativa",
  s5_desc:
    "Eliminamos la fatiga operativa automatizando procesos administrativos y gestión de stock, liberando a tu equipo para tareas estratégicas.",
  s6_title: "QA Estratégico y Calidad Industrial",
  s6_desc:
    "Aseguramos la integridad de tu producto con metodologías de testing rigurosas, garantizando que cada despliegue sea seguro y libre de errores.",

  industries_title: "Telemetría para el mundo real",
  industries_subtitle:
    "Conectamos activos físicos a la nube y convertimos los datos en decisiones.",
  ind1_title: "Viñedos Inteligentes",
  ind1_desc:
    "Sensores de humedad de suelo, clima y riego que cuidan cada cosecha y reducen el desperdicio de agua.",
  ind2_title: "Petróleo, Gas y Minería",
  ind2_desc:
    "Control remoto de activos y mantenimiento predictivo para equipos en los entornos más exigentes.",
  ind3_title: "Flotas y Logística",
  ind3_desc:
    "Seguimiento de vehículos en vivo, optimización de rutas y alertas automáticas en toda tu flota.",
  ind4_title: "Retail, Bodegas y Stock",
  ind4_desc:
    "Inventario, turnos y operaciones en tiempo real desde un solo panel. Se acabaron las planillas.",

  ai_title: "IA que trabaja para tu negocio",
  ai_subtitle:
    "Asistentes conversacionales, modelos predictivos y automatización integrados en tu operación.",
  ai_f1_title: "Asistentes de IA conversacionales",
  ai_f1_desc:
    "Agentes virtuales que hablan con tus clientes, califican oportunidades y responden 24/7. Como el que está cotizando tu proyecto ahora mismo.",
  ai_f2_title: "Machine Learning predictivo",
  ai_f2_desc:
    "Anticipá la demanda, detectá anomalías y predecí fallas antes de que cuesten plata.",
  ai_f3_title: "Automatización de decisiones",
  ai_f3_desc:
    "Dejá que el sistema resuelva lo repetitivo y que tu equipo se enfoque en lo importante.",

  case_badge: "Caso de Éxito",
  case_title: "Un SaaS de alquiler de autos, controlado de punta a punta",
  case_desc:
    "Construimos una plataforma de alquiler completa donde el dueño maneja todo el negocio desde un solo panel: flota, reservas, precios y marketing, incluidos banners promocionales que se publican y caducan solos.",
  case_b1: "Panel de control unificado para toda la operación",
  case_b2: "Banners promocionales con caducidad automática. Lo configurás una vez y listo",
  case_b3: "Gestión de flota y reservas en tiempo real",
  case_cta: "¿Querés algo así?",

  cta_title: "Tu proyecto empieza con una conversación",
  cta_subtitle:
    "Contale tu idea a nuestra IA y obtené una cotización estimada: alcance, tecnología, plazos y precio.",

  chat_title: "Consultoría en Vivo",
  chat_welcome:
    "¡Bienvenido a Puma Code, {name}! 🐆 Contanos, ¿cómo querés mejorar tu empresa o qué idea tenés en mente para automatizar hoy?",
  chat_placeholder: "Escribí tu mensaje...",
  chat_button_send: "Enviar",
  chat_button_start: "Empezar Consultoría",
  chat_form_name: "Tu nombre completo",
  chat_form_email: "tu@email.com",
  chat_form_desc: "Antes de empezar, contame quién sos para enviarte la propuesta técnica.",
  chat_btn_quote: "🚀 OBTENER COTIZACIÓN ESTIMADA",
  chat_success_title: "¡Solicitud Recibida!",
  chat_success_desc:
    "Tu solicitud fue procesada con éxito. Pronto nos vamos a comunicar con vos.",
  chat_success_close: "CERRAR",
  interacciones_label: "Interacciones",

  contact_title: "Hablemos de tu Proyecto",
  contact_btn_mail: "Enviar Email",
  contact_btn_linkedin: "LinkedIn",
};

const pt: Dict = {
  nav_home: "Início",
  nav_process: "Como funciona",
  nav_services: "Soluções",
  nav_industries: "Indústrias",
  nav_cases: "Caso de Sucesso",
  nav_contact: "Contato",

  hero_badge: "Software Factory · IA Nativa · De Mendoza para o mundo",
  hero_title: "Criamos o Software que o seu Negócio Precisa",
  hero_subtitle:
    "De plataformas web e apps sob medida a assistentes de IA e telemetria industrial. Conte sua ideia em um chat de 2 minutos e receba um orçamento estimado em minutos.",
  hero_cta_secondary: "Ver caso de sucesso",
  hero_trust: "Empresas na Argentina e no mundo já confiam na gente",

  st1_v: "2 min",
  st1_l: "Da ideia ao orçamento",
  st2_v: "100%",
  st2_l: "Software sob medida",
  st3_v: "12",
  st3_l: "Idiomas disponíveis",
  st4_v: "24/7",
  st4_l: "Monitoramento em tempo real",

  process_title: "Da ideia ao orçamento em uma única conversa",
  process_subtitle:
    "Nosso consultor com IA monta seu projeto ao vivo. Sem formulários, sem esperas.",
  p1_title: "Conte sua ideia",
  p1_desc: "Converse com nosso consultor de IA sobre o que quer construir ou automatizar.",
  p2_title: "A IA define o escopo",
  p2_desc: "Entende o que você precisa, a tecnologia certa e o esforço envolvido.",
  p3_title: "Receba um orçamento real",
  p3_desc: "Escopo, tecnologias, prazos e um preço em USD.",
  p4_title: "Nós construímos",
  p4_desc: "Roberto revisa o briefing e começamos a desenvolver sua solução.",

  services_title: "Nossas Soluções",
  services_subtitle:
    "Tecnologia de ponta para escalar seu negócio e otimizar cada processo.",
  s1_title: "Desenvolvimento Web de Alto Desempenho",
  s1_desc:
    "Criamos plataformas digitais de alto impacto usando Next.js e React para garantir carregamento instantâneo e arquitetura escalável.",
  s2_title: "Apps Nativos e Multiplataforma",
  s2_desc:
    "Desenvolvemos aplicações móveis robustas para iOS e Android com foco em desempenho, segurança e interface intuitiva.",
  s3_title: "Conectividade IoT e Telemetria",
  s3_desc:
    "Conectamos o mundo físico ao digital. Projetamos sistemas de aquisição de dados em tempo real e monitoramento remoto de hardware.",
  s4_title: "Arquitetura de IA e Machine Learning",
  s4_desc:
    "Integramos modelos de linguagem avançados e análise preditiva no seu fluxo de trabalho para automatizar decisões.",
  s5_title: "Otimização e Eficiência Operacional",
  s5_desc:
    "Eliminamos a fadiga operacional automatizando processos administrativos e gestão de estoque.",
  s6_title: "QA Estratégico e Qualidade Industrial",
  s6_desc:
    "Garantimos a integridade do produto com metodologias de teste rigorosas, assegurando que cada deploy seja seguro.",

  industries_title: "Telemetria para o mundo real",
  industries_subtitle:
    "Conectamos ativos físicos à nuvem e transformamos os dados em decisões.",
  ind1_title: "Vinhedos Inteligentes",
  ind1_desc:
    "Sensores de umidade do solo, clima e irrigação que protegem cada colheita e reduzem o desperdício de água.",
  ind2_title: "Petróleo, Gás e Mineração",
  ind2_desc:
    "Controle remoto de ativos e manutenção preditiva para equipamentos nos ambientes mais exigentes.",
  ind3_title: "Frotas e Logística",
  ind3_desc:
    "Rastreamento de veículos ao vivo, otimização de rotas e alertas automáticos em toda a frota.",
  ind4_title: "Varejo, Adegas e Estoque",
  ind4_desc:
    "Inventário, turnos e operações em tempo real em um único painel. Chega de planilhas.",

  ai_title: "IA que trabalha pelo seu negócio",
  ai_subtitle:
    "Assistentes conversacionais, modelos preditivos e automação integrados à sua operação.",
  ai_f1_title: "Assistentes de IA conversacionais",
  ai_f1_desc:
    "Agentes virtuais que falam com seus clientes, qualificam oportunidades e respondem 24/7. Como o que está orçando seu projeto agora.",
  ai_f2_title: "Machine Learning preditivo",
  ai_f2_desc:
    "Antecipe a demanda, detecte anomalias e preveja falhas antes que custem dinheiro.",
  ai_f3_title: "Automação de decisões",
  ai_f3_desc:
    "Deixe o sistema resolver o repetitivo e a sua equipe focar no que importa.",

  case_badge: "Caso de Sucesso",
  case_title: "Um SaaS de aluguel de carros, controlado de ponta a ponta",
  case_desc:
    "Construímos uma plataforma de aluguel completa onde o dono gerencia todo o negócio em um único painel: frota, reservas, preços e marketing, incluindo banners promocionais que publicam e expiram sozinhos.",
  case_b1: "Painel de controle unificado para toda a operação",
  case_b2: "Banners promocionais com expiração automática. Configure uma vez e pronto",
  case_b3: "Gestão de frota e reservas em tempo real",
  case_cta: "Quer algo assim?",

  cta_title: "Seu projeto começa com uma conversa",
  cta_subtitle:
    "Conte sua ideia para nossa IA e receba um orçamento estimado: escopo, tecnologia, prazos e preço.",

  chat_title: "Consultoria ao Vivo",
  chat_welcome: "Bem-vindo à Puma Code, {name}! 🐆 Como você quer melhorar sua empresa hoje?",
  chat_placeholder: "Digite sua mensagem...",
  chat_button_send: "Enviar",
  chat_button_start: "Iniciar Consultoria",
  chat_form_name: "Nome completo",
  chat_form_email: "seu@email.com",
  chat_form_desc: "Antes de começar, diga-me quem você é para que eu possa enviar a proposta.",
  chat_btn_quote: "🚀 OBTER ORÇAMENTO ESTIMADO",
  chat_success_title: "Solicitação Recebida!",
  chat_success_desc:
    "Sua solicitação foi processada com sucesso. Entraremos em contato em breve.",
  chat_success_close: "FECHAR",
  interacciones_label: "Interações",

  contact_title: "Vamos Conversar",
  contact_btn_mail: "Enviar Email",
  contact_btn_linkedin: "LinkedIn",
};

// Idiomas con traducción parcial: conservan lo ya traducido y heredan en inglés
// las claves de marketing nuevas (process_*, industries_*, ai_*, case_*, etc.).
const it: Dict = {
  nav_home: "Inizio",
  nav_services: "Servizi",
  nav_contact: "Contatto",
  hero_badge: "Software Factory · Servizio Globale",
  hero_title: "Creiamo il Software di cui la tua Azienda ha Bisogno",
  hero_subtitle: "Trasformiamo idee complesse in codice solido con intelligenza artificiale integrata.",
  chat_title: "Consulenza dal Vivo",
  chat_welcome: "Benvenuto in Puma Code, {name}! 🐆 Dicci, come vuoi migliorare la tua azienda oggi?",
  chat_placeholder: "Scrivi il tuo messaggio...",
  chat_button_send: "Invia",
  chat_button_start: "Inizia Consulenza",
  chat_form_name: "Nome completo",
  chat_form_email: "tua@email.com",
  chat_form_desc: "Prima di iniziare, dimmi chi sei così posso inviarti la proposta tecnica.",
  chat_btn_quote: "🚀 OTTIENI PREVENTIVO STIMATO",
  chat_success_title: "Richiesta Ricevuta!",
  chat_success_desc: "La tua richiesta è stata elaborata con successo. Ti contatteremo al più presto.",
  chat_success_close: "CHIUDI",
  interacciones_label: "Interazioni",
  services_title: "Le Nostre Soluzioni",
  services_subtitle: "Tecnologia all'avanguardia per scalare il tuo business e ottimizzare i processi.",
  s1_title: "Sviluppo Web ad Alte Prestazioni",
  s1_desc: "Creiamo piattaforme digitali ad alto impatto utilizzando Next.js e React per garantire tempi di caricamento istantanei.",
  s2_title: "App Native e Cross-Platform",
  s2_desc: "Sviluppiamo applicazioni mobili robuste per iOS e Android, puntando su prestazioni ottimali e sicurezza dei dati.",
  s3_title: "Connettività IoT e Telemetria",
  s3_desc: "Colleghiamo il mondo fisico con quello digitale attraverso sistemi di acquisizione dati in tempo reale e monitoraggio hardware.",
  s4_title: "Architettura IA e Machine Learning",
  s4_desc: "Integriamo modelli linguistici avanzati e analisi predittiva nel tuo flusso di lavoro per automatizzare le decisioni.",
  s5_title: "Ottimizzazione ed Efficienza Operativa",
  s5_desc: "Eliminiamo la fatica operativa automatizzando i processi amministrativi e la gestione del magazzino.",
  s6_title: "QA Strategico e Qualità Industriale",
  s6_desc: "Garantiamo l'integrità del prodotto attraverso rigorose metodologie di testing, assicurando che ogni rilascio sia sicuro.",
  contact_title: "Parliamo del tuo Progetto",
  contact_btn_mail: "Invia Email",
  contact_btn_linkedin: "LinkedIn",
};

const ca: Dict = {
  nav_home: "Inici",
  nav_services: "Serveis",
  nav_contact: "Contacte",
  hero_badge: "Software Factory · Servei Global",
  hero_title: "Creem el Programari que el teu Negoci Necessita",
  hero_subtitle: "Transformem idees complexes en codi sòlid amb intel·ligència artificial integrada.",
  chat_title: "Consultoria en Viu",
  chat_welcome: "Benvingut a Puma Code, {name}! 🐆 Com vols millorar la teva empresa avui?",
  chat_placeholder: "Escriu el teu missatge...",
  chat_button_send: "Enviar",
  chat_button_start: "Començar Consultoria",
  chat_form_name: "Nom complet",
  chat_form_email: "teu@email.com",
  chat_form_desc: "Abans de començar, digues-me qui ets per enviar-te la proposta tècnica.",
  chat_btn_quote: "🚀 OBTENIR PRESSUPOST ESTIMAT",
  chat_success_title: "Sol·licitud Rebuda!",
  chat_success_desc: "La teva sol·licitud ha estat processada amb èxit. Ens posarem en contacte aviat.",
  chat_success_close: "TANCAR",
  interacciones_label: "Interaccions",
  services_title: "Les Nostres Solucions",
  services_subtitle: "Tecnologia d'avantguarda per escalar el teu negoci i optimitzar processos.",
  s1_title: "Desenvolupament Web d'Alt Rendiment",
  s1_desc: "Creem plataformes digitals d'alt impacte amb Next.js i React per garantir velocitat i escalabilitat.",
  s2_title: "Apps Natives i Multiplataforma",
  s2_desc: "Desenvolupem aplicacions mòbils robustes per a iOS i Android amb enfocament en rendiment i seguretat.",
  s3_title: "Connectivitat IoT i Telemetria",
  s3_desc: "Connectem el món físic amb el digital. Dissenyem sistemes d'adquisició de dades en temps real per a la indústria.",
  s4_title: "Arquitectura d'IA i Machine Learning",
  s4_desc: "Integrem models de llenguatge avançats i anàlisi predictiva per automatitzar la presa de decisions.",
  s5_title: "Optimització i Eficiència Operativa",
  s5_desc: "Eliminem la fatiga operativa automatitzant processos administratius i gestió d'estoc.",
  s6_title: "QA Estratègic i Qualitat Industrial",
  s6_desc: "Assegurem la integritat del producte mitjançant metodologies de testing rigoroses i segures.",
  contact_title: "Parlem del teu Projecte",
  contact_btn_mail: "Enviar Email",
  contact_btn_linkedin: "LinkedIn",
};

const de: Dict = {
  nav_home: "Startseite",
  nav_services: "Leistungen",
  nav_contact: "Kontakt",
  hero_badge: "Software Factory · Weltweiter Service",
  hero_title: "Wir entwickeln die Software, die Ihr Business braucht",
  hero_subtitle: "Wir verwandeln komplexe Ideen in soliden Code mit integrierter KI.",
  chat_title: "Live-Beratung",
  chat_welcome: "Willkommen bei Puma Code, {name}! 🐆 Wie möchten Sie Ihr Unternehmen heute verbessern?",
  chat_placeholder: "Nachricht eingeben...",
  chat_button_send: "Senden",
  chat_button_start: "Beratung starten",
  chat_form_name: "Vollständiger Name",
  chat_form_email: "ihre@email.com",
  chat_form_desc: "Bevor wir beginnen, sagen Sie mir bitte, wer Sie sind.",
  chat_btn_quote: "🚀 KOSTENVORANSCHLAG ERHALTEN",
  chat_success_title: "Anfrage erhalten!",
  chat_success_desc: "Ihre Anfrage wurde erfolgreich bearbeitet. Wir melden uns in Kürze.",
  chat_success_close: "SCHLIESSEN",
  interacciones_label: "Interaktionen",
  services_title: "Unsere Lösungen",
  services_subtitle: "Spitzentechnologie zur Skalierung Ihres Unternehmens.",
  s1_title: "Hochleistungs-Webentwicklung",
  s1_desc: "Wir bauen digitale Plattformen mit Next.js und React für sofortige Ladezeiten und Skalierbarkeit.",
  s2_title: "Native & Cross-Platform Apps",
  s2_desc: "Robuste mobile Anwendungen für iOS und Android mit Fokus auf Performance und Sicherheit.",
  s3_title: "IoT-Konnektivität & Telemetrie",
  s3_desc: "Verbindung der physischen und digitalen Welt durch Echtzeit-Datenerfassungssysteme.",
  s4_title: "KI-Architektur & Machine Learning",
  s4_desc: "Integration fortschrittlicher Sprachmodelle zur Automatisierung von Entscheidungen.",
  s5_title: "Optimierung & operative Effizienz",
  s5_desc: "Automatisierung administrativer Prozesse zur Entlastung Ihres Teams.",
  s6_title: "Strategische QA & Industriequalität",
  s6_desc: "Sicherung der Produktintegrität durch strenge Testmethoden.",
  contact_title: "Lassen Sie uns sprechen",
  contact_btn_mail: "E-Mail senden",
  contact_btn_linkedin: "LinkedIn",
};

const ru: Dict = {
  nav_home: "Главная",
  nav_services: "Услуги",
  nav_contact: "Контакты",
  hero_badge: "Software Factory · Весь мир",
  hero_title: "Мы создаем софт для вашего бизнеса",
  hero_subtitle: "Превращаем сложные идеи в надежный код с интеграцией ИИ.",
  chat_title: "Консультация",
  chat_welcome: "Добро пожаловать в Puma Code, {name}! 🐆 Как мы можем улучшить ваш бизнес сегодня?",
  chat_placeholder: "Введите сообщение...",
  chat_button_send: "Отправить",
  chat_button_start: "Начать консультацию",
  chat_form_name: "Полное имя",
  chat_form_email: "ваш@email.com",
  chat_form_desc: "Прежде чем начать, представьтесь.",
  chat_btn_quote: "🚀 ПОЛУЧИТЬ РАСЧЕТ",
  chat_success_title: "Заявка получена!",
  chat_success_desc: "Ваш запрос успешно обработан. Мы скоро с вами свяжемся.",
  chat_success_close: "ЗАКРЫТЬ",
  interacciones_label: "Взаимодействия",
  services_title: "Наши решения",
  services_subtitle: "Передовые технологии для масштабирования бизнеса.",
  s1_title: "Высокопроизводительная веб-разработка",
  s1_desc: "Мы создаем мощные платформы на Next.js и React для мгновенной загрузки.",
  s2_title: "Нативные и кроссплатформенные приложения",
  s2_desc: "Надежные мобильные приложения для iOS и Android с фокусом на безопасность.",
  s3_title: "IoT и телеметрия",
  s3_desc: "Соединяем физический и цифровой миры через системы сбора данных в реальном времени.",
  s4_title: "Архитектура ИИ и машинное обучение",
  s4_desc: "Внедрение языковых моделей для автоматизации принятия решений.",
  s5_title: "Оптимизация операционной эффективности",
  s5_desc: "Автоматизация административных процессов для экономии времени.",
  s6_title: "Стратегический QA и контроль качества",
  s6_desc: "Обеспечение целостности продукта через строгие методики тестирования.",
  contact_title: "Обсудим ваш проект",
  contact_btn_mail: "Написать Email",
  contact_btn_linkedin: "LinkedIn",
};

const pl: Dict = {
  nav_home: "Start",
  nav_services: "Usługi",
  nav_contact: "Kontakt",
  hero_badge: "Software Factory · Zasięg globalny",
  hero_title: "Tworzymy oprogramowanie dla Twojego biznesu",
  hero_subtitle: "Przekształcamy złożone pomysły w solidny kod z integracją AI.",
  chat_title: "Konsultacje na żywo",
  chat_welcome: "Witaj w Puma Code, {name}! 🐆 Jak chcesz dziś usprawnić swoją firmę?",
  chat_placeholder: "Wpisz wiadomość...",
  chat_button_send: "Wyślij",
  chat_button_start: "Rozpocznij konsultację",
  chat_form_name: "Imię i nazwisko",
  chat_form_email: "twój@email.com",
  chat_form_desc: "Zanim zaczniemy, powiedz mi kim jesteś.",
  chat_btn_quote: "🚀 OTRZYMAJ WYCENĘ",
  chat_success_title: "Zgłoszenie otrzymane!",
  chat_success_desc: "Twoje zgłoszenie zostało pomyślnie przetworzone. Skontaktujemy się wkrótce.",
  chat_success_close: "ZAMKNIJ",
  interacciones_label: "Interakcje",
  services_title: "Nasze rozwiązania",
  services_subtitle: "Najnowocześniejsza technologia do skalowania biznesu.",
  s1_title: "Wydajne tworzenie stron WWW",
  s1_desc: "Budujemy platformy cyfrowe w Next.js i React dla błyskawicznego działania.",
  s2_title: "Aplikacje natywne i mobilne",
  s2_desc: "Solidne aplikacje na iOS i Android z naciskiem na wydajność i bezpieczeństwo.",
  s3_title: "Łączność IoT i telemetria",
  s3_desc: "Łączymy świat fizyczny z cyfrowym poprzez systemy gromadzenia danych.",
  s4_title: "Architektura AI i Machine Learning",
  s4_desc: "Integracja zaawansowanych modeli językowych dla automatyzacji decyzji.",
  s5_title: "Optymalizacja i wydajność operacyjna",
  s5_desc: "Eliminacja rutyny poprzez automatyzację procesów administracyjnych.",
  s6_title: "Strategiczne QA i jakość przemysłowa",
  s6_desc: "Zapewnienie integralności produktu poprzez rygorystyczne testy.",
  contact_title: "Porozmawiajmy o projekcie",
  contact_btn_mail: "Wyślij Email",
  contact_btn_linkedin: "LinkedIn",
};

const sv: Dict = {
  nav_home: "Hem",
  nav_services: "Tjänster",
  nav_contact: "Kontakt",
  hero_badge: "Software Factory · Global service",
  hero_title: "Vi bygger mjukvaran ditt företag behöver",
  hero_subtitle: "Vi förvandlar komplexa idéer till stabil kod med integrerad AI.",
  chat_title: "Live-konsultation",
  chat_welcome: "Välkommen till Puma Code, {name}! 🐆 Hur vill du förbättra ditt företag idag?",
  chat_placeholder: "Skriv ditt meddelande...",
  chat_button_send: "Skicka",
  chat_button_start: "Starta konsultation",
  chat_form_name: "Fullständigt namn",
  chat_form_email: "din@email.com",
  chat_form_desc: "Berätta vem du är innan vi börjar.",
  chat_btn_quote: "🚀 FÅ KOSTNADSFÖRSLAG",
  chat_success_title: "Begäran mottagen!",
  chat_success_desc: "Ditt ärende har behandlats. Vi hör av oss snart.",
  chat_success_close: "STÄNG",
  interacciones_label: "Interaktioner",
  services_title: "Våra lösningar",
  services_subtitle: "Banbrytande teknik för att skala din verksamhet.",
  s1_title: "Högpresterande webbutveckling",
  s1_desc: "Vi bygger digitala plattformar med Next.js och React för snabb laddning.",
  s2_title: "Native & Cross-Platform Apps",
  s2_desc: "Robusta mobilappar för iOS och Android med fokus på säkerhet.",
  s3_title: "IoT & telemetri",
  s3_desc: "Kopplar ihop den fysiska och digitala världen med realtidsdata.",
  s4_title: "AI-arkitektur & Machine Learning",
  s4_desc: "Integration av språkmodeller för att automatisera beslutsfattande.",
  s5_title: "Optimering & operativ effektivitet",
  s5_desc: "Automatisering av administrativa processer för att frigöra tid.",
  s6_title: "Strategisk QA & industriell kvalitet",
  s6_desc: "Säkerställer produktintegritet genom rigorösa testmetoder.",
  contact_title: "Låt oss prata",
  contact_btn_mail: "Skicka E-post",
  contact_btn_linkedin: "LinkedIn",
};

const no: Dict = {
  nav_home: "Hjem",
  nav_services: "Tjenester",
  nav_contact: "Kontakt",
  hero_badge: "Software Factory · Global tjeneste",
  hero_title: "Vi bygger programvaren din bedrift trenger",
  hero_subtitle: "Vi forvandler komplekse ideer til solid kode med integrert AI.",
  chat_title: "Live-konsultasjon",
  chat_welcome: "Velkommen til Puma Code, {name}! 🐆 Hvordan vil du forbedre bedriften din?",
  chat_placeholder: "Skriv meldingen din...",
  chat_button_send: "Send",
  chat_button_start: "Start konsultasjon",
  chat_form_name: "Fullt navn",
  chat_form_email: "din@email.com",
  chat_form_desc: "Fortell meg hvem du er før vi starter.",
  chat_btn_quote: "🚀 FÅ PRISOVERSLAG",
  chat_success_title: "Forespørsel mottatt!",
  chat_success_desc: "Din forespørsel er behandlet. Vi tar kontakt snart.",
  chat_success_close: "LUKK",
  interacciones_label: "Interaksjoner",
  services_title: "Våre løsninger",
  services_subtitle: "Ledende teknologi for å skalere din bedrift.",
  s1_title: "Høyytelses webutvikling",
  s1_desc: "Vi bygger digitale plattformer i Next.js og React for raske lastetider.",
  s2_title: "Native & Cross-Platform Apps",
  s2_desc: "Robuste mobilapper for iOS og Android med fokus på ytelse.",
  s3_title: "IoT & telemetri",
  s3_desc: "Brobygging mellom den fysiske og digitale verden med sanntidsdata.",
  s4_title: "AI-arkitektur & Machine Learning",
  s4_desc: "Integrering av språkmodeller for å automatisere beslutninger.",
  s5_title: "Optimalisering & operativ effektivitet",
  s5_desc: "Automatisering av administrative prosesser for mer verdi.",
  s6_title: "Strategisk QA & industriell kvalitet",
  s6_desc: "Sikrer produktintegritet gjennom strenge testmetoder.",
  contact_title: "La oss snakke",
  contact_btn_mail: "Send E-post",
  contact_btn_linkedin: "LinkedIn",
};

const ja: Dict = {
  nav_home: "ホーム",
  nav_services: "サービス",
  nav_contact: "お問い合わせ",
  hero_badge: "ソフトウェアファクトリー · グローバルサービス",
  hero_title: "ビジネスに必要なソフトウェアを構築します",
  hero_subtitle: "複雑なアイデアを、AIを統合した堅牢なコードに変換します。",
  chat_title: "ライブコンサルティング",
  chat_welcome: "Puma Codeへようこそ、{name}さん！ 🐆 ビジネス改善についてお聞かせください。",
  chat_placeholder: "メッセージを入力...",
  chat_button_send: "送信",
  chat_button_start: "コンサルティングを開始",
  chat_form_name: "フルネーム",
  chat_form_email: "メールアドレス",
  chat_form_desc: "開始する前に、お名前を教えてください。",
  chat_btn_quote: "🚀 見積もり依頼を送信",
  chat_success_title: "リクエストを受信しました！",
  chat_success_desc: "リクエストは正常に処理されました。間もなくご連絡いたします。",
  chat_success_close: "閉じる",
  interacciones_label: "相互作用",
  services_title: "当社のソリューション",
  services_subtitle: "ビジネスを拡大するための最先端技術。",
  s1_title: "高性能Web開発",
  s1_desc: "Next.jsとReactを使用して、瞬時のロード時間を実現するプラットフォームを構築します。",
  s2_title: "ネイティブ&クロスプラットフォームアプリ",
  s2_desc: "iOSとAndroid向けに、パフォーマンスとセキュリティを重視したモバイルアプリを開発します。",
  s3_title: "IoTテレメトリ",
  s3_desc: "物理世界とデジタル世界を繋ぎ、リアルタイムのデータ監視システムを設計します。",
  s4_title: "AIアーキテクチャ&機械学習",
  s4_desc: "高度な言語モデルを統合し、意思決定の自動化を実現します。",
  s5_title: "最適化と運用効率",
  s5_desc: "事務プロセスを自動化し、チームをより価値の高い戦略的タスクへ解放します。",
  s6_title: "戦略的QAと産業品質",
  s6_desc: "厳格なテスト手法により、安全でエラーのないデプロイを保証します。",
  contact_title: "プロジェクトについて話しましょう",
  contact_btn_mail: "メールを送信",
  contact_btn_linkedin: "LinkedIn",
};

const zh: Dict = {
  nav_home: "首页",
  nav_services: "服务",
  nav_contact: "联系我们",
  hero_badge: "软件工厂 · 全球服务",
  hero_title: "我们构建您业务所需的软件",
  hero_subtitle: "将复杂的想法转化为集成人工智能的坚固代码。",
  chat_title: "现场咨询",
  chat_welcome: "欢迎来到 Puma Code，{name}！ 🐆 请告诉我们您今天想如何改进您的公司？",
  chat_placeholder: "输入消息...",
  chat_button_send: "发送",
  chat_button_start: "开始咨询",
  chat_form_name: "全名",
  chat_form_email: "您的邮箱地址",
  chat_form_desc: "在开始之前，请告知您的身份。",
  chat_btn_quote: "🚀 获取预估报价",
  chat_success_title: "请求已收到！",
  chat_success_desc: "您的请求已处理成功。我们将尽快与您联系。",
  chat_success_close: "关闭",
  interacciones_label: "互动",
  services_title: "我们的解决方案",
  services_subtitle: "助力业务规模化和流程优化的尖端技术。",
  s1_title: "高性能 Web 开发",
  s1_desc: "使用 Next.js 和 React 构建高影响力的数字平台，确保即时加载。",
  s2_title: "原生和跨平台应用",
  s2_desc: "开发稳健的 iOS 和 Android 移动应用，专注于性能和数据安全。",
  s3_title: "物联网遥测",
  s3_desc: "通过实时数据采集系统连接物理和数字世界。",
  s4_title: "人工智能架构和机器学习",
  s4_desc: "将先进语言模型集成到工作流中，实现决策自动化。",
  s5_title: "优化和运营效率",
  s5_desc: "通过行政流程自动化消除运营疲劳，助力团队处理核心任务。",
  s6_title: "战略 QA 和工业级品质",
  s6_desc: "通过严谨的测试方法确保产品完整性，保证每次部署安全无误。",
  contact_title: "谈谈您的项目",
  contact_btn_mail: "发送邮件",
  contact_btn_linkedin: "LinkedIn",
};

const raw: Record<string, Dict> = {
  es, en, pt, it, ca, de, ru, pl, sv, no, ja, zh,
};

// Cada idioma = inglés (respaldo) + sus propias traducciones por encima.
export const translations: Record<string, Dict> = Object.fromEntries(
  Object.entries(raw).map(([lang, dict]) => [lang, { ...en, ...dict }])
);