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
                    2. CERO TECNICISMOS: No hables de frameworks, bases de datos o código. Habla de SOLUCIONES, ahorros de tiempo y eficiencia para el negocio del cliente.
                    3. ESTILO: Profesional, amigable y con el toque de Mendoza (cercano pero serio).
                    4. OBJETIVO: Que el cliente se sienta escuchado y entienda que Roberto le dará una solución a medida.` 
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
        const { chatHistory, userData } = req.body;
        console.log(`1. 🤖 Analizando reporte para Roberto. Cliente: ${userData.name}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista de Puma Code. Tu cliente es Roberto (el dueño).
                    Analiza la charla para darle a Roberto un reporte técnico y comercial interno.
                    
                    ESTRATEGIA DE PRECIOS (MENDOZA/GLOBAL):
                    - PROHIBIDO DAR 0 USD: El ticket mínimo de Puma Code es de $450 USD.
                    - Apps de Gestión/Stock (ej. enfermería): Entre $800 y $1800 USD según complejidad.
                    - Landing/Web simple: $450 - $850 USD.
                    - E-commerce/Sistemas Pro: $2500+ USD.
                    
                    ESTIMACIÓN DE TIEMPO:
                    - Usa siempre SEMANAS. Mínimo 2 semanas, máximo 12 semanas para MVPs.
                    
                    Responde ÚNICAMENTE en JSON: nombre_proyecto, precio_sugerido, tiempo_estimado, stack_tecnico (lista), especificaciones_tecnicas (lista), resumen_ejecutivo_para_roberto.` 
                },
                { role: "user", content: `Analiza este lead: ${JSON.stringify({ userData, chatHistory })}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);
        
        // Blindaje final de datos
        const specs = Array.isArray(analysis.especificaciones_tecnicas) ? analysis.especificaciones_tecnicas : ["Revisar charla para detalles"];
        const stack = Array.isArray(analysis.stack_tecnico) ? analysis.stack_tecnico : ["Stack a definir por Roberto"];

        // --- ENVÍO DE MAIL A ROBERTO ---
        const { data, error } = await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email, // Permite responder directo al cliente
            subject: `🚀 NUEVA OPORTUNIDAD: ${analysis.nombre_proyecto} - ${userData.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; border: 2px solid #2563eb; padding: 25px; border-radius: 12px; color: #1e293b;">
                    <h2 style="color: #2563eb; margin-top: 0;">🐆 Puma Code: Nuevo Lead</h2>
                    <p><strong>De:</strong> ${userData.name} (${userData.email})</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    
                    <h3 style="color: #0f172a;">Sugerencia de la IA para tu Presupuesto:</h3>
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 5px 0;"><strong>Proyecto:</strong> ${analysis.nombre_proyecto}</p>
                        <p style="margin: 5px 0;"><strong>Precio Sugerido:</strong> <span style="font-size: 20px; font-weight: bold; color: #059669;">${analysis.precio_sugerido}</span></p>
                        <p style="margin: 5px 0;"><strong>Plazo:</strong> ${analysis.tiempo_estimado}</p>
                    </div>
                    
                    <h4 style="color: #334155;">Resumen Ejecutivo:</h4>
                    <p style="font-style: italic; color: #475569;">"${analysis.resumen_ejecutivo_para_roberto}"</p>

                    <h4 style="color: #334155;">Stack Sugerido:</h4>
                    <p style="font-size: 13px;">${stack.join(' | ')}</p>

                    <div style="margin-top: 25px; padding: 15px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
                        <p style="margin: 0; font-weight: bold; color: #1e40af;">👉 Instrucción para Roberto:</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">Dale a "Responder" para enviarle la propuesta oficial a ${userData.name}.</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("❌ Resend Error:", error);
            return res.status(400).json({ success: false });
        }

        console.log("4. ✅ Reporte enviado a Roberto.");
        res.json({ success: true });

    } catch (error) {
        console.error("❌ Error Crítico:", error);
        res.status(500).json({ success: false });
    }
};