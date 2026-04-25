exports.chatWithAI = async (req, res) => {
    try {
        const { messages, userData } = req.body;
        
        // Blindaje: Si no hay mensajes, enviamos un array vacío para que no explote
        const history = Array.isArray(messages) ? messages : [];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el Asesor Comercial de Puma Code. Estás hablando con ${userData?.name || 'un cliente'}.
                    REGLAS: Máximo 3 oraciones, profesional, toque de Mendoza, evita tecnicismos.` 
                },
                ...history
            ],
        });

        if (!response.choices[0].message.content) {
            throw new Error("OpenAI devolvió una respuesta vacía");
        }

        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error("❌ Error en Chat:", error.message);
        // Enviamos el error real al frontend para saber qué pasa en el móvil
        res.status(500).json({ error: "Error en el chat", details: error.message });
    }
};

exports.analyzeProject = async (req, res) => {
    try {
        const { chatHistory, userData } = req.body;
        
        // Verificación de seguridad
        if (!userData || !userData.email) {
            return res.status(400).json({ error: "Faltan datos del usuario" });
        }

        console.log(`1. 🤖 Analizando reporte para Roberto. Cliente: ${userData.name}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista de Puma Code. Responde ÚNICAMENTE en JSON.` 
                },
                { role: "user", content: `Analiza este lead: ${JSON.stringify({ userData, chatHistory })}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);
        
        // Enviar email con Resend (tu código está perfecto aquí)
        // ... (resto del código de Resend)

        res.json({ success: true });

    } catch (error) {
        console.error("❌ Error Crítico:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};