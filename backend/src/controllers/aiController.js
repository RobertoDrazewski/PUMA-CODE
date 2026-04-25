const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { messages, userData } = req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Modelo ultra rápido
            messages: [
                { 
                    role: "system", 
                    content: `Eres el Asesor Comercial de Puma Code. Hablas con ${userData?.name || 'un cliente'}.
                    REGLAS: Máximo 2 frases. Cero tecnicismos. Estilo Mendoza: profesional y cercano.` 
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

exports.analyzeProject = async (req, res) => {
    try {
        // Soporte para el modo "text/plain" que enviamos desde el móvil
        let data = req.body;
        if (typeof data === 'string') data = JSON.parse(data);
        
        const { chatHistory, userData } = data;
        
        // 1. Respondemos inmediatamente al cliente para que el móvil no de timeout
        // Esto libera al navegador del celular mientras el servidor sigue trabajando
        res.status(200).json({ success: true, message: "Procesando de fondo" });

        // --- TODO LO QUE SIGUE SE EJECUTA EN EL SERVIDOR SIN BLOQUEAR AL MÓVIL ---
        
        console.log(`🤖 Iniciando análisis para: ${userData.name}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista de Puma Code. 
                    ESTRATEGIA: Mínimo $450 USD (Landings), Gestión $800-$1800 USD, Pro $2500+.
                    Responde ÚNICAMENTE en JSON.` 
                },
                { role: "user", content: `Analiza este lead: ${JSON.stringify({ userData, chatHistory })}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);
        const stack = Array.isArray(analysis.stack_tecnico) ? analysis.stack_tecnico : ["Stack a definir"];

        // 2. Envío de mail asíncrono
        await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email, 
            subject: `🚀 NUEVA OPORTUNIDAD: ${analysis.nombre_proyecto}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; border: 2px solid #2563eb; padding: 20px; border-radius: 12px;">
                    <h2 style="color: #2563eb;">🐆 Puma Code: Nuevo Lead</h2>
                    <p><strong>Cliente:</strong> ${userData.name} (${userData.email})</p>
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
                        <p><strong>Proyecto:</strong> ${analysis.nombre_proyecto}</p>
                        <p><strong>Precio Sugerido:</strong> <span style="color: #059669; font-weight: bold;">${analysis.precio_sugerido}</span></p>
                        <p><strong>Plazo:</strong> ${analysis.tiempo_estimado}</p>
                    </div>
                    <p><strong>Resumen:</strong> ${analysis.resumen_ejecutivo_para_roberto}</p>
                </div>
            `
        });

        console.log("✅ Proceso completado y mail enviado.");

    } catch (error) {
        // Como ya respondimos al cliente, solo logueamos el error internamente
        console.error("❌ Error en proceso asíncrono:", error.message);
    }
};