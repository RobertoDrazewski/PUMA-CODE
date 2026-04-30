const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { messages, userData, language } = req.body;
        const languageNames = { es: "Spanish", en: "English", pt: "Portuguese" };
        const selectedLanguage = languageNames[language] || "Spanish";

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres parte del equipo de Puma Code. No parezcas un bot.
                    
                    IDIOMA: Responde en ${selectedLanguage}.
                    PERSONALIDAD:
                    - Sé breve y directo. Evita respuestas largas o listas de puntos aburridas.
                    - Habla como un humano: usa frases cortas, sé amable y cercano (estilo Mendocino si es español).
                    - ADAPTACIÓN: Si el cliente sabe de código, habla técnico. Si el cliente es un dueño de negocio (ej. tiene camiones o una bodega), habla de soluciones, orden y productividad sin usar palabras complejas.
                    
                    DINÁMICA DE CHARLA:
                    - Tu meta es entender qué necesita para que Roberto (el CEO) pueda presupuestar después.
                    - No presiones. Charla lo que haga falta para que el cliente se sienta cómodo.
                    - Si el cliente te pide el presupuesto o notas que ya te contó todo lo importante, dile algo natural como: "Buenísimo, con esto ya me doy una idea clara. ¿Querés que le pase el reporte a Roberto para que lo vea?" o "Dale, apretá el botón de enviar y nos ponemos con eso".
                    
                    REGLA DE ORO: Respuestas cortas, humanas y sin sonar a manual de instrucciones.`
                },
                ...messages
            ],
        });
        res.json({ reply: response.choices[0].message.content });
    } catch (error) { 
        res.status(500).json({ error: "Error" }); 
    }
};

exports.analyzeProject = async (req, res) => {
    try {
        const { chatHistory, userData } = req.body;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista de Puma Code. Tu misión es analizar el chat y definir un presupuesto bajo dos escalas de precios:

                    1. ESCALA LOCAL (Mendoza/Pymes Familiares):
                       - Landings Simples: $250 - $400 USD.
                       - Gestión de Stock/Turnos básicos: $600 - $900 USD.
                       - Objetivo: Ayudar al crecimiento local con precios accesibles.

                    2. ESCALA ESTÁNDAR GLOBAL (Empresas grandes o exterior):
                       - Webs Premium: $500 - $1000 USD.
                       - Sistemas complejos/SaaS/IA: $1500 - $5000+ USD.
                    
                    CRITERIO: Si el cliente menciona negocios locales de Mendoza (ej: "mi bodega", "mi local en el centro", "emprendimiento familiar"), usa la ESCALA LOCAL. Si es una startup, empresa de software o habla inglés, usa ESCALA GLOBAL.

                    Responde estrictamente en JSON:
                    {
                      "nombre_proyecto": "string",
                      "perfil_cliente": "Local Mendoza / Global Estándar",
                      "resumen_pactado": "Resumen detallado de funciones solicitadas",
                      "tecnologias": ["lista"],
                      "presupuesto_estimado": "Monto en USD",
                      "tiempo_entrega": "Semanas",
                      "estrategia_venta": "Consejo para Roberto"
                    }` 
                },
                { role: "user", content: `Analiza este historial: ${JSON.stringify(chatHistory)}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        // Formateo del Chat para el Email
        const chatHtml = chatHistory.map(m => `
            <div style="margin-bottom: 8px; padding: 10px; border-radius: 8px; background: ${m.role === 'user' ? '#f0f9ff' : '#f3f4f6'};">
                <small style="color: #6b7280; font-size: 10px;">${m.role === 'user' ? userData.name : 'IA PUMA'}</small>
                <p style="margin: 4px 0; font-size: 13px;">${m.content}</p>
            </div>
        `).join('');

        await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email,
            subject: `🔥 ${analysis.perfil_cliente}: ${analysis.nombre_proyecto} - ${userData.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; color: #111827;">
                    <h2 style="color: #2563eb;">🐆 Reporte Estratégico Puma Code</h2>
                    
                    <div style="padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Perfil detectado:</p>
                        <p style="font-size: 18px; font-weight: bold; color: ${analysis.perfil_cliente.includes('Local') ? '#0ea5e9' : '#8b5cf6'};">${analysis.perfil_cliente}</p>
                        
                        <div style="margin-top: 15px;">
                            <span style="font-size: 24px; font-weight: 900; color: #059669;">${analysis.presupuesto_estimado}</span>
                            <span style="margin-left: 10px; color: #64748b;">| Plazo: ${analysis.tiempo_entrega}</span>
                        </div>
                    </div>

                    <h3>📌 Resumen de Necesidades:</h3>
                    <p style="line-height: 1.6;">${analysis.resumen_pactado}</p>

                    <h4>🛠 Stack & Funciones:</h4>
                    <p>${analysis.tecnologias.join(' • ')}</p>

                    <div style="padding: 15px; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #c2410c;"><b>💡 Estrategia para Roberto:</b> ${analysis.estrategia_venta}</p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <h4 style="color: #9ca3af;">Historial de Conversación:</h4>
                    ${chatHtml}
                </div>`
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error Analyze:", error);
        res.status(500).json({ success: false });
    }
};