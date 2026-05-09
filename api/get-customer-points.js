import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // 1. Configurar CORS para permitir llamadas desde el frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { dni } = req.query;

    if (!dni) {
        return res.status(400).json({ error: 'DNI es requerido' });
    }

    // 2. Conexión SEGURA con Supabase (Usando Service Role para saltar RLS)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://adkdesaexsijbgmiywwj.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        // Si falla, es porque Vercel no tiene la llave configurada
        return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 3. Buscar el cliente
        const { data, error } = await supabase
            .from('customers')
            .select('name, points, history') // SOLO traemos lo necesario
            .eq('dni', dni)
            .single();

        if (error) {
            // Diferenciar "no encontrado" de "error real"
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            throw error;
        }

        // 4. Responder solo con datos seguros
        return res.status(200).json({
            name: data.name,
            points: data.points,
            history: data.history || []
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
