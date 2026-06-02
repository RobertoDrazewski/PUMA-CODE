const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// El modelo se define en la variable de entorno OPENAI_MODEL.
const MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo';

// Límites para controlar costos y abuso.
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 4000;

// --- CONFIG DÓLAR / FINANCIACIÓN ---
const DOLAR_TIPO = process.env.DOLAR_TIPO || 'blue'; // blue | oficial | mep | tarjeta | cripto
const DOLAR_FALLBACK = Number(process.env.DOLAR_FALLBACK) || 1450;
const RECARGO_3_CUOTAS = 0.16; // 16%
const RECARGO_6_CUOTAS = 0.32; // 32%

// Costos recurrentes (USD).
const RAILWAY_USD_MES = Number(process.env.RAILWAY_USD_MES) || 5; // Railway plan estándar (fijo)
const FALLBACK_OPENAI_USD_MES = 15; // estimado si la IA no lo devuelve (relativo al uso)
const FALLBACK_DOMINIO_USD_ANIO = 15;
// OpenAI: sistema de créditos con autorecarga.
const OPENAI_CARGA_INICIAL = 10;
const OPENAI_UMBRAL = 5;
const OPENAI_RECARGA = 5;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return null;
  const clean = messages
    .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS_PER_MESSAGE) }));
  return clean.length ? clean : null;
};

// --- HELPERS DE DINERO ---
const fmtUSD = (n) => `US$ ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const fmtARS = (n) => {
  const v = Math.round(Number(n) || 0);
  try { return `$ ${v.toLocaleString('es-AR')}`; } catch (_) { return `$ ${v}`; }
};
const numOr = (v, fallback) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : fallback);

const getDollarRate = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const r = await fetch(`https://dolarapi.com/v1/dolares/${DOLAR_TIPO}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!r.ok) throw new Error(`status ${r.status}`);
    const d = await r.json();
    const venta = Number(d.venta);
    if (!venta || Number.isNaN(venta)) throw new Error('venta inválida');
    return { value: venta, source: `dolarapi.com · dólar ${DOLAR_TIPO}`, date: d.fechaActualizacion || new Date().toISOString(), fallback: false };
  } catch (e) {
    console.error('⚠️ No se pudo obtener el dólar, usando fallback:', e.message);
    return { value: DOLAR_FALLBACK, source: `valor de respaldo · dólar ${DOLAR_TIPO}`, date: new Date().toISOString(), fallback: true };
  }
};

const buildPlanes = (totalArs) => ({
  contado: totalArs,
  plan3: { total: totalArs * (1 + RECARGO_3_CUOTAS), cuota: (totalArs * (1 + RECARGO_3_CUOTAS)) / 3, recargo: `${RECARGO_3_CUOTAS * 100}%` },
  plan6: { total: totalArs * (1 + RECARGO_6_CUOTAS), cuota: (totalArs * (1 + RECARGO_6_CUOTAS)) / 6, recargo: `${RECARGO_6_CUOTAS * 100}%` },
});

