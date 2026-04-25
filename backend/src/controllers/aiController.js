const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

exports.analyzeProject = async (req, res) => {
    try {
        // Normalización de datos para PC/Móvil
        let data = req.body;
        if (typeof data === 'string') data = JSON.parse(data);
        const { chatHistory, userData } = data;

        if (!userData || !chatHistory) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        // 1. LLAMADA A OPENAI CON PROMPT REFORZADO
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista de Puma Code. Tu cliente es Roberto (dueño).
                    Analiza la charla y genera un reporte técnico-comercial detallado.
                    
                    ESTRATEGIA DE PRECIOS:
                    - Landing / Web Simple: $450 - $900 USD.
                    - Apps Gestión / Stock / Dashboards: $1200 - $2500 USD.
                    - E-commerce / Sistemas Complejos: $3000+ USD.
                    - Ticket Mínimo Absoluto: $450 USD.
                    
                    TIEMPOS: Usa siempre SEMANAS (ej: "3-4 semanas"). Mínimo 2 semanas.
                    
                    Responde estrictamente en JSON con este formato:
                    {
                      "nombre_proyecto": "Nombre corto y profesional",
                      "precio_sugerido": "Monto en USD con rango",
                      "tiempo_estimado": "Semanas estimadas",
                      "stack_tecnico": ["Lista", "de", "tecnologías"],
                      "puntos_clave": ["Funcionalidad 1", "Funcionalidad 2"],
                      "resumen_ejecutivo": "Análisis para Roberto sobre la viabilidad y el perfil del cliente."
                    }` 
                },
                { role: "user", content: `Analiza este lead: ${JSON.stringify(chatHistory)}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        // 2. CONFIGURACIÓN DEL DESTINATARIO
        const recipient = process.env.EMAIL_TO || 'tu-correo@ejemplo.com';

        // 3. CUERPO DEL MAIL PROFESIONAL (Restaurado)
        const { error } = await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: recipient,
            replyTo: userData.email, // Para que al darle a "Responder" le escribas al cliente
            subject: `🚀 NUEVA OPORTUNIDAD: ${analysis.nombre_proyecto} - ${userData.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; border: 2px solid #2563eb; padding: 25px; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
                    <h2 style="color: #2563eb; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">🐆 Puma Code: Reporte de Lead</h2>
                    
                    <p style="margin-bottom: 5px;"><strong>Cliente:</strong> ${userData.name}</p>
                    <p style="margin-top: 0;"><strong>Email:</strong> <a href="mailto:${userData.email}">${userData.email}</a></p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; color: #0f172a; font-size: 18px;">${analysis.nombre_proyecto}</h3>
                        <p style="font-size: 22px; font-weight: bold; color: #059669; margin: 10px 0;">${analysis.precio_sugerido}</p>
                        <p style="margin: 0; color: #64748b;"><strong>Tiempo estimado:</strong> ${analysis.tiempo_estimado}</p>
                    </div>
                    
                    <h4 style="color: #334155; margin-bottom: 10px;">Stack Tecnológico Sugerido:</h4>
                    <div style="margin-bottom: 20px;">
                        ${analysis.stack_tecnico.map(tech => `<span style="display: inline-block; background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 4px; margin-right: 5px; margin-bottom: 5px; font-size: 12px; font-weight: bold; border: 1px solid #bfdbfe;">${tech}</span>`).join('')}
                    </div>

                    <h4 style="color: #334155; margin-bottom: 10px;">Funcionalidades Detectadas:</h4>
                    <ul style="padding-left: 20px; color: #475569;">
                        ${analysis.puntos_clave.map(point => `<li>${point}</li>`).join('')}
                    </ul>

                    <h4 style="color: #334155; margin-bottom: 5px;">Resumen para Roberto:</h4>
                    <p style="font-style: italic; color: #475569; background: #fffaf0; padding: 15px; border-left: 4px solid #f59e0b; margin-top: 0;">
                        "${analysis.resumen_ejecutivo}"
                    </p>

                    <div style="margin-top: 30px; padding: 15px; background: #2563eb; border-radius: 8px; text-align: center;">
                        <a href="mailto:${userData.email}" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">📩 Responder al cliente ahora</a>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("❌ Error de Resend:", error);
            return res.status(500).json({ success: false });
        }

        console.log("✅ Reporte detallado enviado.");
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error.message);
        res.status(500).json({ success: false });
    }
};