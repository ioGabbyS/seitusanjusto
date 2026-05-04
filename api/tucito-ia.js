export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages, branch } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    const last = messages[messages.length - 1].content;
    const sucursal = branch === 'sanjusto' ? "San Justo" : "Castillo";

    try {
        // EL MODELO MÁS AVANZADO QUE EXISTE: 2.5 FLASH
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Eres Tucito, el dragón azul de Sei Tu Helados (${sucursal}). Alegre y servicial. Mayo es mes patrio 🇦🇷. Puntos SeituClub dan helado GRATIS. Usuario: ${last}` }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        return res.status(200).json({ text: "Tucito está procesando mucha magia... 🐲🍦" });

    } catch (e) {
        return res.status(200).json({ text: "Hipo técnico de Tucito. 🐲" });
    }
}
