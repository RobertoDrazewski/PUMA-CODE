const { OpenAI } = require('openai');
const { Resend } = require('resend');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

exports.analyzeProject = async (req, res) => {
    try {
        // Normalizamos los datos (JSON o Texto Plano)
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);
        const { chatHistory, userData } = body;

        // 1. RESPUESTA INSTANTÁNEA: Libera al celular para que no de error de timeout
        res.status(200).json({ success: true });

        // 2. PROCESO DE FONDO (Async)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Eres CTO de Puma Code. Analiza la charla y responde estrictamente en JSON con: nombre_proyecto, precio_sugerido, tiempo_estimado, resumen_ejecutivo." },
                { role: "user", content: JSON.stringify(chatHistory) }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        // 3. ENVÍO DE MAIL CON FALLBACKS (Evita los 'undefined')
        await resend.emails.send({
            from: 'Puma Code <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email,
            subject: `🚀 LEAD: ${analysis.nombre_proyecto || 'Nuevo Proyecto'} - ${userData.name}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Nuevo Proyecto: ${analysis.nombre_proyecto || 'Sin Nombre'}</h2>
                    <p><strong>Cliente:</strong> ${userData.name} (${userData.email})</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 5px;">
                        <p><strong>Precio Sugerido:</strong> ${analysis.precio_sugerido || 'A definir'}</p>
                        <p><strong>Plazo:</strong> ${analysis.tiempo_estimado || 'A definir'}</p>
                        <p><strong>Resumen:</strong> ${analysis.resumen_ejecutivo || 'Ver chat'}</p>
                    </div>
                </div>`
        });
        console.log("✅ Mail enviado");
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
};