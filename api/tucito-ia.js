import { createClient } from '@supabase/supabase-js';

// URL única de San Justo
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://adkdesaeysijbgmiyywj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2Rlc2FleXNpamJnbWl5eXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjEwOTcsImV4cCI6MjA5MzA5NzA5N30.eVN9Ooae5NFnJ0zs-D0Ln42wFidKQjz-V1Mh93nGRh8';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    res.setHeader('Access-Control-Allow-Origin', '*');

    const { messages } = req.body;
    let KEY = process.env.GEMINI_API_KEY || "";

    if (!KEY) return res.status(200).json({ text: "Tucito necesita su llave mágica (API KEY). 🐲🔑" });

    const last = messages[messages.length - 1].content;

    const sucursal = "San Justo";

    let instructions = `Eres Tucito de Sei Tu ${sucursal}. Responde alegremente. Mayo es mes patrio 🇦🇷.`;
    try {
        const { data } = await supabase
            .from('settings')
            .select('configuration')
            .eq('id', 'tucito_prompt')
            .single();
        if (data && data.configuration && data.configuration.prompt) {
            instructions = data.configuration.prompt;
        }
    } catch (e) {
        console.warn(`Usando prompt por defecto en ${sucursal}`);
    }

    try {
        const { data: rewardsData } = await supabase.from('rewards').select('*');
        if (rewardsData && rewardsData.length > 0) {
            const premios = rewardsData.map(r => `- ${r.name} (${r.pointCost || r.point_cost} pts)`).join('\n');
            instructions += `\n\nREGLA ESTRICTA DE SISTEMA SOBRE PUNTOS:
Si el usuario pregunta sobre "puntos", "club", "seituclub" o cómo canjear, ESTÁS OBLIGADO a responder con esta información exacta sin inventar nada:
- Por cada $1000 pesos de compra, el cliente suma 100 puntos.
- Lista actual y real de premios para canjear:
${premios}
(Menciona siempre algunos de estos premios reales en tu respuesta).`;
        }
    } catch (e) {
        console.warn("No se pudieron cargar los premios para Tucito");
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: instructions }] 
                },
                contents: [{
                    role: "user",
                    parts: [{ text: last }]
                }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        if (data.error) {
            return res.status(200).json({ text: "Tucito está descansando un minuto. ¡Probá de nuevo en un ratito! 🐲💤" });
        }

        return res.status(200).json({ text: `¡Hola! Soy Tucito de ${sucursal} 🐲. ¿Cómo te puedo ayudar?` });
    } catch (e) {
        return res.status(200).json({ text: "Hipo técnico de Tucito. 🐲 (Error de red)" });
    }
}
