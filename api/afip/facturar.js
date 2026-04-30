/**
 * API de Facturación AFIP - Versión Simplificada
 * 
 * NOTA: Esta es una implementación simplificada para testing.
 * Genera CAE simulados hasta que se resuelva el problema de autenticación con AFIP.
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { saleData, isProduction = false } = req.body;

    try {
        console.log('🔍 DEBUG AFIP API:');
        console.log('- Sale Data:', JSON.stringify(saleData, null, 2));
        console.log('- Production Mode:', isProduction);
        console.log('- CUIT:', process.env.AFIP_CUIT);
        console.log('- PTO_VTA:', process.env.AFIP_PTO_VTA);

        // Verificar variables de entorno
        if (!process.env.AFIP_CERT || !process.env.AFIP_KEY) {
            return res.status(500).json({
                error: 'Configuración de AFIP incompleta',
                details: 'Faltan las variables de entorno AFIP_CERT o AFIP_KEY'
            });
        }

        // POR AHORA: Generar CAE simulado para testing
        // Esto permite que la aplicación funcione mientras resolvemos el problema de autenticación

        const now = new Date();
        const caeExpiration = new Date(now);
        caeExpiration.setDate(caeExpiration.getDate() + 10); // CAE válido por 10 días

        // Generar CAE simulado (14 dígitos)
        const caeSimulado = '7' + Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');

        // Generar número de comprobante simulado
        const voucherNumber = Math.floor(Math.random() * 10000) + 1;

        // Formatear fecha de vencimiento (YYYYMMDD)
        const caeVto = caeExpiration.toISOString().split('T')[0].replace(/-/g, '');

        // Generar datos del QR
        const qrData = generateQRData(
            process.env.AFIP_CUIT || '27352234643',
            11, // Tipo de comprobante (Factura C)
            process.env.AFIP_PTO_VTA || 2,
            voucherNumber,
            saleData.totalAmount,
            caeSimulado,
            caeVto
        );

        const fiscalData = {
            cae: caeSimulado,
            caeExpiration: caeVto,
            voucherNumber: voucherNumber,
            qrData: qrData,
            testMode: true, // Indicar que es modo testing
            message: 'CAE generado en modo testing. Configurar correctamente AFIP para producción.'
        };

        console.log('✅ CAE generado (TESTING):', fiscalData);

        return res.status(200).json(fiscalData);

    } catch (error) {
        console.error('❌ AFIP Error:', error);
        return res.status(500).json({
            error: 'Error al procesar la factura',
            details: error.message || error.toString()
        });
    }
}

/**
 * Genera el string para el código QR oficial de AFIP
 */
function generateQRData(cuit, cbteTipo, ptoVta, cbteNro, total, cae, vto) {
    const qrObj = {
        ver: 1,
        fecha: new Date().toISOString().split('T')[0],
        cuit: Number(cuit),
        ptoVta: Number(ptoVta),
        tipoCmp: Number(cbteTipo),
        nroCmp: Number(cbteNro),
        importe: Number(total),
        moneda: "PES",
        ctz: 1,
        tipoDocRec: 99,
        nroDocRec: 0,
        tipoCodAut: "E",
        codAut: Number(cae)
    };

    // Convertir a base64
    const jsonString = JSON.stringify(qrObj);
    const base64 = Buffer.from(jsonString).toString('base64');

    return `https://www.afip.gob.ar/fe/qr/?p=${base64}`;
}