// ============================================================
//  TEXTOS DEL PRESUPUESTO (i18n) — el mail se escribe en el idioma del chat
// ============================================================
const T = {
  es: {
    reportTitle: 'Propuesta & Presupuesto',
    greeting: (name) => `Hola ${name} 👋`,
    intro: (proj) => `Este es el presupuesto detallado para <b>${proj}</b>. Acá tenés todo: qué vamos a construir, cuánto sale, cómo se paga y qué necesitás para que el sistema funcione de forma 100% independiente.`,
    buildTitle: '🧩 Qué vamos a construir',
    stackLabel: '🛠 Tecnologías',
    investTitle: '💰 Inversión — pago único (sin mensualidades a Puma Code)',
    includedNote: 'Incluye el primer consumo de Railway y OpenAI durante el desarrollo y las pruebas (a cargo de Puma Code, ya declarado en este presupuesto).',
    plazoLabel: 'Plazo estimado',
    weeks: 'semanas',
    planCaption: (monto) => `Planes en pesos (sobre ${monto})`,
    contado: 'Contado',
    cuotas3: '3 cuotas',
    cuotas6: '6 cuotas',
    tcLabel: 'Tipo de cambio',
    equivale: 'Equivale a',
    fallbackTC: ' (valor de referencia)',
    pago5050: (a) => `Forma de pago: <b>50% (${a}) para arrancar</b> y <b>50% (${a}) al entregar</b>, junto con el dominio.`,
    ownTitle: '🔑 Tu software es 100% tuyo, para siempre',
    ownBullets: (name) => [
      'Pagás <b>una sola vez</b> por el desarrollo y se entrega <b>100% funcional</b>. No hay mantención ni mensualidad para Puma Code.',
      'El código y todas las cuentas (servidor, IA, dominio) quedan <b>a tu nombre</b>: sos dueño del 100% del software.',
      'Lo que pagás cada mes (Railway + OpenAI + dominio) es para <b>mantener tu SaaS vivo y operando solo</b> con tus propias API keys. Ese dinero va directo a los proveedores, no a Puma Code.',
      'Puma Code deja todo configurado y conectado a tu tarjeta; vos mantenés el control total. Es un sistema <b>independiente</b> que sigue funcionando aunque no trabajes más con nosotros.',
      'Si en el futuro necesitás un arreglo o una mejora, te seguimos considerando cliente: tenés una <b>tarifa preferencial con 30% de descuento por hora de programación</b>.',
    ],
    monthlyTitle: '⚙️ Lo que hace al sistema independiente: tus servicios mensuales',
    monthlyIntro: 'El desarrollo es un pago único. Para que el sistema funcione necesita estos servicios, que quedan <b>a tu nombre</b> y se pagan con tu tarjeta mediante un <b>sistema de créditos con autorecarga</b> (se recargan solos cuando bajan del tope que vos definís):',
    railwayLabel: 'Railway — servidor y base de datos',
    openaiLabel: 'OpenAI — funciones de inteligencia artificial',
    domainLabel: 'Dominio (.com)',
    perMonth: '/mes aprox.',
    perYear: '/año aprox.',
    noIA: 'No aplica (sin IA)',
    openaiCredit: (i, u, r) => `Créditos con autorecarga: carga inicial de ${i} y, cuando el saldo baja a ${u}, recarga ${r} automáticamente. Así siempre tenés crédito disponible.`,
    domainMonthlyHint: (m) => `Se paga una vez al año (equivale a ${m} por mes).`,
    totalLabel: '💳 Total estimado por mes',
    totalSub: 'Incluye Railway + OpenAI + la parte proporcional del dominio. El consumo de OpenAI es relativo: varía según la cantidad de consultas a la API.',
    usageNote: 'Son estimados. Vos controlás el tope y la autorecarga. Tanto OpenAI como Railway te enviarán directamente los comprobantes y precios correspondientes.',
    processTitle: '🗓️ Cómo trabajamos: seguimiento por sprints',
    processIntro: (weeks) => `El proyecto se divide en sprints semanales: son <b>${weeks} semanas</b> de desarrollo y cada cierre de semana es un sprint.`,
    processBullets: [
      'Al cerrar cada sprint te <b>contactamos</b> para mostrarte los avances y qué quedó hecho hasta ese momento.',
      'Durante el desarrollo podés dar <b>feedback</b>: si necesitás cambiar una herramienta, ajustar el backend o la base de datos, lo resolvemos en el sprint que corresponda.',
      'En la <b>última semana</b> solo se aceptan cambios de <b>estilo y apariencia</b> (ya no de backend ni base de datos).',
      'También en la última semana ya tenés que <b>comprar el dominio</b>, así renderizamos, hacemos el test final y te entregamos el proyecto funcionando.',
    ],
    growthTitle: '📈 Estrategia comercial de crecimiento para tu empresa',
    chatTitle: '💬 Conversación con nuestro asistente',
    assistantName: 'Puma Code IA',
    footer: 'Puma Code · Software a medida · Mendoza, Argentina — info@puma-code.com',
  },
  en: {
    reportTitle: 'Proposal & Quote',
    greeting: (name) => `Hi ${name} 👋`,
    intro: (proj) => `Here is the detailed quote for <b>${proj}</b>. You'll find everything: what we'll build, how much it costs, how you pay and what you need for the system to run 100% independently.`,
    buildTitle: '🧩 What we will build',
    stackLabel: '🛠 Technologies',
    investTitle: '💰 Investment — one-time payment (no monthly fees to Puma Code)',
    includedNote: 'Includes the initial Railway and OpenAI usage during development and testing (covered by Puma Code, already declared in this quote).',
    plazoLabel: 'Estimated timeline',
    weeks: 'weeks',
    planCaption: (monto) => `Installment plans (on ${monto})`,
    contado: 'Full payment',
    cuotas3: '3 installments',
    cuotas6: '6 installments',
    tcLabel: 'Exchange rate',
    equivale: 'Equivalent to',
    fallbackTC: ' (reference value)',
    pago5050: (a) => `Payment terms: <b>50% (${a}) to start</b> and <b>50% (${a}) on delivery</b>, together with the domain.`,
    ownTitle: '🔑 Your software is 100% yours, forever',
    ownBullets: (name) => [
      'You pay <b>once</b> for the development and it is delivered <b>100% functional</b>. No maintenance or monthly fee for Puma Code.',
      'The code and all accounts (server, AI, domain) are <b>in your name</b>: you own 100% of the software.',
      'What you pay each month (Railway + OpenAI + domain) keeps your <b>SaaS alive and running on its own</b> with your own API keys. That money goes straight to the providers, not to Puma Code.',
      'Puma Code sets everything up and connects it to your card; you keep full control. It is an <b>independent</b> system that keeps running even if you stop working with us.',
      'If you ever need a fix or an improvement, we still treat you as a client: you get a <b>preferential rate with 30% off per programming hour</b>.',
    ],
    monthlyTitle: '⚙️ What makes the system independent: your monthly services',
    monthlyIntro: 'The development is a one-time payment. To run, the system needs these services, which stay <b>in your name</b> and are paid with your card through a <b>credit system with auto-recharge</b> (they top up automatically when they drop below the limit you set):',
    railwayLabel: 'Railway — server and database',
    openaiLabel: 'OpenAI — artificial intelligence features',
    domainLabel: 'Domain (.com)',
    perMonth: '/mo approx.',
    perYear: '/yr approx.',
    noIA: 'Not applicable (no AI)',
    openaiCredit: (i, u, r) => `Credits with auto-recharge: an initial ${i} load and, when the balance drops to ${u}, it tops up ${r} automatically. You always have available credit.`,
    domainMonthlyHint: (m) => `Billed once a year (about ${m} per month).`,
    totalLabel: '💳 Estimated total per month',
    totalSub: 'Includes Railway + OpenAI + the prorated domain. OpenAI usage is variable: it depends on the number of API requests.',
    usageNote: 'These are estimates. You control the cap and the auto-recharge. Both OpenAI and Railway will send you their corresponding invoices and prices directly.',
    processTitle: '🗓️ How we work: sprint-based tracking',
    processIntro: (weeks) => `The project is split into weekly sprints: <b>${weeks} weeks</b> of development, and each week closes a sprint.`,
    processBullets: [
      'At the end of each sprint we <b>reach out</b> to show you the progress and what has been completed so far.',
      'Throughout development you can give <b>feedback</b>: if you need to change a tool, adjust the backend or the database, we handle it in the matching sprint.',
      'In the <b>final week</b> only <b>style and appearance</b> changes are accepted (no longer backend or database).',
      'Also in the final week you need to <b>buy the domain</b>, so we can render, run the final test and deliver the project up and running.',
    ],
    growthTitle: '📈 Commercial growth strategy for your company',
    chatTitle: '💬 Conversation with our assistant',
    assistantName: 'Puma Code AI',
    footer: 'Puma Code · Custom software · Mendoza, Argentina — info@puma-code.com',
  },
  pt: {
    reportTitle: 'Proposta & Orçamento',
    greeting: (name) => `Olá ${name} 👋`,
    intro: (proj) => `Este é o orçamento detalhado para <b>${proj}</b>. Aqui está tudo: o que vamos construir, quanto custa, como você paga e o que precisa para o sistema funcionar de forma 100% independente.`,
    buildTitle: '🧩 O que vamos construir',
    stackLabel: '🛠 Tecnologias',
    investTitle: '💰 Investimento — pagamento único (sem mensalidades à Puma Code)',
    includedNote: 'Inclui o primeiro consumo de Railway e OpenAI durante o desenvolvimento e os testes (por conta da Puma Code, já declarado neste orçamento).',
    plazoLabel: 'Prazo estimado',
    weeks: 'semanas',
    planCaption: (monto) => `Planos parcelados (sobre ${monto})`,
    contado: 'À vista',
    cuotas3: '3 parcelas',
    cuotas6: '6 parcelas',
    tcLabel: 'Câmbio',
    equivale: 'Equivale a',
    fallbackTC: ' (valor de referência)',
    pago5050: (a) => `Forma de pagamento: <b>50% (${a}) para começar</b> e <b>50% (${a}) na entrega</b>, junto com o domínio.`,
    ownTitle: '🔑 Seu software é 100% seu, para sempre',
    ownBullets: (name) => [
      'Você paga <b>uma única vez</b> pelo desenvolvimento e ele é entregue <b>100% funcional</b>. Sem manutenção nem mensalidade para a Puma Code.',
      'O código e todas as contas (servidor, IA, domínio) ficam <b>em seu nome</b>: você é dono de 100% do software.',
      'O que você paga por mês (Railway + OpenAI + domínio) mantém seu <b>SaaS vivo e funcionando sozinho</b> com suas próprias API keys. Esse dinheiro vai direto aos fornecedores, não à Puma Code.',
      'A Puma Code deixa tudo configurado e conectado ao seu cartão; você mantém o controle total. É um sistema <b>independente</b> que continua funcionando mesmo se você parar de trabalhar conosco.',
      'Se no futuro precisar de um ajuste ou melhoria, continuamos te considerando cliente: você tem uma <b>tarifa preferencial com 30% de desconto por hora de programação</b>.',
    ],
    monthlyTitle: '⚙️ O que torna o sistema independente: seus serviços mensais',
    monthlyIntro: 'O desenvolvimento é um pagamento único. Para funcionar, o sistema precisa destes serviços, que ficam <b>em seu nome</b> e são pagos com seu cartão por um <b>sistema de créditos com recarga automática</b> (recarregam sozinhos quando ficam abaixo do limite que você define):',
    railwayLabel: 'Railway — servidor e banco de dados',
    openaiLabel: 'OpenAI — funções de inteligência artificial',
    domainLabel: 'Domínio (.com)',
    perMonth: '/mês aprox.',
    perYear: '/ano aprox.',
    noIA: 'Não se aplica (sem IA)',
    openaiCredit: (i, u, r) => `Créditos com recarga automática: carga inicial de ${i} e, quando o saldo cai para ${u}, recarrega ${r} automaticamente. Assim você sempre tem crédito disponível.`,
    domainMonthlyHint: (m) => `Pago uma vez por ano (equivale a ${m} por mês).`,
    totalLabel: '💳 Total estimado por mês',
    totalSub: 'Inclui Railway + OpenAI + a parte proporcional do domínio. O consumo do OpenAI é relativo: varia conforme a quantidade de consultas à API.',
    usageNote: 'São estimativas. Você controla o limite e a recarga automática. Tanto o OpenAI quanto o Railway enviarão diretamente os comprovantes e preços correspondentes.',
    processTitle: '🗓️ Como trabalhamos: acompanhamento por sprints',
    processIntro: (weeks) => `O projeto é dividido em sprints semanais: são <b>${weeks} semanas</b> de desenvolvimento e cada fechamento de semana é um sprint.`,
    processBullets: [
      'Ao fechar cada sprint nós <b>entramos em contato</b> para mostrar os avanços e o que ficou pronto até aquele momento.',
      'Durante o desenvolvimento você pode dar <b>feedback</b>: se precisar trocar uma ferramenta, ajustar o backend ou o banco de dados, resolvemos no sprint correspondente.',
      'Na <b>última semana</b> só são aceitas mudanças de <b>estilo e aparência</b> (não mais de backend nem banco de dados).',
      'Também na última semana você já precisa <b>comprar o domínio</b>, para que possamos renderizar, fazer o teste final e entregar o projeto funcionando.',
    ],
    growthTitle: '📈 Estratégia comercial de crescimento para sua empresa',
    chatTitle: '💬 Conversa com nosso assistente',
    assistantName: 'Puma Code IA',
    footer: 'Puma Code · Software sob medida · Mendoza, Argentina — info@puma-code.com',
  },
};

