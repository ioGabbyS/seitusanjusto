import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // 1. Configurar CORS
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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { name, dni, phone, email } = req.body;

    if (!name || !dni || !phone || !email) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // 2. Conexión SEGURA con Supabase (Usando Service Role para saltar RLS)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://adkdesaexsijbgmiywwj.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 3. Verificar si ya existe
        const { data: existing, error: searchError } = await supabase
            .from('customers')
            .select('dni')
            .eq('dni', dni)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ error: 'Este DNI ya está registrado' });
        }

        // 4. Insertar nuevo cliente
        const newCustomer = {
            id: Date.now().toString(),
            name,
            dni,
            phone,
            email,
            points: 0,
            history: [],
            createdAt: new Date().toISOString()
        };

        const { data, error: insertError } = await supabase
            .from('customers')
            .insert(newCustomer)
            .select()
            .single();

        if (insertError) throw insertError;

        return res.status(201).json(data);

    } catch (error) {
        console.error('API Register Error:', error);
        return res.status(500).json({ error: 'Error interno al registrar cliente' });
    }
}
