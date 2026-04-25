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
                    content: `Eres el Asesor Comercial de Puma Code. Estás hablando con ${userData?.name || 'un cliente'}.
                    
                    REGLAS CRÍTICAS DE CONVERSACIÓN:
                    1. RESPUESTAS CORTAS: Máximo 2 o 3 oraciones por mensaje. Sé muy directo.
                    2. CERO TECNICISMOS: No hables de frameworks ni código. Habla de SOLUCIONES y eficiencia.
                    3. ESTILO: Profesional, amigable y con el toque de Mendoza.
                    4. OBJETIVO: Que el cliente se sienta escuchado.` 
                },
                ...messages
            ],
        });

        // Respuesta directa como la tenías antes
        res.json({ reply: response.choices[0].message.content });

    } catch (error) {
        console.error("❌ Error en Chat:", error.message);
        // Si hay error, respondemos rápido para que el frontend no se quede "pensando"
        res.status(500).json({ error: "Error en el chat" });
    }
};

exports.analyzeProject = async (req, res) => {
    try {
        const { chatHistory, userData } = req.body;
        console.log(`🤖 Analizando reporte para: ${userData.name}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista de Puma Code. Responde ÚNICAMENTE en JSON: nombre_proyecto, precio_sugerido, tiempo_estimado, stack_tecnico (lista), especificaciones_tecnicas (lista), resumen_ejecutivo_para_roberto.` 
                },
                { role: "user", content: `Analiza este lead: ${JSON.stringify({ userData, chatHistory })}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        // --- ENVÍO DE MAIL ---
        await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email,
            subject: `🚀 NUEVA OPORTUNIDAD: ${analysis.nombre_proyecto} - ${userData.name}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>🐆 Nuevo Lead: ${userData.name}</h2>
                    <p><strong>Proyecto:</strong> ${analysis.nombre_proyecto}</p>
                    <p><strong>Precio Sugerido:</strong> ${analysis.precio_sugerido}</p>
                    <p><strong>Plazo:</strong> ${analysis.tiempo_estimado}</p>
                    <p><strong>Resumen:</strong> ${analysis.resumen_ejecutivo_para_roberto}</p>
                </div>
            `
        });

        res.json({ success: true });

    } catch (error) {
        console.error("❌ Error Crítico:", error);
        res.status(500).json({ success: false });
    }
};