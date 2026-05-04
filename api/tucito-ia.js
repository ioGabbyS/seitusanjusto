export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    const last = messages[messages.length - 1].content;

    // DETECTAMOS DONDE ESTAMOS POR LA URL
    const host = req.headers.host || "";
    const isSanJusto = host.includes("sanjusto") || host.includes("seitu-fiel");
    const sucursal = isSanJusto ? "San Justo" : "Castillo";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Eres Tucito de Sei Tu ${sucursal.toUpperCase()}. Mayo es mes patrio 🇦🇷. Puntos SeituClub dan helado GRATIS. Responde alegremente a: ${last}` }] }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }
        return res.status(200).json({ text: `¡Hola! Soy Tucito de ${sucursal} 🐲. ¡Vamos a festejar! 🍦` });
    } catch (e) {
        return res.status(200).json({ text: "Hipo técnico de Tucito. 🐲" });
    }
}
