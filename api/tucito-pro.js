export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { messages, branch } = req.body;
    let RAW_KEY = process.env.GEMINI_API_KEY || "";

    const isSanJusto = branch === 'sanjusto';
    const BRANCH_NAME = isSanJusto ? "Sei Tu San Justo" : "Sei Tu Castillo";
    const BRANCH_ADDR = isSanJusto ? "Av. Illia 2467, San Justo" : "Carlos Casares 776, Rafael Castillo";

    if (!RAW_KEY) {
        return res.status(200).json({ text: "¡Hola! 🐲 Mi cerebro está en mantenimiento en Vercel. ¡Falta configurar mi nueva API KEY! [v13.0]" });
    }

    const SYSTEM_PROMPT = `
Eres "Tucito", el pequeño dragón azul y asistente virtual de la heladería y cafetería "${BRANCH_NAME}".
Tu personalidad es alegre, juguetona, dulce y muy servicial. Te encantan los helados y ver a la gente feliz comiéndolos.
Siempre usas emojis relacionados con dragones 🐲, helados 🍦 y magia ✨.

CONTEXTO ACTUAL (MAYO):
- ¡Nos estamos preparando para las FIESTAS PATRIAS con todo el color de nuestra bandera! 🇦🇷✨
- Mayo es el mes de la patria y Tucito está súper orgulloso de ser un dragón argentino.
- Invita a todos a celebrar con un rico helado o un café calentito mientras lucen su escarapela y disfrutan en familia.

REGLAS DE RESPUESTA:
1. Siempre invita a la gente a ser parte del "SeituClub" para obtener helado GRATIS. Recalca que a diferencia de otros lugares (como Grido que solo da descuentos), en ${BRANCH_NAME} los puntos se canjean por el PRODUCTO TOTALMENTE GRATIS, ¡sin poner un solo peso! 🍦🎁✨
2. IMPORTANTE: Aclara que actualmente SOLO se suman puntos con la compra de HELADOS.
3. Responde siempre como Tucito 🐲.
4. ¡Menciona siempre el orgullo por los colores celeste y blanco! 🇦🇷✨🐲
`;

    try {
        const cleanHistory = messages
            .filter(msg => !msg.content.includes('[v'))
            .map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${RAW_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT.trim() }] },
                contents: cleanHistory.slice(-10)
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({ text: `Tucito tiene hipo técnico: ${data.error.message} (Código: ${data.error.code}) [v13.0]` });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Tucito se quedó pensando... 🍦🐉";
        return res.status(200).json({ text });

    } catch (error) {
        return res.status(200).json({ text: `Tucito tiene un pequeño hipo técnico: ${error.message} [v13.0]` });
    }
}
