export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages, branch } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    const last = messages[messages.length - 1].content;
    const sucursal = branch === 'sanjusto' ? "San Justo" : "Castillo";

    try {
        // PROBAMOS CON EL NOMBRE 1.0 PRO (El primero de todos)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Eres Tucito, el alegre dragón azul de Sei Tu Helados (${sucursal}). Mayo es el mes patrio argentino 🇦🇷. Puntos de SeituClub dan helado GRATIS. Responde con mucha alegría y emojis a esto: ${last}` }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        return res.status(200).json({ text: `Google dice: ${data.error ? data.error.message : JSON.stringify(data)}` });

    } catch (e) {
        return res.status(200).json({ text: `Error de red: ${e.message}` });
    }
}
