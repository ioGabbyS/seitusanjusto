import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://adkdesaeysijbgmiyywj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { messages } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";
    const last = messages[messages.length - 1].content;

    // 1. Detectar Sucursal
    const host = req.headers.host || "";
    const isSanJusto = host.includes("sanjusto") || host.includes("seitu-fiel");
    const sucursal = isSanJusto ? "San Justo" : "Castillo";

    // 2. Intentar leer instrucciones de Supabase
    let instructions = `Eres Tucito de Sei Tu ${sucursal}. Responde alegremente. Mayo es mes patrio 🇦🇷.`;
    try {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'tucito_prompt')
            .single();
        if (data && data.value) instructions = data.value;
    } catch (e) {
        console.error("Error leyendo prompt:", e);
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: `INSTRUCCIONES DEL SISTEMA: ${instructions}\n\nUSUARIO: ${last}` }]
                }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }
        return res.status(200).json({ text: `¡Hola! Soy Tucito de ${sucursal} 🐲.` });
    } catch (e) {
        return res.status(200).json({ text: "Hipo técnico de Tucito. 🐲" });
    }
}
