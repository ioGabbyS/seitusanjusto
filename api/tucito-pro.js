export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages, branch } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    if (!KEY) return res.status(200).json({ text: "¡Hola! 🐲 No encuentro mi clave." });

    const isSanJusto = branch === 'sanjusto';
    const BRANCH_NAME = isSanJusto ? "Sei Tu San Justo" : "Sei Tu Castillo";

    const SYSTEM_PROMPT = `Eres Tucito, el dragón azul de ${BRANCH_NAME}. Alegre, dulce y servicial 🐲🍦✨. MAYO: Mes patrio en Argentina 🇦🇷. Muy orgulloso de los colores celeste y blanco. Recuerda: SeituClub da helado GRATIS. Responde alegremente.`;

    try {
        const lastMsg = messages[messages.length - 1].content;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUsuario: ${lastMsg}` }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text });
        }

        return res.status(200).json({ text: "¡Hola! Soy Tucito. 🐲 ¿En qué puedo ayudarte hoy con estos ricos helados? 🍦✨" });

    } catch (error) {
        return res.status(200).json({ text: "Tucito tiene un pequeño hipo, ¡pero ya estoy acá! 🐲🍦" });
    }
}
