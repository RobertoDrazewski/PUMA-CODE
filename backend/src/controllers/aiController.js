const { OpenAI } = require('openai');
const { Resend } = require('resend');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { messages, userData, language } = req.body;

        const languageNames = { es: "Spanish", en: "English", pt: "Portuguese", ja: "Japanese", zh: "Chinese" };
        const selectedLanguage = languageNames[language] || "Spanish";

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `You are the Strategic Advisor of Puma Code. 
                    MISSION: Help ${userData?.name || 'the client'} refine their software idea.
                    
                    MANDATORY: ALWAYS respond in ${selectedLanguage}. 
                    If language is Spanish, use a friendly "Mendocino" style.
                    
                    RULES:
                    1. Be proactive, suggest features like AI, dashboards or WhatsApp bots.
                    2. Never give prices.
                    3. Mention the "Estimated Quote" button if the idea is clear.` 
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

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `Eres el CTO Analista de Puma Code. Analiza el chat y genera un reporte para Roberto.
                    ESTRATEGIA: Landings $450+, Gestión $1200-$2500, Sistemas $3000+.
                    Responde estrictamente en JSON:
                    {
                      "nombre": "string",
                      "precio": "string",
                      "tiempo": "string",
                      "stack": ["tecnología1"],
                      "puntos": ["funcionalidad1"],
                      "compromiso": "Nota estratégica"
                    }` 
                },
                { role: "user", content: `Analiza este historial: ${JSON.stringify(chatHistory)}` }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        const fullChatHtml = chatHistory.map(m => `
            <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #eee; background: ${m.role === 'user' ? '#f0f7ff' : '#fff'};">
                <small>${m.role === 'user' ? userData.name : 'PUMA IA'}:</small><br/>
                ${m.content}
            </div>
        `).join('');

        await resend.emails.send({
            from: 'Puma Code Leads <onboarding@resend.dev>',
            to: process.env.EMAIL_TO,
            replyTo: userData.email,
            subject: `🔥 PROYECTO: ${analysis.nombre} - ${userData.name}`,
            html: `<h2>Reporte de Proyecto</h2>
                   <p><strong>Precio sugerido:</strong> ${analysis.precio}</p>
                   <p><strong>Estrategia:</strong> ${analysis.compromiso}</p>
                   <h3>Chat completo:</h3>
                   ${fullChatHtml}`
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Error en Analyze:", error.message);
        res.status(500).json({ success: false });
    }
};