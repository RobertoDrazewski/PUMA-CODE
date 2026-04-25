const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// --- 1. CHAT: AYUDA AL CLIENTE SIN SOLTAR PRESUPUESTOS ---
exports.chatWithAI = async (req, res) => {
    try {
        const { messages, userData } = req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el Asesor Técnico de Puma Code. 
                    TU MISIÓN: Ayudar a ${userData?.name} a definir las funcionalidades de su software.
                    REGLA DE ORO: NUNCA des presupuestos, precios ni tiempos de entrega en este chat. 
                    Si el cliente pregunta por costos, dile que "Roberto (el CEO) analizará los requerimientos y le enviará una propuesta formal por mail".
                    Habla de forma profesional y cercana (estilo Mendoza). Máximo 2 o 3 frases.` 
                },
                ...messages
            ],
        });
        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error("❌ Error en Chat:", error.message);
        res.status(500).json({ error: "Error en el chat" });
    }
};

// --- 2. ANÁLISIS: REPORTE EXCLUSIVO PARA ROBERTO ---
exports.analyzeProject = async (req, res) => {
    try {
        let data = req.body;
        if (typeof data === 'string') data = JSON.parse(data);
        const { chatHistory, userData } = data;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista. Analiza el chat y genera un reporte privado para Roberto.
                    ESTRATEGIA: Landings $450+, Gestión $1200-$2500, Sistemas $3000+.
                    Responde en JSON:
                    {
                      "nombre": "string",
                      "precio": "string",
                      "tiempo": "string",
                      "stack": ["tecnología1", "tecnología2"],
                      "puntos": ["funcionalidad1", "funcionalidad2"],
                      "nota": "Breve análisis del perfil del cliente"
                    }` 
                },
                { role: "user", content: `Analiza: ${JSON.stringify(chatHistory)}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        // Convertimos los arrays a HTML para evitar el [object Object]
        const stackHtml = analysis.stack.map(s => `<li style="color: #1e40af;">${s}</li>`).join('');
        const puntosHtml = analysis.puntos.map(p => `<li>${p}</li>`).join('');

        await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email,
            subject: `🚀 NUEVO PROYECTO: ${analysis.nombre} - ${userData.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; border: 2px solid #2563eb; padding: 25px; border-radius: 12px;">
                    <h2 style="color: #2563eb;">Reporte para Roberto</h2>
                    <p><strong>Cliente:</strong> ${userData.name} (${userData.email})</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <p style="font-size: 18px; color: #059669; font-weight: bold;">Presupuesto Sugerido: ${analysis.precio}</p>
                        <p><strong>Tiempo:</strong> ${analysis.tiempo}</p>
                    </div>
                    <h4>Stack Sugerido:</h4>
                    <ul>${stackHtml}</ul>
                    <h4>Funcionalidades Detectadas:</h4>
                    <ul>${puntosHtml}</ul>
                    <p><strong>Análisis de la IA:</strong> <em>${analysis.nota}</em></p>
                    <hr>
                    <p style="font-size: 12px; color: #94a3b8;">Este reporte es privado. El cliente no ha visto estos números.</p>
                </div>`
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Error en Analyze:", error.message);
        res.status(500).json({ success: false });
    }
};