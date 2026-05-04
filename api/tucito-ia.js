export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    const last = messages[messages.length - 1].content;

    try {
        // FALLBACK QUE SIEMPRE FUNCIONA SEGÚN TU INFO
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Eres Tucito de Sei Tu Helados. Alegre, emojis y es Mayo patrio 🇦🇷. Usuario dice: ${last}` }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        // Si falla, mostramos qué modelos TIENE habilitados esta Key
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`);
        const listData = await listResp.json();
        const models = listData.models ? listData.models.map(m => m.name.split("/")[1]) : "Ninguno";

        return res.status(200).json({ text: `Hipo: No pude usar gemini-pro. Tus modelos habilitados son: ${JSON.stringify(models)}` });

    } catch (e) {
        return res.status(200).json({ text: `Error de red: ${e.message}` });
    }
}
