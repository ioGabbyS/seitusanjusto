// api/mp-create-qr.js
// Crea una orden de pago QR en MercadoPago para cobrar en el POS

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const userId = process.env.MP_USER_ID;

    if (!accessToken || !userId) {
        return res.status(500).json({ error: 'Credenciales MP no configuradas' });
    }

    try {
        const { amount, description, items, external_reference, cashier } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Monto inválido' });
        }

        // Primero necesitamos obtener o crear un store y POS
        // Para QR dinámico (sin dispositivo físico) usamos Preference + QR
        const preferenceBody = {
            items: items && items.length > 0
                ? items.map(i => ({
                    title: i.name || 'Producto',
                    description: i.category || '',
                    quantity: i.quantity || 1,
                    unit_price: Number(i.price) || 0,
                    currency_id: 'ARS',
                }))
                : [{
                    title: description || 'Venta Seitu',
                    quantity: 1,
                    unit_price: Number(amount),
                    currency_id: 'ARS',
                }],
            external_reference: external_reference || `seitu-${Date.now()}`,
            statement_descriptor: 'SEITU CASTILLO',
            auto_return: 'approved',
            back_urls: {
                success: 'https://seitu-fiel.vercel.app/#/app',
                failure: 'https://seitu-fiel.vercel.app/#/app',
                pending: 'https://seitu-fiel.vercel.app/#/app',
            },
            metadata: {
                cashier: cashier || 'Sistema',
                source: 'seitu-pos',
            }
        };

        const prefResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `seitu-pref-${Date.now()}-${Math.random()}`
            },
            body: JSON.stringify(preferenceBody)
        });

        if (!prefResponse.ok) {
            const errData = await prefResponse.json();
            console.error('MP Preference Error:', errData);
            return res.status(prefResponse.status).json({
                error: 'Error al crear preferencia en MP',
                details: errData
            });
        }

        const preference = await prefResponse.json();

        // El QR se genera a partir del init_point URL
        // Para generar imagen QR usamos un servicio externo de QR
        const qrData = preference.init_point;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

        return res.status(200).json({
            preference_id: preference.id,
            init_point: preference.init_point,
            sandbox_init_point: preference.sandbox_init_point,
            qr_image_url: qrImageUrl,
            qr_data: qrData,
            amount: Number(amount),
            external_reference: preferenceBody.external_reference,
        });

    } catch (error) {
        console.error('Error en mp-create-qr:', error);
        return res.status(500).json({ error: error.message });
    }
}