exports.chatWithAI = async (req, res) => {
  try {
    const { messages, language } = req.body || {};
    const cleanMessages = sanitizeMessages(messages);

    if (!cleanMessages) {
      return res.status(400).json({ error: 'messages debe ser un array no vacío.' });
    }

    const languageNames = { es: 'Spanish', en: 'English', pt: 'Portuguese' };
    const selectedLanguage = languageNames[language] || 'Spanish';

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `Eres parte del equipo de Puma Code, un estudio de software a medida de Mendoza, Argentina (servicio local y al exterior). No parezcas un bot.

QUÉ HACE PUMA CODE (tu rubro):
- Desarrollo web a medida, apps nativas y sistemas de gestión.
- SaaS a medida (ej: el sistema de gestión y reservas que hicimos para "Good Trip Car Rentals": flota, reservas, panel admin, multi-idioma, pagos e IA).
- IoT y telemetría, e integraciones con IA / Machine Learning.
- Clientes típicos: bodegas y viñedos, minería, logística y transporte, retail e inventario/stock, alquiler de autos y pymes en general.
- CEO: Roberto.

ALCANCE (REGLA ESTRICTA E INVIOLABLE):
- SOLO conversás sobre proyectos de software y los servicios de Puma Code, y sobre entender qué necesita el cliente para su web/app/sistema.
- Si te preguntan algo ajeno al rubro (recetas, política, salud, tareas escolares, consejos personales, traducciones, código que no es para su proyecto, etc.), NO respondas el pedido: redirigí con amabilidad y un poco de humor mendocino hacia su proyecto de software.
- No hagas de asistente general ni de buscador. Tu única misión es entender el proyecto del cliente.

IDIOMA: Responde en ${selectedLanguage}.

PERSONALIDAD:
- Sé breve y directo. Evita respuestas largas o listas de puntos aburridas.
- Habla como un humano: frases cortas, amable y cercano (estilo mendocino si es español).
- ADAPTACIÓN: Si el cliente sabe de código, habla técnico. Si es dueño de un negocio (bodega, camiones, local, etc.), habla de soluciones, orden y productividad sin tecnicismos.

DINÁMICA DE CHARLA:
- Tu meta es entender qué necesita para que Roberto (el CEO) pueda presupuestar después.
- No presiones. Charla lo necesario para que el cliente se sienta cómodo.
- Si te pide el presupuesto o ya te contó lo importante, decile algo natural como: "Buenísimo, con esto ya me doy una idea clara. ¿Querés que le pase el reporte a Roberto?" o "Dale, apretá el botón de enviar y nos ponemos con eso".

REGLA DE ORO: Respuestas cortas, humanas y sin sonar a manual de instrucciones.`,
        },
        ...cleanMessages,
      ],
    });

    return res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('❌ Error chatWithAI:', error);
    return res.status(500).json({ error: 'No se pudo procesar el mensaje. Intentá de nuevo.' });
  }
};

