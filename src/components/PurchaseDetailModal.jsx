import React from 'react';
import { X, Printer, Package, CreditCard, Calendar, FileText } from 'lucide-react';
import { printPurchaseInvoice } from '../utils/ticketPrinter';

export default function PurchaseDetailModal({ purchase, onClose }) {
    if (!purchase) return null;

    const handlePrint = () => {
        printPurchaseInvoice(purchase);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <FileText size={20} className="text-brand-400" />
                            Detalle de Carga
                        </h3>
                        <p className="text-slate-400 text-sm">Factura N°: {purchase.invoiceNumber || 'S/N'}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Sub-header Stats */}
                <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100">
                    <div className="p-4 border-r border-slate-100 flex items-center gap-3">
                        <Calendar className="text-slate-400" size={18} />
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Carga</div>
                            <div className="text-sm font-bold text-slate-700">{purchase.date}</div>
                        </div>
                    </div>
                    <div className="p-4 flex items-center gap-3">
                        <Package className="text-slate-400" size={18} />
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Productos</div>
                            <div className="text-sm font-bold text-slate-700">{purchase.items.length} ítems registrados</div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase sticky top-0 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4 text-center">Bultos</th>
                                <th className="px-6 py-4 text-center">U. x Bulto</th>
                                <th className="px-6 py-4 text-center">Total Unid.</th>
                                <th className="px-6 py-4 text-right">Costo Neto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {purchase.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase">{item.category}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{item.quantity}</td>
                                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{item.packUnits || 1}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded-lg text-xs font-bold">
                                            {item.quantity * (item.packUnits || 1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                                        ${(item.quantity * item.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Summary */}
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                        <div className="space-y-4 w-full md:max-w-xs">
                            <button
                                onClick={handlePrint}
                                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-lg"
                            >
                                <Printer size={18} /> IMPRIMIR FACTURA
                            </button>
                        </div>

                        <div className="space-y-2 w-full md:max-w-xs bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Subtotal Neto:</span>
                                <span className="font-medium">${purchase.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>IVA (21%):</span>
                                <span className="font-medium">${purchase.ivaAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Percepciones:</span>
                                <span className="font-medium">${purchase.perceptions.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-dashed border-slate-200 mt-2">
                                <span className="text-sm font-bold text-slate-800 uppercase">Total Final:</span>
                                <span className="text-xl font-black text-brand-600">
                                    ${purchase.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
