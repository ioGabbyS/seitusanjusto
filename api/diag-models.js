export default async function handler(req, res) {
    let RAW_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    let KEY_TO_USE = RAW_KEY.trim();
    const CORRECT_PREFIX = "\x41\x49\x7a\x61";
    if (KEY_TO_USE.length >= 4) {
        KEY_TO_USE = CORRECT_PREFIX + KEY_TO_USE.slice(4);
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${KEY_TO_USE}`);
        const data = await response.json();

        // Extraemos solo los IDs de los modelos para que sea fácil de leer
        const modelIds = data.models ? data.models.map(m => m.name.replace('models/', '')) : [];

        return res.status(200).json({
            success: true,
            version_beta: "v1beta",
            models: modelIds,
            raw: data
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