exports.analyzeProject = async (req, res) => {
  try {
    const { chatHistory, userData, language } = req.body || {};
    const cleanHistory = sanitizeMessages(chatHistory);

    if (!cleanHistory) {
      return res.status(400).json({ success: false, error: 'chatHistory inválido.' });
    }
    if (!userData || !isValidEmail(userData.email) || typeof userData.name !== 'string' || !userData.name.trim()) {
      return res.status(400).json({ success: false, error: 'Datos de contacto inválidos.' });
    }

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `Eres el CTO Analista de Puma Code (estudio de software a medida de Mendoza, Argentina). Analiza el chat y arma los datos para un presupuesto en USD usando estas escalas de referencia:

1. ESCALA LOCAL (Mendoza / Argentina · pymes y emprendimientos familiares):
   - Landing simple / one-page: USD 250 - 450
   - Web institucional con secciones + panel básico: USD 450 - 800
   - Gestión de stock / turnos / reservas básica: USD 600 - 1.000
   - SaaS completo a medida (gestión integral estilo "Good Trip Car Rentals": reservas, flota/inventario, panel admin, multi-idioma, pagos online e IA): USD 1.200 - 2.500

2. ESCALA GLOBAL (empresas grandes, startups o clientes del exterior):
   - Webs premium: USD 800 - 1.500
   - Sistemas complejos / SaaS / IA: USD 2.500 - 6.000+

CRITERIO DE PERFIL:
- "Local Mendoza" si el cliente es de Argentina / Mendoza, menciona negocios locales o pagaría en pesos.
- "Global Estándar" si es startup, empresa de software, cliente del exterior o habla en inglés.

IMPORTANTE:
- presupuesto_usd_min y presupuesto_usd_max deben ser NÚMEROS enteros en USD (sin símbolos ni separadores), porque el sistema convierte a pesos y calcula cuotas automáticamente.
- Estima los costos recurrentes que pagará el cliente directamente a los proveedores: costo_openai_usd_mensual (consumo mensual de IA según la cantidad de consultas a la API; típico 5-40; usa 0 si el proyecto NO usa IA) y costo_dominio_usd_anual (típico 12-20). El costo de Railway lo fija el sistema, no lo estimes.
- estrategia_crecimiento: escríbela DIRIGIDA AL CLIENTE (no a Roberto), en segunda persona, explicando cómo este software lo ayuda a crecer, escalar y profesionalizar su empresa. Tono comercial, motivador y concreto.

Responde estrictamente en JSON:
{
  "nombre_proyecto": "string",
  "perfil_cliente": "Local Mendoza" | "Global Estándar",
  "resumen_pactado": "Resumen detallado de funciones solicitadas, redactado de forma clara para el cliente",
  "tecnologias": ["lista"],
  "presupuesto_usd_min": 1200,
  "presupuesto_usd_max": 2500,
  "tiempo_entrega": "10",
  "costo_openai_usd_mensual": 15,
  "costo_dominio_usd_anual": 15,
  "estrategia_crecimiento": "Texto en segunda persona dirigido al cliente"
}`,
        },
        { role: 'user', content: `Analiza este historial: ${JSON.stringify(cleanHistory)}` },
      ],
      response_format: { type: 'json_object' },
    });

    let analysis;
    try {
      analysis = JSON.parse(response.choices[0].message.content);
    } catch (parseErr) {
      console.error('❌ JSON inválido de la IA:', parseErr);
      return res.status(502).json({ success: false, error: 'Respuesta de IA con formato inesperado.' });
    }

    const perfil = String(analysis.perfil_cliente || 'Sin perfil');
    const tecnologias = Array.isArray(analysis.tecnologias) ? analysis.tecnologias : [];
    const esLocal = perfil.toLowerCase().includes('local');

    // Idioma del mail: el del chat. Local sin idioma soportado -> es; global -> en.
    const L = T[language] || (esLocal ? T.es : T.en);
    const clientName = String(userData.name).trim();
    const proyecto = analysis.nombre_proyecto || (esLocal ? 'tu proyecto' : 'your project');

    const usdMin = Math.max(0, Number(analysis.presupuesto_usd_min) || 0);
    const usdMax = Math.max(usdMin, Number(analysis.presupuesto_usd_max) || usdMin);
    const usdMid = usdMin && usdMax ? Math.round((usdMin + usdMax) / 2) : usdMax || usdMin;

    const weeksDisplay = (String(analysis.tiempo_entrega || '').match(/\d+/) || [])[0] || String(analysis.tiempo_entrega || '-');

    const railwayUsd = RAILWAY_USD_MES; // fijo, plan estándar
    const openaiUsd = numOr(analysis.costo_openai_usd_mensual, FALLBACK_OPENAI_USD_MES);
    const dominioUsd = numOr(analysis.costo_dominio_usd_anual, FALLBACK_DOMINIO_USD_ANIO);
    const dominioMensual = dominioUsd / 12;
    const totalMensual = railwayUsd + openaiUsd + dominioMensual;

    // Dólar (solo necesario para mostrar pesos en clientes locales).
    let dolar = null;
    if (esLocal) dolar = await getDollarRate();
    const arsOf = (usd) => (dolar ? usd * dolar.value : null);
    // Muestra USD y, si es local, el equivalente en pesos entre paréntesis.
    const dual = (usd) => (esLocal ? `${fmtUSD(usd)} (${fmtARS(arsOf(usd))})` : fmtUSD(usd));

    // ---------- BLOQUE INVERSIÓN (precio del desarrollo) ----------
    let precioHtml = '';
    if (esLocal && usdMid > 0) {
      const arsMin = arsOf(usdMin), arsMax = arsOf(usdMax), arsMid = arsOf(usdMid);
      const planes = buildPlanes(arsMid);
      const anticipo = arsMid * 0.5;
      precioHtml = `
        <div style="margin-top: 14px;">
          <span style="font-size: 22px; font-weight: 900; color: #059669;">${escapeHtml(fmtARS(arsMin))} – ${escapeHtml(fmtARS(arsMax))}</span>
          <span style="margin-left: 8px; color: #64748b; font-size: 13px;">| ${escapeHtml(L.contado)} · ${escapeHtml(L.plazoLabel)}: ${escapeHtml(String(analysis.tiempo_entrega || '-'))} ${escapeHtml(L.weeks)}</span>
        </div>
        <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8;">
          ${escapeHtml(L.equivale)} ${escapeHtml(fmtUSD(usdMin))} – ${escapeHtml(fmtUSD(usdMax))} · ${escapeHtml(L.tcLabel)}: ${escapeHtml(fmtARS(dolar.value))}${dolar.fallback ? escapeHtml(L.fallbackTC) : ''}
        </p>
        <div style="margin-top: 14px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;">
          <p style="margin: 0 0 8px; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold;">${escapeHtml(L.planCaption(fmtARS(arsMid)))}</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 0; color: #111827;"><b>${escapeHtml(L.contado)}</b></td>
              <td style="padding: 6px 0; text-align: right; color: #059669; font-weight: bold;">${escapeHtml(fmtARS(planes.contado))}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 0; color: #111827;">${escapeHtml(L.cuotas3)} <span style="color:#94a3b8;">(+${escapeHtml(planes.plan3.recargo)})</span></td>
              <td style="padding: 6px 0; text-align: right; color: #111827;">3 × ${escapeHtml(fmtARS(planes.plan3.cuota))} <span style="color:#94a3b8;">= ${escapeHtml(fmtARS(planes.plan3.total))}</span></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #111827;">${escapeHtml(L.cuotas6)} <span style="color:#94a3b8;">(+${escapeHtml(planes.plan6.recargo)})</span></td>
              <td style="padding: 6px 0; text-align: right; color: #111827;">6 × ${escapeHtml(fmtARS(planes.plan6.cuota))} <span style="color:#94a3b8;">= ${escapeHtml(fmtARS(planes.plan6.total))}</span></td>
            </tr>
          </table>
          <p style="margin: 10px 0 0; font-size: 12px; color: #475569;">${L.pago5050(escapeHtml(fmtARS(anticipo)))}</p>
        </div>`;
    } else {
      const anticipo = usdMid * 0.5;
      precioHtml = `
        <div style="margin-top: 14px;">
          <span style="font-size: 24px; font-weight: 900; color: #059669;">${escapeHtml(fmtUSD(usdMin))} – ${escapeHtml(fmtUSD(usdMax))}</span>
          <span style="margin-left: 10px; color: #64748b; font-size: 13px;">| ${escapeHtml(L.plazoLabel)}: ${escapeHtml(String(analysis.tiempo_entrega || '-'))} ${escapeHtml(L.weeks)}</span>
        </div>
        <p style="margin: 10px 0 0; font-size: 12px; color: #475569;">${L.pago5050(escapeHtml(fmtUSD(anticipo)))}</p>`;
    }

    // ---------- BLOQUE "TU SOFTWARE ES TUYO" ----------
    const ownHtml = `
      <div style="padding: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; margin: 18px 0;">
        <p style="margin: 0 0 10px; color: #047857; font-weight: bold; font-size: 15px;">${escapeHtml(L.ownTitle)}</p>
        <ul style="margin: 0; padding-left: 18px; color: #065f46; font-size: 13px; line-height: 1.7;">
          ${L.ownBullets(clientName).map((b) => `<li>${b}</li>`).join('')}
        </ul>
      </div>`;

    // ---------- BLOQUE COSTOS MENSUALES (independencia) ----------
    const openaiRows = openaiUsd > 0
      ? `<tr style="border-bottom: 1px solid #dbeafe;">
            <td style="padding: 7px 0; color: #1e3a8a;">${escapeHtml(L.openaiLabel)}</td>
            <td style="padding: 7px 0; text-align: right; color: #111827; font-weight: bold;">${dual(openaiUsd)} <span style="color:#94a3b8; font-weight:normal;">${escapeHtml(L.perMonth)}</span></td>
          </tr>
          <tr style="border-bottom: 1px solid #dbeafe;"><td colspan="2" style="padding: 0 0 8px; color: #64748b; font-size: 11px; line-height:1.5;">${escapeHtml(L.openaiCredit(fmtUSD(OPENAI_CARGA_INICIAL), fmtUSD(OPENAI_UMBRAL), fmtUSD(OPENAI_RECARGA)))}</td></tr>`
      : `<tr style="border-bottom: 1px solid #dbeafe;">
            <td style="padding: 7px 0; color: #1e3a8a;">${escapeHtml(L.openaiLabel)}</td>
            <td style="padding: 7px 0; text-align: right; color: #111827; font-weight: bold;">${escapeHtml(L.noIA)}</td>
          </tr>`;

    const monthlyHtml = `
      <div style="padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; margin: 18px 0;">
        <p style="margin: 0 0 8px; color: #1d4ed8; font-weight: bold; font-size: 15px;">${escapeHtml(L.monthlyTitle)}</p>
        <p style="margin: 0 0 12px; color: #1e3a8a; font-size: 13px; line-height: 1.6;">${L.monthlyIntro}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #dbeafe;">
            <td style="padding: 7px 0; color: #1e3a8a;">${escapeHtml(L.railwayLabel)}</td>
            <td style="padding: 7px 0; text-align: right; color: #111827; font-weight: bold;">${dual(railwayUsd)} <span style="color:#94a3b8; font-weight:normal;">${escapeHtml(L.perMonth)}</span></td>
          </tr>
          ${openaiRows}
          <tr>
            <td style="padding: 7px 0; color: #1e3a8a;">${escapeHtml(L.domainLabel)}</td>
            <td style="padding: 7px 0; text-align: right; color: #111827; font-weight: bold;">${dual(dominioUsd)} <span style="color:#94a3b8; font-weight:normal;">${escapeHtml(L.perYear)}</span></td>
          </tr>
          <tr><td colspan="2" style="padding: 0 0 8px; color: #64748b; font-size: 11px;">${escapeHtml(L.domainMonthlyHint(dual(dominioMensual)))}</td></tr>
          <tr style="border-top: 2px solid #1d4ed8;">
            <td style="padding: 9px 0 0; color: #1d4ed8; font-weight: 900;">${escapeHtml(L.totalLabel)}</td>
            <td style="padding: 9px 0 0; text-align: right; color: #1d4ed8; font-weight: 900; font-size: 16px;">${dual(totalMensual)} <span style="font-size:11px; font-weight:normal;">${escapeHtml(L.perMonth)}</span></td>
          </tr>
        </table>
        <p style="margin: 8px 0 0; font-size: 11px; color: #64748b; line-height:1.5;">${escapeHtml(L.totalSub)}</p>
        <p style="margin: 6px 0 0; font-size: 11px; color: #64748b; line-height:1.5;">${escapeHtml(L.usageNote)}</p>
      </div>`;

    // ---------- BLOQUE METODOLOGÍA POR SPRINTS ----------
    const processHtml = `
      <div style="padding: 16px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; margin: 18px 0;">
        <p style="margin: 0 0 8px; color: #7e22ce; font-weight: bold; font-size: 15px;">${escapeHtml(L.processTitle)}</p>
        <p style="margin: 0 0 12px; color: #6b21a8; font-size: 13px; line-height: 1.6;">${L.processIntro(escapeHtml(weeksDisplay))}</p>
        <ul style="margin: 0; padding-left: 18px; color: #581c87; font-size: 13px; line-height: 1.7;">
          ${L.processBullets.map((b) => `<li>${b}</li>`).join('')}
        </ul>
      </div>`;

    // ---------- CHAT ----------
    const chatHtml = cleanHistory
      .map(
        (m) => `
        <div style="margin-bottom: 8px; padding: 10px; border-radius: 8px; background: ${m.role === 'user' ? '#f0f9ff' : '#f3f4f6'};">
          <small style="color: #6b7280; font-size: 10px;">${m.role === 'user' ? escapeHtml(clientName) : escapeHtml(L.assistantName)}</small>
          <p style="margin: 4px 0; font-size: 13px;">${escapeHtml(m.content)}</p>
        </div>`
      )
      .join('');

    // Asunto para vos (Roberto): claro de que está listo para reenviar.
    const subject = `📤 Listo para reenviar · ${escapeHtml(proyecto)} · ${escapeHtml(clientName)} (${escapeHtml(perfil)})`;

    await resend.emails.send({
      from: 'Puma Code <onboarding@resend.dev>',
      to: process.env.EMAIL_TO,
      replyTo: userData.email,
      subject,
      html: `
        <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 620px; margin: 0 auto; color: #111827;">
          <div style="background: linear-gradient(135deg,#1d4ed8,#2563eb); padding: 24px; border-radius: 16px 16px 0 0;">
            <p style="margin: 0; color: #bfdbfe; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">🐆 Puma Code</p>
            <h1 style="margin: 6px 0 0; color: #ffffff; font-size: 22px;">${escapeHtml(L.reportTitle)}</h1>
          </div>

          <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
            <h2 style="margin: 0 0 6px; font-size: 20px; color: #111827;">${escapeHtml(L.greeting(clientName))}</h2>
            <p style="margin: 0 0 18px; color: #475569; font-size: 14px; line-height: 1.6;">${L.intro(escapeHtml(proyecto))}</p>

            <h3 style="margin: 0 0 6px; color: #1d4ed8; font-size: 15px;">${escapeHtml(L.buildTitle)}</h3>
            <p style="margin: 0 0 12px; line-height: 1.6; font-size: 14px; color: #1f2937;">${escapeHtml(analysis.resumen_pactado || '-')}</p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #64748b;"><b>${escapeHtml(L.stackLabel)}:</b> ${tecnologias.map(escapeHtml).join(' • ')}</p>

            <div style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 18px 0;">
              <p style="margin: 0; color: #111827; font-weight: bold; font-size: 15px;">${escapeHtml(L.investTitle)}</p>
              ${precioHtml}
              <p style="margin: 12px 0 0; font-size: 11px; color: #64748b; line-height: 1.5;">✅ ${escapeHtml(L.includedNote)}</p>
            </div>

            ${ownHtml}
            ${monthlyHtml}
            ${processHtml}

            <div style="padding: 16px; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 10px; margin: 18px 0;">
              <p style="margin: 0 0 6px; color: #c2410c; font-weight: bold; font-size: 15px;">${escapeHtml(L.growthTitle)}</p>
              <p style="margin: 0; color: #9a3412; font-size: 13px; line-height: 1.6;">${escapeHtml(analysis.estrategia_crecimiento || '-')}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 26px 0;">
            <h4 style="margin: 0 0 10px; color: #9ca3af; font-size: 13px;">${escapeHtml(L.chatTitle)}</h4>
            ${chatHtml}

            <p style="margin: 24px 0 0; text-align: center; color: #9ca3af; font-size: 11px;">${escapeHtml(L.footer)}</p>
          </div>
        </div>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error analyzeProject:', error);
    return res.status(500).json({ success: false, error: 'No se pudo generar el análisis.' });
  }
};