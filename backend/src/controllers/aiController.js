const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { messages, userData } = req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
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
        // 1. Captura y normalización de datos (Soporte para JSON y texto plano del móvil)
        let data = req.body;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { console.error("Error parseando body string"); }
        }
        
        const { chatHistory, userData } = data;

        // Validación preventiva
        if (!userData || !chatHistory) {
            console.error("❌ Datos insuficientes recibidos en analyzeProject");
            return res.status(400).json({ success: false, message: "Datos incompletos" });
        }
        
        // 2. Respuesta inmediata para que el celular muestre la pantalla de éxito
        res.status(200).json({ success: true });

        // --- PROCESO ASÍNCRONO DE FONDO ---
        console.log(`🤖 Analizando lead para Roberto. Cliente: ${userData.name}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista de Puma Code. Responde estrictamente en JSON.
                    Esquema requerido:
                    {
                      "nombre_proyecto": "string",
                      "precio_sugerido": "string",
                      "tiempo_estimado": "string",
                      "resumen_ejecutivo": "string",
                      "stack": ["string"]
                    }
                    ESTRATEGIA: Landings $450+, Gestión $800-$1800, Pro $2500+. Usa USD.` 
                },
                { role: "user", content: `Analiza esta charla: ${JSON.stringify(chatHistory)}` }
            ],
            response_format: { type: "json_object" }
        });

        // Parseo seguro del análisis
        const analysis = JSON.parse(response.choices[0].message.content);
        
        // 3. Envío de mail con "Fallback" (si la IA falla o cambia nombres, no sale undefined)
        const mailConfig = {
            proyecto: analysis.nombre_proyecto || analysis.nombreProyecto || "Nuevo Proyecto",
            precio: analysis.precio_sugerido || analysis.precioSugerido || "Consultar",
            plazo: analysis.tiempo_estimado || analysis.tiempoEstimado || "A definir",
            resumen: analysis.resumen_ejecutivo || analysis.resumenEjecutivo || "Sin resumen disponible",
            stack: Array.isArray(analysis.stack) ? analysis.stack.join(", ") : "A definir"
        };

        await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email, 
            subject: `🚀 LEAD: ${mailConfig.proyecto} - ${userData.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; border: 2px solid #2563eb; padding: 25px; border-radius: 12px; color: #1e293b;">
                    <h2 style="color: #2563eb; margin-top: 0;">🐆 Puma Code: Nuevo Lead</h2>
                    <p><strong>De:</strong> ${userData.name} (${userData.email})</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p><strong>Proyecto:</strong> ${mailConfig.proyecto}</p>
                        <p><strong>Precio Sugerido:</strong> <span style="font-size: 18px; font-weight: bold; color: #059669;">${mailConfig.precio}</span></p>
                        <p><strong>Plazo:</strong> ${mailConfig.plazo}</p>
                        <p><strong>Stack sugerido:</strong> ${mailConfig.stack}</p>
                    </div>
                    
                    <h4 style="color: #334155; margin-bottom: 5px;">Resumen para Roberto:</h4>
                    <p style="font-style: italic; color: #475569; background: #fff; padding: 10px; border-left: 4px solid #2563eb;">
                        "${mailConfig.resumen}"
                    </p>

                    <div style="margin-top: 25px; padding: 10px; background: #eff6ff; border-radius: 8px; font-size: 12px;">
                        <p>Tip: Responde este mail directamente para escribirle a ${userData.name}.</p>
                    </div>
                </div>
            `
        });

        console.log("✅ Mail enviado correctamente a Roberto.");

    } catch (error) {
        console.error("❌ Error Crítico en analyzeProject:", error.message);
        // No enviamos res.status aquí porque ya se envió un 200 OK al principio
    }
};