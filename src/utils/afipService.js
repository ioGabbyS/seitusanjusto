/**
 * Servicio para interactuar con la API de Facturación Electrónica de AFIP
 */
export const afipService = {
    /**
     * Solicita la emisión de una factura electrónica a nuestra API
     */
    async requestInvoice(saleData, isProduction = false) {
        try {
            const response = await fetch('/api/afip/facturar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    saleData,
                    isProduction
                }),
            });

            // Handle cases where the API is not found (like local dev)
            const contentType = response.headers.get('content-type');
            if (response.status === 404 || !contentType || !contentType.includes('application/json')) {
                throw new Error('El servicio de facturación no está activo en localhost. Usa la versión de Vercel (seitucastillo.com.ar) para facturar.');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Error al conectar con el servicio de facturación');
            }

            return await response.json();
        } catch (error) {
            console.error('AFIP Service Error:', error);
            // Better message for local development environment
            if (error.message.includes('Unexpected end of JSON input') || error.message.includes('token <')) {
                throw new Error('El servicio de AFIP solo funciona en el dominio oficial. En localhost la API no está disponible.');
            }
            throw error;
        }
    }
};
