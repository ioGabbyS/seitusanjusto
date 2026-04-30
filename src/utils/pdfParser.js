import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function parseInvoicePDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        // Improve text concatenation: roughly preserve lines based on item sequence?
        // For now, let's keep simple join but use a very specific regex that ignores the noise.

        // Debug: Log the text to see what we are dealing with if needed
        // console.log(fullText);

        if (!fullText || fullText.trim().length === 0) {
            throw new Error("El PDF parece estar vacío o ser una imagen escaneada sin texto seleccionable.");
        }

        // 1. Extract Date
        const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
        const dateMatch = fullText.match(dateRegex);
        const invoiceDate = dateMatch ? dateMatch[1] : null;

        const items = [];

        // Strict Regex for Seitu Invoice Format
        // Col 1: Code ~8 digits (e.g. 00000006)
        // Col 2: EAN/Code ~13 digits (e.g. 7798138002326)
        // Col 3: Quantity (Int or Float)
        // Col 4: Article Name (Text up to Price)
        // Col 5: Unit Price (Format 1234.56 or 1234,56)

        // 4. Regex para formato "Scrambled" (detectado en debug)
        // El stream de texto viene en orden: PrecioUnitario -> Nombre -> Cantidad -> Codigo1 ...
        // Ejemplo: 30823.29 LATA X 10 LTS FRUTILLA CADBU 2 00000328

        // Grupo 1: Precio (num.2decimales)
        // Grupo 2: Nombre (texto)
        // Grupo 3: Cantidad (entero o float)
        // Grupo 4: Codigo (8 digitos)

        const scrambledRegex = /(\d+\.\d{2})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+(\d{6,10})(?=\s|0\.00)/g;
        // (?=\s|0\.00) es un lookahead para asegurar que termine antes del descuento o siguiente campo

        let match;
        let matchCount = 0;

        // reset items just in case
        items.length = 0;

        while ((match = scrambledRegex.exec(fullText)) !== null) {
            let priceStr = match[1].replace(',', '.');
            let name = match[2].trim();
            let qtyStr = match[3].replace(',', '.');

            // Validación extra: El nombre no debería ser solo números
            if (/^[\d\s]+$/.test(name)) continue;

            items.push({
                date: invoiceDate || new Date().toISOString().split('T')[0],
                name: name,
                quantity: parseFloat(qtyStr),
                price: parseFloat(priceStr),
            });
            matchCount++;
        }

        if (matchCount === 0) {
            // Fallback: Intentar el formato "Normal" por si otro PDF viene bien
            // Código -> Cantidad -> Nombre -> Precio
            const normalRegex = /(\d{6,10})\s+(\d+(?:[.,]\d+)?)\s+(.+?)\s+(\d+\.\d{2})/g;
            while ((match = normalRegex.exec(fullText)) !== null) {
                items.push({
                    date: invoiceDate || new Date().toISOString().split('T')[0],
                    name: match[3].trim(),
                    quantity: parseFloat(match[2].replace(',', '.')),
                    price: parseFloat(match[4].replace(',', '.')),
                });
                matchCount++;
            }
        }

        if (matchCount === 0) {
            const debugAnchor = fullText.match(/LATA|BALDE|7798\d{9}|30823/);
            let debugContext = debugAnchor
                ? fullText.substring(Math.max(0, debugAnchor.index - 50), Math.min(fullText.length, debugAnchor.index + 150))
                : fullText.substring(0, 300);

            console.warn("Fallo de parsing. Contexto:", debugContext);
            throw new Error(`Error de lectura. No detecté productos. 
        Muestra esto al soporte: "Texto: ${debugContext.replace(/\n/g, ' ')}"`);
        }

        return items;

    } catch (error) {
        console.error("Error parsing PDF:", error);
        // Throw the real error to help debugging
        throw new Error(error.message || "Error desconocido al procesar el PDF");
    }
}
