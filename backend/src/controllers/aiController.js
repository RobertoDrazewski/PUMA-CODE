const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// gpt-4o suele ser más rápido y barato que gpt-4-turbo con calidad similar.
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Límites para controlar costos y abuso.
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 4000;

// Escapa HTML para evitar inyección en el email que te llega.
// (Sin esto, un cliente podría meter <script>, links o estilos en tu correo.)
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
          content: `Eres parte del equipo de Puma Code. No parezcas un bot.

IDIOMA: Responde en ${selectedLanguage}.
PERSONALIDAD:
- Sé breve y directo. Evita respuestas largas o listas de puntos aburridas.
- Habla como un humano: frases cortas, amable y cercano (estilo mendocino si es español).
- ADAPTACIÓN: Si el cliente sabe de código, habla técnico. Si es dueño de un negocio (camiones, bodega, etc.), habla de soluciones, orden y productividad sin tecnicismos.

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
    // Log completo del lado del servidor, mensaje genérico para el cliente.
    console.error('❌ Error chatWithAI:', error);
    return res.status(500).json({ error: 'No se pudo procesar el mensaje. Intentá de nuevo.' });
  }
};

exports.analyzeProject = async (req, res) => {
  try {
    const { chatHistory, userData } = req.body || {};
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
          content: `Eres el CTO Analista de Puma Code. Analiza el chat y define un presupuesto bajo dos escalas:

1. ESCALA LOCAL (Mendoza / Pymes familiares):
   - Landings simples: $250 - $400 USD.
   - Gestión de stock/turnos básicos: $600 - $900 USD.

2. ESCALA GLOBAL (Empresas grandes o exterior):
   - Webs premium: $500 - $1000 USD.
   - Sistemas complejos / SaaS / IA: $1500 - $5000+ USD.

CRITERIO: Si menciona negocios locales de Mendoza ("mi bodega", "mi local", "emprendimiento familiar"), usa ESCALA LOCAL. Si es startup, empresa de software o habla inglés, usa ESCALA GLOBAL.

Responde estrictamente en JSON:
{
  "nombre_proyecto": "string",
  "perfil_cliente": "Local Mendoza / Global Estándar",
  "resumen_pactado": "Resumen detallado de funciones solicitadas",
  "tecnologias": ["lista"],
  "presupuesto_estimado": "Monto en USD",
  "tiempo_entrega": "Semanas",
  "estrategia_venta": "Consejo para Roberto"
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

    // Valores seguros por si la IA omite algún campo.
    const perfil = String(analysis.perfil_cliente || 'Sin perfil');
    const tecnologias = Array.isArray(analysis.tecnologias) ? analysis.tecnologias : [];
    const esLocal = perfil.toLowerCase().includes('local');

    const chatHtml = cleanHistory
      .map(
        (m) => `
        <div style="margin-bottom: 8px; padding: 10px; border-radius: 8px; background: ${m.role === 'user' ? '#f0f9ff' : '#f3f4f6'};">
          <small style="color: #6b7280; font-size: 10px;">${m.role === 'user' ? escapeHtml(userData.name) : 'IA PUMA'}</small>
          <p style="margin: 4px 0; font-size: 13px;">${escapeHtml(m.content)}</p>
        </div>`
      )
      .join('');

    await resend.emails.send({
      from: 'Puma Code Leads <onboarding@resend.dev>',
      to: process.env.EMAIL_TO,
      replyTo: userData.email,
      subject: `🔥 ${escapeHtml(perfil)}: ${escapeHtml(analysis.nombre_proyecto || 'Proyecto')} - ${escapeHtml(userData.name)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #111827;">
          <h2 style="color: #2563eb;">🐆 Reporte Estratégico Puma Code</h2>

          <div style="padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Perfil detectado:</p>
            <p style="font-size: 18px; font-weight: bold; color: ${esLocal ? '#0ea5e9' : '#8b5cf6'};">${escapeHtml(perfil)}</p>
            <div style="margin-top: 15px;">
              <span style="font-size: 24px; font-weight: 900; color: #059669;">${escapeHtml(analysis.presupuesto_estimado || '-')}</span>
              <span style="margin-left: 10px; color: #64748b;">| Plazo: ${escapeHtml(analysis.tiempo_entrega || '-')}</span>
            </div>
          </div>

          <h3>📌 Resumen de Necesidades:</h3>
          <p style="line-height: 1.6;">${escapeHtml(analysis.resumen_pactado || '-')}</p>

          <h4>🛠 Stack & Funciones:</h4>
          <p>${tecnologias.map(escapeHtml).join(' • ')}</p>

          <div style="padding: 15px; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #c2410c;"><b>💡 Estrategia para Roberto:</b> ${escapeHtml(analysis.estrategia_venta || '-')}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <h4 style="color: #9ca3af;">Historial de Conversación:</h4>
          ${chatHtml}
        </div>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error analyzeProject:', error);
    return res.status(500).json({ success: false, error: 'No se pudo generar el análisis.' });
  }
};