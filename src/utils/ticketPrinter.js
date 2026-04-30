
import { tenant } from '../config/tenant';

export const printTicket = (order) => {
    // order: { orderNumber, items: [{ name, quantity, price? }], total, date, paymentMethod, cashReceived, change, observations }

    // Default values if missing
    const items = order.items || [];
    const total = order.totalAmount || 0;
    const date = order.date || new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const orderNumber = order.orderNumber || 'S/N';
    const paymentMethod = order.paymentMethod || 'Efectivo';
    const cashReceived = order.cashReceived || 0;
    const change = order.change || 0;
    const observations = order.observations || '';
    const customerName = order.customerName || '';
    const customerPoints = order.customerPoints || 0;
    const fiscalData = order.fiscalData || null; // { cae, caeExpiration, voucherNumber, qrData }

    const printWindow = window.open("", "", "height=600,width=400");
    if (!printWindow) return;

    const orderDetailsHTML = items.map(item =>
        `<div style="margin-bottom: 8px;">
            <div style="display:flex; justify-content:space-between; font-weight: bold; font-size: 20px;">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.quantity * (item.price || 0)).toLocaleString('es-AR')}</span>
            </div>
            ${item.obs ? `<div style="font-size: 0.85em; padding-left: 10px; font-style: italic;">> ${item.obs}</div>` : ''}
        </div>`
    ).join('');

    const cardReceived = order.cardReceived || 0;
    const transferReceived = order.transferReceived || 0;

    let paymentBreakdown = '';
    if (paymentMethod === 'mixto') {
        paymentBreakdown = `
            <div style="font-size: 0.9em; margin-top: 5px;">
                ${cashReceived > 0 ? `<div>Efectivo: $${cashReceived.toLocaleString('es-AR')}</div>` : ''}
                ${cardReceived > 0 ? `<div>Tarjeta: $${cardReceived.toLocaleString('es-AR')}</div>` : ''}
                ${transferReceived > 0 ? `<div>Transferencia: $${transferReceived.toLocaleString('es-AR')}</div>` : ''}
                ${change > 0 ? `<div style="font-weight:bold; margin-top:2px;">Vuelto: $${change.toLocaleString('es-AR')}</div>` : ''}
            </div>
        `;
    } else {
        // Single method details
        if (paymentMethod === 'efectivo' && cashReceived > 0) {
            paymentBreakdown = `<div style="font-weight: bold;">Abonó: $${cashReceived.toLocaleString('es-AR')}</div><div style="font-weight: bold;">Vuelto: $${change.toLocaleString('es-AR')}</div>`;
        }
    }

    const paymentDetailsHTML = `
        <div style="border-top: 1px dashed black; margin: 10px 0; padding-top: 10px;">
            <div style="font-weight: bold; font-size: 1.2em;">TOTAL: $${total.toLocaleString('es-AR')}</div>
            <div style="font-weight: bold;">Método: ${paymentMethod.toUpperCase()}</div>
            ${paymentBreakdown}
        </div>
    `;

    printWindow.document.write('<html><head><title>Ticket Seitu</title>');
    printWindow.document.write(`
        <style>
            body {
                width: 80mm;
                font-family: Arial, Helvetica, sans-serif; 
                font-size: 20px;
                margin: 0;
                padding: 10px;
                color: black;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 32px; font-weight: bold; }
            .meta { font-size: 18px; margin-bottom: 10px; font-weight: bold; }
            .items { margin-bottom: 15px; }
            .footer { text-align: center; margin-top: 20px; font-size: 18px; }
            .logo-placeholder { 
                width: 60px; height: 60px; background: #eee; margin: 0 auto 10px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
            }
            @media print {
                @page { margin: 0; }
                body { margin: 0.5cm; }
            }
        </style>
    `);
    printWindow.document.write('</head><body>');

    // Header
    printWindow.document.write('<div class="header">');
    // Using the Instagram icon URL found in legacy code
    printWindow.document.write('<img src="/seitu_logo.jpg" alt="Seitu" style="width: 80px; margin-bottom: 10px;" onerror="this.style.display=\'none\'" />');
    printWindow.document.write(`<h1>${tenant.systemName}</h1>`);

    if (fiscalData) {
        printWindow.document.write('<div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">RESPONSABLE MONOTRIBUTO</div>');
        printWindow.document.write('<div style="font-size: 14px; margin-bottom: 5px;">CUIT: 27-35223464-3</div>');
    }

    printWindow.document.write('<div class="meta">');
    printWindow.document.write(`<div>Fecha: ${date} - Hora: ${time}</div>`);

    if (fiscalData) {
        printWindow.document.write(`<div style="font-size: 24px; font-weight: bold; margin: 10px 0; border: 2px solid black; display: inline-block; padding: 5px 10px;">FACTURA C Nº ${fiscalData.voucherNumber.toString().padStart(8, '0')}</div>`);
    } else {
        printWindow.document.write(`<div style="font-size: 28px; font-weight: bold; margin: 10px 0; border: 2px solid black; display: inline-block; padding: 5px 10px;">PEDIDO #${orderNumber}</div>`);
    }
    if (customerName) {
        // Extract earned points from order, separate from total balance
        const pointsEarned = order.pointsEarned || 0;

        printWindow.document.write(`
            <div style="margin-bottom: 10px; font-weight: bold; line-height: 1.2;">
                <span style="font-size: 14px; font-weight: normal; display: block; margin-bottom: 2px;">CLIENTE:</span>
                <span style="font-size: 26px;">${customerName.toUpperCase()}</span>
                
                ${pointsEarned > 0 ? `
                <div style="margin-top: 5px; margin-bottom: 5px; border: 2px solid black; padding: 5px; border-radius: 6px; display: inline-block; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                    <div style="font-size: 12px; font-weight: normal;">SUMASTE EN ESTA COMPRA:</div>
                    <div style="font-size: 24px; font-weight: black;">+${pointsEarned} Pts</div>
                </div>
                ` : ''}

                ${customerPoints !== undefined ? `
                <div style="margin-top: 5px; background: #000; color: #fff; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                    TOTAL ACUMULADO: ${customerPoints} Pts
                </div>` : ''}
            </div>
        `);
    }
    printWindow.document.write('</div>');
    printWindow.document.write('</div>');

    // Body
    printWindow.document.write('<div class="items">');
    printWindow.document.write(orderDetailsHTML);
    printWindow.document.write('</div>');

    // Payment
    printWindow.document.write(paymentDetailsHTML);

    // Observations
    if (observations) {
        printWindow.document.write(`<div style="margin-top:10px; font-style:italic; white-space: pre-wrap; font-size: 0.9em; border-top: 1px solid #eee; padding-top: 5px;">Obs: ${observations}</div>`);
    }

    // Fiscal Footer (CAE & QR)
    if (fiscalData) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fiscalData.qrData)}`;
        printWindow.document.write(`
            <div style="margin-top: 15px; border-top: 2px solid black; padding-top: 10px; display: flex; flex-direction: column; align-items: center; text-align: center;">
                <img src="${qrUrl}" width="120" height="120" style="margin-bottom: 10px;" />
                <div style="font-size: 12px; font-weight: bold;">CAE: ${fiscalData.cae}</div>
                <div style="font-size: 12px; font-weight: bold;">Vencimiento CAE: ${new Date(fiscalData.caeExpiration).toLocaleDateString()}</div>
                <div style="font-size: 10px; margin-top: 5px; color: #555;">Comprobante Autorizado por AFIP</div>
            </div>
        `);
    }

    // Footer
    printWindow.document.write('<div class="footer">');
    printWindow.document.write('<div style="margin-bottom: 5px;">Siguenos en Instagram</div>');
    printWindow.document.write('<img src="/instagram_logo.png" width="30" style="vertical-align:middle; margin-right:5px;"/>');
    printWindow.document.write(`<span style="font-weight: bold;">@${tenant.social.instagram}</span>`);
    printWindow.document.write('<div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 14px; font-weight: bold;">');
    printWindow.document.write('Consulta tus puntos con tu DNI en:<br/>');
    printWindow.document.write(`<span style="font-size: 16px;">${tenant.domain}</span>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<p style="font-weight: bold; font-size: 1.1em; margin-top: 15px;">¡Gracias por su compra!</p>');
    printWindow.document.write('</div>');

    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Wait for images to load before printing
    setTimeout(() => {
        printWindow.print();
    }, 500);
};

