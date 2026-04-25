const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

// --- FUNCIÓN 1: CHAT EN VIVO ---
exports.chatWithAI = async (req, res) => {
    try {
        const { messages, userData } = req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el Asesor Comercial de Puma Code. Hablas con ${userData?.name || 'un cliente'}. 
                    REGLAS: Máximo 2 frases. Estilo Mendoza: cercano y profesional. No menciones código.` 
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

// --- FUNCIÓN 2: ANÁLISIS Y ENVÍO DE PRESUPUESTO ---
// Asegúrate de que en aiRoutes.js diga: aiController.analyzeProject
exports.analyzeProject = async (req, res) => {
    try {
        // 1. Captura y normalización de datos (Soporte para PC y Móvil)
        let data = req.body;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { console.error("Error parseando body"); }
        }
        
        const { chatHistory, userData } = data;

        // Validación de seguridad para evitar errores de 'undefined'
        if (!userData || !chatHistory) {
            console.error("❌ Datos insuficientes para el análisis");
            return res.status(400).json({ success: false, message: "Datos incompletos" });
        }
        
        // 2. RESPUESTA INMEDIATA (Libera al celular/PC para mostrar éxito)
        res.status(200).json({ success: true });

        // --- PROCESO ASÍNCRONO DE FONDO ---
        console.log(`🤖 Generando reporte para: ${userData.name}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO de Puma Code. Responde estrictamente en JSON con este esquema:
                    {
                      "nombre_proyecto": "string",
                      "precio_sugerido": "string",
                      "tiempo_estimado": "string",
                      "resumen_ejecutivo": "string"
                    }
                    ESTRATEGIA: Landings $450+, Gestión $800-$1800, Pro $2500+.` 
                },
                { role: "user", content: `Analiza este historial: ${JSON.stringify(chatHistory)}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);
        
        // 3. PARACAÍDAS DE DATOS (Evita que el mail llegue con 'undefined')
        const proyecto = analysis.nombre_proyecto || analysis.nombreProyecto || "Nuevo Proyecto";
        const precio = analysis.precio_sugerido || analysis.precioSugerido || "A definir";
        const tiempo = analysis.tiempo_estimado || analysis.tiempoEstimado || "A definir";
        const resumen = analysis.resumen_ejecutivo || analysis.resumenEjecutivo || "Revisar chat.";

        // 4. ENVÍO DE MAIL VÍA RESEND
        await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email, 
            subject: `🚀 LEAD: ${proyecto} - ${userData.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; border: 2px solid #2563eb; padding: 25px; border-radius: 12px; color: #1e293b;">
                    <h2 style="color: #2563eb; margin-top: 0;">🐆 Puma Code: Nuevo Lead</h2>
                    <p><strong>De:</strong> ${userData.name} (${userData.email})</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p><strong>Proyecto:</strong> ${proyecto}</p>
                        <p><strong>Precio Sugerido:</strong> <span style="font-size: 18px; font-weight: bold; color: #059669;">${precio}</span></p>
                        <p><strong>Plazo:</strong> ${tiempo}</p>
                    </div>
                    
                    <h4 style="color: #334155; margin-bottom: 5px;">Resumen Ejecutivo:</h4>
                    <p style="font-style: italic; color: #475569; background: #fff; padding: 10px; border-left: 4px solid #2563eb;">
                        "${resumen}"
                    </p>
                </div>
            `
        });

        console.log("✅ Mail enviado con éxito.");

    } catch (error) {
        console.error("❌ Error Crítico en el controlador:", error.message);
    }
};