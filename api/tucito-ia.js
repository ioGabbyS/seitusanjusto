export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages, branch } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    if (!KEY) return res.status(200).json({ text: "¡Hola! 🐲 No encuentro mi clave." });

    const last = messages[messages.length - 1].content;
    const sucursal = branch === 'sanjusto' ? "San Justo" : "Castillo";

    const prompt = `Eres Tucito, el alegre dragón azul de Sei Tu Helados (${sucursal}). Mayo es el mes patrio argentino 🇦🇷. Los puntos de SeituClub dan helado GRATIS. Responde con mucha alegría y emojis a esto: ${last}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        const errorMsg = data.error ? data.error.message : "Sin respuesta de Google";
        return res.status(200).json({ text: `Hipo de Tucito: ${errorMsg}` });

    } catch (e) {
        return res.status(200).json({ text: `Hipo técnico: ${e.message}` });
    }
}
