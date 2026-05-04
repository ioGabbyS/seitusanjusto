export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages, branch } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    if (!KEY) return res.status(200).json({ text: "¡Hola! 🐲 No encuentro mi clave." });

    const last = messages[messages.length - 1].content;
    const sucursal = branch === 'sanjusto' ? "San Justo" : "Castillo";

    // FUSIONAMOS TODO EN UN SOLO TEXTO (Garantía de respuesta)
    const promptTodoJunto = `Eres Tucito, el alegre dragón azul de Sei Tu Helados (${sucursal}). Mayo es mes patrio 🇦🇷. Puntos de SeituClub dan helado GRATIS. Responde alegremente con emojis a lo siguiente: ${last}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptTodoJunto }] }]
            })
        });

        const data = await response.json();

        // SI HAY RESPUESTA, LA MOSTRAMOS
        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        // SI GOOGLE SE PONE DIFÍCIL, MOSTRAMOS EL ERROR
        const errorMsg = data.error ? data.error.message : "Error desconocido de Google";
        return res.status(200).json({ text: `Google dice: ${errorMsg} (Data: ${JSON.stringify(data)})` });

    } catch (e) {
        return res.status(200).json({ text: "¡Hola! Soy Tucito 🐲. ¿En qué pueo ayudarte hoy? 🍦" });
    }
}