export const printSessionClosure = (session) => {
    // session: { id, cashier, startedAt, endedAt, initialCash, declaredTotal, expectedCash, difference, stats: { cashSales, cardSales, transferSales, totalExpenses, totalDiscounts, cashBreakdown } }
    const printWindow = window.open("", "", "height=600,width=400");
    if (!printWindow) return;

    const stats = session.stats || {};
    const breakdown = stats.cashBreakdown || {};

    printWindow.document.write('<html><head><title>Cierre de Turno</title>');
    printWindow.document.write(`
        <style>
            body { width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 18px; padding: 10px; color: black; line-height: 1.2; }
            .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; border-bottom: 1px dashed black; margin-bottom: 5px; text-transform: uppercase; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .total-row { font-weight: bold; font-size: 1.2em; border-top: 1px solid black; margin-top: 5px; padding-top: 5px; }
            .breakdown-row { font-size: 16px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; }
            @media print { @page { margin: 0; } }
        </style>
    `);
    printWindow.document.write('</head><body>');

    // Header
    printWindow.document.write('<div class="header">');
    printWindow.document.write(`<h1>${tenant.systemName.toUpperCase()}</h1>`);
    printWindow.document.write('<div>RESUMEN DE CIERRE</div>');
    printWindow.document.write(`<div>Turno #${session.id.slice(-4)}</div>`);
    printWindow.document.write('</div>');

    // Meta Information
    printWindow.document.write('<div class="section">');
    printWindow.document.write(`<div class="row"><span>CAJERO:</span><span>${session.cashier}</span></div>`);
    printWindow.document.write(`<div class="row"><span>INICIO:</span><span>${new Date(session.startedAt).toLocaleString()}</span></div>`);
    printWindow.document.write(`<div class="row"><span>FIN:</span><span>${new Date(session.endedAt || Date.now()).toLocaleString()}</span></div>`);
    printWindow.document.write('</div>');

    // Financial Summary
    printWindow.document.write('<div class="section">');
    printWindow.document.write('<div class="section-title">Resumen Financiero</div>');
    printWindow.document.write(`<div class="row"><span>Fondo Inicial:</span><span>$${(session.initialCash || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="row"><span>(+) Ventas Efectivo:</span><span>$${(stats.cashSales || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="row"><span>(+) Ventas Tarjeta:</span><span>$${(stats.cardSales || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="row"><span>(+) Transferencias:</span><span>$${(stats.transferSales || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="row"><span>(-) Descuentos:</span><span>-$${(stats.totalDiscounts || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="row"><span>(-) Retiros / Gastos:</span><span>-$${(stats.totalExpenses || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write('</div>');

    // Expected vs Declared
    printWindow.document.write('<div class="section">');
    printWindow.document.write('<div class="section-title">Consolidación de Caja</div>');
    printWindow.document.write(`<div class="row"><span>EFECTIVO ESPERADO:</span><span>$${(session.expectedCash || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="row"><span>EFECTIVO DECLARADO:</span><span>$${(session.declaredTotal || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="row total-row"><span>DIFERENCIA:</span><span>$${(session.difference || 0).toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write('</div>');

    // Cash Breakdown
    if (Object.keys(breakdown).length > 0) {
        printWindow.document.write('<div class="section">');
        printWindow.document.write('<div class="section-title">Arqueo de Billetes</div>');
        Object.entries(breakdown)
            .filter(([_, qty]) => Number(qty) > 0)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .forEach(([denom, qty]) => {
                printWindow.document.write(`<div class="row breakdown-row"><span>$${Number(denom).toLocaleString()} x ${qty}</span><span>$${(Number(denom) * qty).toLocaleString('es-AR')}</span></div>`);
            });
        printWindow.document.write('</div>');
    }

    // Footer
    printWindow.document.write('<div class="footer">');
    printWindow.document.write('<div style="margin-top: 15px; border-top: 1px solid black; width: 80%; margin-left: 10%;"></div>');
    printWindow.document.write('<div style="font-size: 0.8em;">Firma del Responsable</div>');
    printWindow.document.write('</div>');

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
};

export const printWithdrawalTicket = (withdrawal, cashier) => {
    // withdrawal: { description, amount, timestamp }
    const printWindow = window.open("", "", "height=400,width=400");
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Comprobante de Retiro</title>');
    printWindow.document.write(`
        <style>
            body { width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 18px; padding: 15px; color: black; text-align: center; }
            .box { border: 2px solid black; padding: 15px; }
            .header { font-weight: bold; font-size: 24px; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 15px; }
            .amount { font-size: 32px; font-weight: bold; margin: 20px 0; }
            .detail { text-align: left; margin-bottom: 10px; }
            .footer { margin-top: 40px; }
            .signature { border-top: 1px solid black; margin-top: 30px; padding-top: 5px; width: 80%; margin-left: 10%; }
        </style>
    `);
    printWindow.document.write('</head><body>');

    printWindow.document.write('<div class="box">');
    printWindow.document.write('<div class="header">RETIRO DE CAJA</div>');
    printWindow.document.write(`<div>${new Date(withdrawal.timestamp).toLocaleString()}</div>`);
    printWindow.document.write('<div class="amount">$' + Number(withdrawal.amount).toLocaleString('es-AR') + '</div>');
    printWindow.document.write('<div class="detail"><strong>DETALLE:</strong> ' + withdrawal.description + '</div>');
    printWindow.document.write('<div class="detail"><strong>CAJERO:</strong> ' + cashier + '</div>');
    printWindow.document.write('<div class="footer">');
    printWindow.document.write('<div class="signature">Firma Entrega</div>');
    printWindow.document.write('</div>');
    printWindow.document.write('</div>');

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
};

export const printPurchaseInvoice = (purchase) => {
    // purchase: { date, invoiceNumber, items: [{ name, category, quantity, packUnits, price }], subtotal, ivaAmount, perceptions, total }
    const printWindow = window.open("", "", "height=600,width=400");
    if (!printWindow) return;

    const items = purchase.items || [];
    const date = purchase.date || new Date().toLocaleDateString();
    const invoiceNumber = purchase.invoiceNumber || 'S/N';

    const itemsHTML = items.map(item => `
        <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
            <div style="display:flex; justify-content:space-between; font-weight: bold;">
                <span>${item.name}</span>
                <span>$${(item.quantity * item.price).toLocaleString('es-AR')}</span>
            </div>
            <div style="font-size: 14px; color: #666;">
                ${item.quantity} x ${item.packUnits} un. @ $${Number(item.price).toLocaleString('es-AR')} (Bulto)
            </div>
        </div>
    `).join('');

    printWindow.document.write('<html><head><title>Factura de Compra</title>');
    printWindow.document.write(`
        <style>
            body { width: 80mm; font-family: Arial, sans-serif; font-size: 16px; padding: 10px; color: black; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; }
            .meta { margin-bottom: 15px; font-weight: bold; }
            .footer { margin-top: 20px; border-top: 1px dashed black; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px; }
            .grand-total { font-size: 20px; border-top: 1px solid black; margin-top: 8px; padding-top: 8px; }
            @media print { @page { margin: 0; } }
        </style>
    `);
    printWindow.document.write('</head><body>');

    printWindow.document.write('<div class="header">');
    printWindow.document.write(`<h1>${tenant.systemName.toUpperCase()}</h1>`);
    printWindow.document.write('<div>COMPROBANTE DE CARGA</div>');
    printWindow.document.write('</div>');

    printWindow.document.write('<div class="meta">');
    printWindow.document.write(`<div>FECHA: ${date}</div>`);
    printWindow.document.write(`<div>FACTURA: ${invoiceNumber}</div>`);
    printWindow.document.write('</div>');

    printWindow.document.write('<div class="items">');
    printWindow.document.write(itemsHTML);
    printWindow.document.write('</div>');

    printWindow.document.write('<div class="footer">');
    printWindow.document.write(`<div class="total-row"><span>Subtotal Neto:</span><span>$${purchase.subtotal.toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="total-row"><span>IVA (21%):</span><span>$${purchase.ivaAmount.toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="total-row"><span>Percepciones:</span><span>$${purchase.perceptions.toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write(`<div class="total-row grand-total"><span>TOTAL:</span><span>$${purchase.total.toLocaleString('es-AR')}</span></div>`);
    printWindow.document.write('</div>');

    printWindow.document.write('<div style="margin-top: 30px; text-align: center; font-size: 12px; color: #888;">');
    printWindow.document.write('Documento de control interno');
    printWindow.document.write('</div>');

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
};
