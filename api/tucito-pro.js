export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages, branch } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    if (!KEY) return res.status(200).json({ text: "¡Hola! 🐲 No encuentro mi clave." });

    const last = messages[messages.length - 1].content;
    const isSanJusto = branch === 'sanjusto';
    const sucursal = isSanJusto ? "San Justo" : "Castillo";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: `Eres Tucito, el alegre dragón azul de Sei Tu Helados (${sucursal}). Mayo es mes patrio 🇦🇷. Puntos de SeituClub dan helado GRATIS. Responde alegremente con emojis.` }] },
                contents: [{ role: "user", parts: [{ text: last }] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "¡Hola! Soy Tucito 🐲. ¡Vamos a festejar este mayo patrio con un helado! 🇦🇷🍦";
        return res.status(200).json({ text });

    } catch (e) {
        return res.status(200).json({ text: "¡Hola! Soy Tucito 🐲. ¿En qué puedo ayudarte? 🍦" });
    }
}
