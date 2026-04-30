// api/mp-transactions.js
// Consulta el historial de pagos recibidos en la cuenta de MercadoPago

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        return res.status(500).json({ error: 'MP_ACCESS_TOKEN no configurado' });
    }

    try {
        const { limit = 20, offset = 0, begin_date, end_date } = req.query;

        // Construir parámetros de búsqueda
        const params = new URLSearchParams({
            sort: 'date_created',
            criteria: 'desc',
            limit: Math.min(Number(limit), 50).toString(),
            offset: offset.toString(),
        });

        if (begin_date) params.append('begin_date', begin_date);
        if (end_date) params.append('end_date', end_date);

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/search?${params.toString()}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `seitu-search-${Date.now()}`
                }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('MP API Error:', errorData);
            return res.status(response.status).json({
                error: 'Error al consultar MercadoPago',
                details: errorData
            });
        }

        const data = await response.json();

        // Formatear los pagos para la app
        const payments = (data.results || []).map(p => ({
            id: p.id,
            date: p.date_created,
            date_approved: p.date_approved,
            status: p.status,
            status_detail: p.status_detail,
            amount: p.transaction_amount,
            net_amount: p.transaction_details?.net_received_amount || p.transaction_amount,
            currency: p.currency_id,
            description: p.description || 'Sin descripción',
            payment_type: p.payment_type_id,
            payment_method: p.payment_method_id,
            payer_name: p.payer?.first_name
                ? `${p.payer.first_name} ${p.payer.last_name || ''}`.trim()
                : (p.payer?.email || 'Anónimo'),
            payer_email: p.payer?.email || '',
            external_reference: p.external_reference || '',
            fee_amount: p.fees_details?.reduce((sum, f) => sum + f.amount, 0) || 0,
            installments: p.installments || 1,
            last_four_digits: p.card?.last_four_digits || null,
        }));

        return res.status(200).json({
            payments,
            total: data.paging?.total || 0,
            limit: data.paging?.limit || 20,
            offset: data.paging?.offset || 0,
        });

    } catch (error) {
        console.error('Error en mp-transactions:', error);
        return res.status(500).json({ error: error.message });
    }
}
