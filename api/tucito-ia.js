import { createClient } from '@supabase/supabase-js';

// URL única de San Justo
const supabaseUrl = 'https://adkdesaeysijbgmiyywj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Forzamos CORS y Headers para evitar problemas de red
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { messages } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";

    if (!KEY) return res.status(200).json({ text: "Tucito necesita su llave mágica (API KEY). 🐲🔑" });

    const last = messages[messages.length - 1].content;

    // 1. Detectar Sucursal
    const host = req.headers.host || "";
    const isSanJusto = host.includes("sanjusto") || host.includes("seitu-fiel");
    const sucursal = isSanJusto ? "San Justo" : "Castillo";

    // 2. Leer instrucciones de Supabase
    let instructions = `Eres Tucito de Sei Tu ${sucursal}. Responde alegremente. Mayo es mes patrio 🇦🇷.`;
    try {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'tucito_prompt')
            .single();
        if (data && data.value) instructions = data.value;
    } catch (e) {
        console.warn("Usando prompt por defecto");
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: `INSTRUCCIONES: ${instructions}\n\nPREGUNTA DEL CLIENTE: ${last}` }]
                }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        // Si Gemini está saturado o falla la cuota
        if (data.error) {
            return res.status(200).json({ text: "Tucito está descansando un minuto. ¡Probá de nuevo en un ratito! 🐲💤" });
        }

        return res.status(200).json({ text: `¡Hola! Soy Tucito de ${sucursal} 🐲. ¿Cómo te puedo ayudar?` });
    } catch (e) {
        return res.status(200).json({ text: "Hipo técnico de Tucito. 🐲 (Error de red)" });
    }
}
