import React, { useState, useEffect } from 'react';
import { Lock, History, DollarSign, Printer, Banknote, Plus, Minus, CreditCard, ArrowRight, X, Search, Calendar, Edit, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { printTicket, printSessionClosure, printWithdrawalTicket } from '../utils/ticketPrinter';
import { supabase } from '../utils/supabaseClient';
import { useStore } from '../hooks/useStore.jsx';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { exportToExcel } from '../utils/excelExport';

// --- SUB-COMPONENT: BILL COUNTER ---
const BillCounter = ({ denominations = {}, onTotalChange }) => {
    const handleChange = (denom, qty) => {
        const next = { ...denominations, [denom]: qty };
        const total = Object.entries(next).reduce((sum, [d, c]) => sum + (Number(d) * c), 0);
        onTotalChange({ total, breakdown: next });
    };

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-4">
            <h4 className="text-blue-800 dark:text-blue-400 font-bold mb-3 text-xs uppercase flex items-center gap-2">
                <Banknote size={14} /> Arqueo de Billetes
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {[20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10].map(denom => (
                    <div key={denom} className="flex flex-col items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-blue-100 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-2">${denom.toLocaleString()}</span>
                        <div className="flex items-center gap-2 w-full justify-center">
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">x</span>
                            <input
                                type="number"
                                min="0"
                                className="w-full max-w-[60px] text-center text-xl outline-none font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 rounded-lg py-1 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                placeholder="0"
                                value={denominations[denom] || ''}
                                onChange={(e) => handleChange(denom, parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: EDIT PAYMENT METHOD MODAL ---
const EditPaymentMethodModal = ({ sale, onClose, onSave }) => {
    const [newPaymentMethod, setNewPaymentMethod] = useState(sale.paymentMethod);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    // Detailed amounts state
    const [cashPart, setCashPart] = useState(formatCurrency(sale.cashReceived || 0));
    const [cardPart, setCardPart] = useState(formatCurrency(sale.cardReceived || 0));
    const [transferPart, setTransferPart] = useState(formatCurrency(sale.transferReceived || 0));

    useEffect(() => {
        // If switching from a simple method to another simple method, we can auto-fill
        if (newPaymentMethod !== 'mixto' && newPaymentMethod !== sale.paymentMethod) {
            setCashPart(formatCurrency(newPaymentMethod === 'efectivo' ? sale.totalAmount : 0));
            setCardPart(formatCurrency(newPaymentMethod === 'tarjeta' ? sale.totalAmount : 0));
            setTransferPart(formatCurrency(newPaymentMethod === 'transferencia' ? sale.totalAmount : 0));
        }
    }, [newPaymentMethod, sale.totalAmount, sale.paymentMethod]);

    const handleSave = () => {
        if (!reason.trim()) {
            setError('El motivo es obligatorio');
            return;
        }

        const overrides = {
            cashReceived: parseCurrency(cashPart),
            cardReceived: parseCurrency(cardPart),
            transferReceived: parseCurrency(transferPart)
        };

        if (newPaymentMethod === 'mixto') {
            const sum = overrides.cashReceived + overrides.cardReceived + overrides.transferReceived;
            // Check for precision issues
            if (Math.abs(sum - sale.totalAmount) > 0.1) {
                setError(`La suma de los montos ($${sum.toLocaleString('es-AR')}) debe ser igual al total de la venta ($${sale.totalAmount.toLocaleString('es-AR')})`);
                return;
            }
        }

        // Check if anything changed
        const amountsChanged =
            overrides.cashReceived !== (sale.cashReceived || 0) ||
            overrides.cardReceived !== (sale.cardReceived || 0) ||
            overrides.transferReceived !== (sale.transferReceived || 0);

        if (newPaymentMethod === sale.paymentMethod && !amountsChanged) {
            setError('No se han detectado cambios en el método o los montos');
            return;
        }

        onSave(sale.id, newPaymentMethod, reason.trim(), overrides);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Modificar Pago</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Venta #{sale.orderNumber || sale.id.slice(-4)} - Total: ${sale.totalAmount.toLocaleString('es-AR')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 text-xl">
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* New Payment Method Selector */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider">Nuevo Método de Pago</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'efectivo', label: 'Efectivo', icon: '💵' },
                                { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
                                { id: 'transferencia', label: 'Transferencia', icon: '📱' },
                                { id: 'mixto', label: 'Mixto', icon: '🔀' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setNewPaymentMethod(m.id)}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 flex items-center justify-center gap-2 ${newPaymentMethod === m.id
                                        ? 'bg-brand-500 border-brand-500 text-white shadow-lg scale-[1.02]'
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-200 dark:hover:border-brand-900'}`}
                                >
                                    <span>{m.icon}</span> {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Amounts */}
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Distribución de Montos</h4>

                        {/* Cash Field */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                                <Banknote size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-500">Efectivo</span>
                                </div>
                                <input
                                    type="text"
                                    disabled={newPaymentMethod !== 'mixto' && newPaymentMethod !== 'efectivo'}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 dark:text-white disabled:opacity-50"
                                    value={cashPart}
                                    onChange={e => setCashPart(formatCurrency(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Card Field */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <CreditCard size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-500">Tarjeta</span>
                                </div>
                                <input
                                    type="text"
                                    disabled={newPaymentMethod !== 'mixto' && newPaymentMethod !== 'tarjeta'}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 dark:text-white disabled:opacity-50"
                                    value={cardPart}
                                    onChange={e => setCardPart(formatCurrency(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Transfer Field */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <ArrowRight size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-500">Transferencia</span>
                                </div>
                                <input
                                    type="text"
                                    disabled={newPaymentMethod !== 'mixto' && newPaymentMethod !== 'transferencia'}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 dark:text-white disabled:opacity-50"
                                    value={transferPart}
                                    onChange={e => setTransferPart(formatCurrency(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">Motivo del Cambio *</label>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none h-20 text-sm shadow-inner"
                            placeholder="Ej: El cliente se confundió al informar el pago..."
                        />
                        {error && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        Descartar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-black hover:bg-brand-700 transition-all shadow-lg active:scale-95"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- VIEW: OPEN TURN ---
const OpenTurnView = ({ sessions, openSession, forceSyncSessions, setSelectedSession, loadData }) => {
    // Polling: Auto-refresh data from cloud every 60 seconds while viewing Open Turn
    useEffect(() => {
        const interval = setInterval(() => {
            console.log("⏱️ Auto-refreshing open turn data...");
            loadData();
        }, 60000);
        return () => clearInterval(interval);
    }, [loadData]);
    const [cashier, setCashier] = useState('');
    const [initialCash, setInitialCash] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    // Find last session for comparison
    const lastSession = sessions.filter(s => s.endedAt).sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))[0];

    const [initialBreakdown, setInitialBreakdown] = useState({});

    const handleForceSync = async () => {
        if (!window.confirm('¿Intentar subir manualmente los turnos faltantes a la nube?')) return;

        setIsSyncing(true);
        const result = await forceSyncSessions();
        setIsSyncing(false);

        if (result.success) {
            alert(`✅ Sincronización completa. Se subieron ${result.count} turnos.`);
        } else {
            alert('❌ Error al sincronizar: ' + result.error);
        }
        if (result.success) {
            // Optional: force reload logic if needed, but alert is usually enough
        }
    };

    const handleOpen = () => {
        if (!cashier.trim()) {
            alert('Ingrese nombre del cajero');
            return;
        }
        if (window.confirm('¿Iniciar nuevo turno?')) {
            openSession({ cashier, initialCash, initialBreakdown });
            alert(`Buen Turno ${cashier} que tengas un excelente día!\n\nRecuerda:\nRegla 1: El cliente siempre tiene la razón.\nRegla 2: Si el cliente se equivoca, véase la Regla 1`);
        }
    };

    const handleInitialCashChange = (data) => {
        // BillCounter returns { total, breakdown }
        setInitialCash(data.total);
        setInitialBreakdown(data.breakdown);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Apertura de Caja</h2>
                    <p className="text-slate-500 dark:text-slate-400">Inicie un nuevo turno para comenzar a operar</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cajero Responsable</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none text-lg"
                            placeholder="Nombre del cajero..."
                            value={cashier}
                            onChange={e => setCashier(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fondo Inicial (Arqueo)</label>
                            <BillCounter denominations={initialBreakdown} onTotalChange={handleInitialCashChange} />
                            <div className="text-right font-bold text-xl text-slate-900 dark:text-white mt-2">
                                Total: ${(initialCash || 0).toLocaleString('es-AR')}
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 h-fit">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 text-sm uppercase">Último Cierre</h4>
                            {lastSession ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Fecha:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{new Date(lastSession.endedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Cajero:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{lastSession.cashier || '-'}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center mt-2">
                                        <span className="text-slate-500 dark:text-slate-400 font-bold">Cierre Caja:</span>
                                        <span className={`font-bold text-lg ${initialCash !== lastSession.declaredTotal ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            ${(lastSession.declaredTotal || 0).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    {initialCash !== lastSession.declaredTotal && (
                                        <div className="text-xs text-red-500 dark:text-red-400 text-center font-bold mt-2 bg-red-50 dark:bg-red-900/20 p-1 rounded">
                                            ⚠ Diferencia detectada: ${((initialCash || 0) - (lastSession.declaredTotal || 0)).toLocaleString('es-AR')}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-slate-400 dark:text-slate-500 italic text-sm">No hay datos previos</div>
                            )}
                            <button
                                onClick={handleForceSync}
                                disabled={isSyncing}
                                className={`flex items-center justify-center gap-2 w-full mt-4 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                            >
                                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                                {isSyncing ? 'SINCRONIZANDO...' : 'FORZAR SUBIDA DE DATOS'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleOpen}
                        disabled={!cashier}
                        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ABRIR CAJA
                    </button>
                </div>
            </div>

            {/* --- ADDED: HISTORY TABLE IN OPEN VIEW --- */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <History size={18} className="text-slate-500 dark:text-slate-400" />
                            Historial Reciente
                        </h3>
                        <div className="flex gap-2">
                            <div className="text-[10px] text-slate-400 dark:text-slate-600 max-w-[250px] leading-tight italic text-right">
                                Historial de los últimos turnos finalizados en esta sucursal.
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 text-left">Iniciado</th>
                                    <th className="px-4 py-3 text-left">Finalizado</th>
                                    <th className="px-4 py-3 text-left">Cajero</th>
                                    <th className="px-4 py-3 text-left">Declarado</th>
                                    <th className="px-4 py-3 text-left">Diferencia</th>
                                    <th className="px-4 py-3 text-right">Ventas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sessions
                                    .slice(0, 5) // El store ya está ordenado DESC
                                    .map(s => (
                                        <tr
                                            key={s.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                            onClick={() => s.endedAt && setSelectedSession(s)}
                                        >
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(s.startedAt).toLocaleString('es-AR', { hour12: false })}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.endedAt ? new Date(s.endedAt).toLocaleString('es-AR', { hour12: false }) : <span className="text-green-600 dark:text-green-400 font-bold">Activo</span>}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{s.cashier}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">${(s.declaredTotal || 0).toLocaleString('es-AR') || '-'}</td>
                                            <td className={`px-4 py-3 font-bold ${(s.difference || 0) < 0 ? 'text-red-500 dark:text-red-400' : (s.difference || 0) > 0 ? 'text-green-500 dark:text-green-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                                {s.difference !== undefined && s.difference !== null ? `$${s.difference.toLocaleString('es-AR')}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{s.salesCount || 0}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: SESSION DETAIL MODAL ---
const SessionDetailModal = ({ session, onClose }) => {
    const { sales, expenses, updateSalePaymentMethod, toggleSaleVerified, updateExpense, addToEnvelope, envelopes, activeSession } = useStore();
    const [showExpenses, setShowExpenses] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [isSavingToEnvelope, setIsSavingToEnvelope] = useState(null); // expenseId
    const [targetEnvelope, setTargetEnvelope] = useState('');

    const handleSaveToEnvelope = (expense) => {
        if (!targetEnvelope) return;

        // 1. Add to envelope
        addToEnvelope(targetEnvelope, expense.amount, activeSession?.cashier || session.cashier);

        // 2. Update expense metadata
        updateExpense(expense.id, { savedToEnvelope: true, envelopeName: targetEnvelope });

        setIsSavingToEnvelope(null);
        setTargetEnvelope('');
        alert('✅ Movimiento guardado en el sobre: ' + targetEnvelope);
    };

    const handlePrintSummary = () => {
        printSessionClosure(session);
    };
    // Filter data for this specific session
    const sessionSales = sales.filter(s => {
        const time = new Date(s.timestamp).getTime();
        const start = new Date(session.startedAt).getTime();
        const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
        return time >= start && time <= end;
    });

    const sessionExpenses = expenses.filter(e => {
        const time = new Date(e.timestamp).getTime();
        const start = new Date(session.startedAt).getTime();
        const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
        return time >= start && time <= end;
    });

    const sessionDiscountItems = sessionSales.flatMap(sale =>
        (sale.items || [])
            .filter(item => item.price < 0 || item.isExpense)
            .map(item => ({
                id: `sale-${sale.id}-${item.name}`,
                description: `${item.name}${item.obs ? `: ${item.obs}` : ''} (Venta #${sale.orderNumber})`,
                amount: Math.abs(item.price * (item.quantity || 1)),
                type: 'expense',
                timestamp: sale.timestamp,
                isPOSDiscount: true
            }))
    );

    // Use stored stats if available (legacy support: recalc if missing)
    const stats = session.stats || {
        cashSales: 0,
        cardSales: 0,
        transferSales: 0,
        totalExpenses: 0,
        totalIncomes: 0, // Added totalIncomes
        totalDiscounts: 0,
        cashBreakdown: {}
    };

    // Recalculate accurately for the modal if data exists
    const calcStats = sessionSales.reduce((acc, sale) => {
        const saleGross = sale.items.reduce((sum, item) => sum + (item.price > 0 ? (item.price * (item.quantity || 1)) : 0), 0);
        const saleDiscount = sale.items.reduce((sum, item) => sum + (item.price < 0 ? Math.abs(item.price * (item.quantity || 1)) : 0), 0);
        const saleNet = sale.totalAmount || (saleGross - saleDiscount);

        acc.discounts += saleDiscount;

        if (sale.paymentMethod === 'efectivo') {
            acc.cash += saleGross;
        } else if (sale.paymentMethod === 'tarjeta') {
            acc.card += saleGross;
        } else if (sale.paymentMethod === 'transferencia') {
            acc.transfer += saleGross;
        } else if (sale.paymentMethod === 'mixto') {
            const cashPart = sale.cashReceived || 0;
            const cardPart = sale.cardReceived || 0;
            const transferPart = sale.transferReceived || 0;
            const totalPaid = cashPart + cardPart + transferPart;
            if (totalPaid > 0) {
                acc.cash += (cashPart / totalPaid) * saleGross;
                acc.card += (cardPart / totalPaid) * saleGross;
                acc.transfer += (transferPart / totalPaid) * saleGross;
            } else {
                acc.cash += saleGross;
            }
        }
        return acc;
    }, { cash: 0, card: 0, transfer: 0, discounts: 0 });

    // --- FETCH MISSING EXPENSES LOGIC ---
    const [fetchedExpenses, setFetchedExpenses] = useState([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);

    useEffect(() => {
        const fetchMissingExpenses = async () => {
            // If we have no local expenses for this session, but the session stats say we should...
            const statsExpenses = session.stats?.totalExpenses || 0;
            const statsIncomes = session.stats?.totalIncomes || 0;
            const hasActivity = statsExpenses > 0 || statsIncomes > 0;

            if (sessionExpenses.length === 0 && hasActivity && session.endedAt) {
                console.log("Fetching missing expenses for session:", session.id);
                console.log("Time Window:", session.startedAt, "to", session.endedAt);
                setLoadingExpenses(true);
                try {
                    // Buffer of 5 minutes to account for slight clock skews or delays
                    const startBuffer = new Date(new Date(session.startedAt).getTime() - 5 * 60000).toISOString();
                    const endBuffer = new Date(new Date(session.endedAt).getTime() + 5 * 60000).toISOString();

                    const { data, error } = await supabase
                        .from('expenses')
                        .select('*')
                        .gte('timestamp', startBuffer)
                        .lte('timestamp', endBuffer)
                        .order('timestamp', { ascending: false });

                    if (data && !error) {
                        console.log("Fetched Expenses:", data.length);
                        const mapped = data.map(e => ({
                            id: e.id,
                            description: e.description,
                            amount: Number(e.amount),
                            type: e.type,
                            timestamp: e.timestamp,
                            savedToEnvelope: e.saved_to_envelope,
                            envelopeName: e.envelope_name
                        }));
                        setFetchedExpenses(mapped);
                    } else if (error) {
                        console.error("Supabase Error:", error);
                    }
                } catch (err) {
                    console.error("Error fetching expenses:", err);
                } finally {
                    setLoadingExpenses(false);
                }
            }
        };

        fetchMissingExpenses();
    }, [session, sessionExpenses.length]);

    // Use fetched expenses if local are empty, otherwise use local
    const displayExpenses = [...(sessionExpenses.length > 0 ? sessionExpenses : fetchedExpenses), ...sessionDiscountItems].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


    const modalTotalExpenses = displayExpenses.filter(ex => ex.type !== 'income' && !ex.isPOSDiscount).reduce((sum, ex) => sum + Number(ex.amount), 0);
    const modalWithdrawals = displayExpenses.filter(ex => ex.type !== 'income' && ex.savedToEnvelope).reduce((sum, ex) => sum + Number(ex.amount), 0);
    const modalExpensesOnly = displayExpenses.filter(ex => ex.type !== 'income' && !ex.savedToEnvelope && !ex.isPOSDiscount).reduce((sum, ex) => sum + Number(ex.amount), 0);
    const modalTotalIncomes = displayExpenses.filter(ex => ex.type === 'income').reduce((sum, ex) => sum + Number(ex.amount), 0);


    const handlePaymentMethodUpdate = (saleId, newPaymentMethod, reason, overrides) => {
        const result = updateSalePaymentMethod(saleId, newPaymentMethod, reason, null, overrides);
        if (result.success) {
            alert('✅ Forma de pago actualizada correctamente');
            setEditingSale(null);
            // Force re-render by closing and reopening would be ideal, but just closing the edit modal is enough
        } else {
            alert('❌ Error: ' + result.error);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <History size={24} className="text-brand-500" />
                            Detalle de Turno #{session.id.slice(-4)}
                        </h3>
                        <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{session.cashier}</span>
                            <span>{new Date(session.startedAt).toLocaleString('es-AR', { hour12: false })} - {session.endedAt ? new Date(session.endedAt).toLocaleString('es-AR', { hour12: false }) : 'En curso'}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => {
                                const data = sessionSales.map(sale => ({
                                    'Hora': new Date(sale.timestamp).toLocaleTimeString('es-AR', { hour12: false }),
                                    'Venta #': sale.orderNumber || sale.id.slice(-4),
                                    'Items': sale.items.map(i => `${i.quantity}x ${i.name}`).join(' | '),
                                    'Total': sale.totalAmount,
                                    'Método': sale.paymentMethod === 'mixto'
                                        ? `Mixto ($${sale.cashReceived || 0} Ef, $${sale.cardReceived || 0} Tar, $${sale.transferReceived || 0} Tra)`
                                        : sale.paymentMethod,
                                    'Cajero': session.cashier
                                }));
                                exportToExcel(data, `Ventas_Turno_${session.cashier}_${new Date(session.startedAt).toISOString().split('T')[0]}`, 'Ventas');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm text-sm"
                            title="Exportar todas las ventas de este turno a Excel"
                        >
                            <FileSpreadsheet size={18} /> Excel Ventas
                        </button>
                        <button
                            onClick={handlePrintSummary}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm"
                        >
                            <Printer size={18} /> Imprimir Resumen
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X size={24} className="text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Col 1: Totals */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase border-b border-slate-200 dark:border-slate-700 pb-2">Resumen Financiero</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">Fondo Inicial</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">${(session.initialCash || 0).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-700 dark:text-green-400">
                                    <span className="font-bold flex items-center gap-1"><Plus size={12} /> Ventas Efectivo</span>
                                    <span className="font-bold">${(session.stats?.cashSales || calcStats.cash).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-blue-700 dark:text-blue-400">
                                    <span className="font-medium flex items-center gap-1"><CreditCard size={12} /> Ventas Tarjeta</span>
                                    <span className="font-bold">${(session.stats?.cardSales || calcStats.card).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-purple-700 dark:text-purple-400">
                                    <span className="font-medium flex items-center gap-1"><ArrowRight size={12} /> Transferencias</span>
                                    <span className="font-bold">${(session.stats?.transferSales || calcStats.transfer).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                                    <span className="font-medium flex items-center gap-1"><Minus size={12} /> Descuentos</span>
                                    <span className="font-bold">-${(session.stats?.totalDiscounts || calcStats.discounts).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                                    <span className="font-medium flex items-center gap-1 underline decoration-dotted" onClick={() => setShowExpenses(true)}><Minus size={12} /> Gastos / Pagos</span>
                                    <span className="font-bold">-${modalExpensesOnly.toLocaleString('es-AR')}</span>
                                </div>
                                <div
                                    className="flex justify-between items-center text-red-600 dark:text-red-400 border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                                    onClick={() => setShowExpenses(true)}
                                    title="Ver detalles de gastos"
                                >
                                    <span className="font-medium flex items-center gap-1 underline decoration-dotted"><ArrowRight size={12} className="rotate-45" /> Retiros / Buzón</span>
                                    <span className="font-bold">-${modalWithdrawals.toLocaleString('es-AR')}</span>
                                </div>

                                <div
                                    className="flex justify-between items-center text-green-600 dark:text-green-400 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded transition-colors"
                                    onClick={() => setShowExpenses(true)}
                                    title="Ver detalles de ingresos extra"
                                >
                                    <span className="font-medium flex items-center gap-1 underline decoration-dotted"><Plus size={12} /> Ingresos Extra</span>
                                    <span className="font-bold">+${(session.stats?.totalIncomes || modalTotalIncomes).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-800 p-2 rounded-lg mt-2 shadow-inner">
                                    <span className="font-bold text-xs uppercase opacity-70">Esperado en Caja</span>
                                    <span className="font-bold text-lg">${(session.expectedCash || session.stats?.expectedCash || 0).toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Col 2: Closing & Difference */}
                        <div className="md:col-span-2 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Cierre de Caja</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-slate-900 dark:text-white">
                                        <span className="text-slate-500 dark:text-slate-400">Declarado por Cajero</span>
                                        <span className="font-bold text-2xl">${(session.declaredTotal || 0).toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className={`p-4 rounded-lg border flex justify-between items-center ${session.difference === 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'}`}>
                                        <span className="font-bold text-sm uppercase opacity-70">Diferencia</span>
                                        <span className="font-bold text-xl">{(session.difference || session.stats?.difference) > 0 ? '+' : ''}{(session.difference !== undefined && session.difference !== null) ? session.difference.toLocaleString('es-AR') : (session.stats?.difference !== undefined ? session.stats.difference.toLocaleString('es-AR') : '0')}</span>
                                    </div>
                                    {session.notes && (
                                        <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800/50 text-yellow-800 dark:text-yellow-400 italic">
                                            "{session.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Arqueo Breakdown */}
                            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                <h4 className="text-blue-800 dark:text-blue-400 font-bold mb-3 text-xs uppercase flex items-center gap-2">
                                    <Banknote size={14} /> Arqueo Registrado
                                </h4>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {stats.cashBreakdown && Object.entries(stats.cashBreakdown).map(([denom, qty]) => (
                                        qty > 0 && (
                                            <div key={denom} className="flex justify-between bg-white dark:bg-slate-800 p-1.5 rounded border border-blue-100 dark:border-slate-700 text-xs shadow-sm">
                                                <span className="font-bold text-blue-900 dark:text-blue-300">${Number(denom).toLocaleString()}</span>
                                                <span className="text-slate-600 dark:text-slate-400">x {qty}</span>
                                            </div>
                                        )
                                    ))}
                                    {(!stats.cashBreakdown || Object.keys(stats.cashBreakdown).length === 0) && (
                                        <span className="col-span-2 text-center text-slate-400 dark:text-slate-500 text-xs italic">Sin detalle de billetes</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses List (Conditional or below) */}
                    {showExpenses && (
                        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                        <ArrowRight size={20} className="rotate-45 text-red-500" /> Detalle de Retiros y Gastos
                                    </h4>
                                    <button onClick={() => setShowExpenses(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                        <X size={20} className="text-slate-500 dark:text-slate-400" />
                                    </button>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                                    {loadingExpenses && <div className="text-center p-4 text-brand-500 font-bold">Cargando detalles...</div>}

                                    {!loadingExpenses && displayExpenses.length > 0 ? (
                                        displayExpenses.map(ex => (
                                            <div key={ex.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-slate-800 dark:text-slate-200">
                                                            {ex.isPOSDiscount && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded mr-1">TICKET</span>}
                                                            {ex.description}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(ex.timestamp).toLocaleTimeString('es-AR', { hour12: false })}</p>
                                                    </div>
                                                    <span className={`font-bold text-lg ${ex.type === 'income' ? 'text-green-600 dark:text-green-400' : (ex.savedToEnvelope ? 'text-red-600 dark:text-red-400' : (ex.isPOSDiscount ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'))}`}>
                                                        {ex.type === 'income' ? '+' : '-'}${Number(ex.amount).toLocaleString('es-AR')}
                                                    </span>
                                                </div>

                                                {/* Envelope Status */}
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700">
                                                    {ex.savedToEnvelope ? (
                                                        <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                            ✓ GUARDADO EN: {ex.envelopeName || 'SOBRE'}
                                                        </span>
                                                    ) : (
                                                        ex.type !== 'income' && !ex.isPOSDiscount && ( // Only show for non-discount expenses
                                                            <>
                                                                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                                                                    ⚠ NO GUARDADO EN SOBRE
                                                                </span>
                                                                <button
                                                                    onClick={() => setIsSavingToEnvelope(ex.id)}
                                                                    className="text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline"
                                                                >
                                                                    Subir a sobre
                                                                </button>
                                                            </>
                                                        )
                                                    )}
                                                </div>

                                                {/* Inline Save Form */}
                                                {isSavingToEnvelope === ex.id && (
                                                    <div className="mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-brand-200 dark:border-brand-900/50 animate-in slide-in-from-top-2">
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre del Sobre</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                list="modal-envelopes"
                                                                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                                                                placeholder="Ej: Buzón 1..."
                                                                value={targetEnvelope}
                                                                onChange={e => setTargetEnvelope(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <datalist id="modal-envelopes">
                                                                {envelopes.filter(e => e.status !== 'deposited').map(e => (
                                                                    <option key={e.id} value={e.name} />
                                                                ))}
                                                            </datalist>
                                                            <button
                                                                onClick={() => handleSaveToEnvelope(ex)}
                                                                disabled={!targetEnvelope.trim()}
                                                                className="bg-brand-600 text-white px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-50"
                                                            >
                                                                OK
                                                            </button>
                                                            <button
                                                                onClick={() => setIsSavingToEnvelope(null)}
                                                                className="text-slate-400 dark:text-slate-500 p-1"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-400 dark:text-slate-500 py-4">No hay gastos registrados en este turno.</p>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">Total Gastos:</span>
                                        <span className="font-bold text-xl text-red-600 dark:text-red-400">-${(session.stats?.totalExpenses || modalTotalExpenses).toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">Total Ingresos Extra:</span>
                                        <span className="font-bold text-xl text-green-600 dark:text-green-400">+${(session.stats?.totalIncomes || modalTotalIncomes).toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                                <button onClick={() => setShowExpenses(false)} className="w-full mt-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Payment Method Modal */}
            {editingSale && (
                <EditPaymentMethodModal
                    sale={editingSale}
                    onClose={() => setEditingSale(null)}
                    onSave={handlePaymentMethodUpdate}
                />
            )}
        </div>
    );
};

// --- VIEW: ACTIVE SESSION ---
const ActiveTurnView = ({
    activeSession,
    closeSession,
    addExpense,
    deleteExpense,
    deleteSale,
    currentSales,
    currentExpenses,
    historySearch,
    setHistorySearch,
    historyDate,
    setHistoryDate,
    sessions,
    setSelectedSession,
    updateSalePaymentMethod,
    updateActiveSession,
    toggleSaleVerified,
    forceSyncSessions,
    loadData,
    sales, // Added sales to props
    fixCatalogNames,
    syncFromCloud
}) => {
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [saveToEnvelope, setSaveToEnvelope] = useState(false);
    const [envelopeName, setEnvelopeName] = useState('');
    const [editingSale, setEditingSale] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const { envelopes, addToEnvelope } = useStore();

    // Get draft values from session or defaults
    const notes = activeSession.notes || '';
    const cashBreakdown = activeSession.cashBreakdown || {};

    // Total from breakdown is already calculated in BillCounter or similar, 
    // but here we define how to sync them back
    const declaredTotal = Object.entries(cashBreakdown).reduce((sum, [d, c]) => sum + (Number(d) * c), 0);

    const setNotes = (val) => updateActiveSession({ notes: val });

    const handleCashCountChange = (data) => {
        // data contains { total, breakdown }
        updateActiveSession({ cashBreakdown: data.breakdown });
    };

    // Calculate Totals
    const stats = currentSales.reduce((acc, sale) => {
        const saleNet = sale.totalAmount || 0;
        const saleGross = sale.items?.reduce((sum, item) => sum + (item.price > 0 ? (item.price * (item.quantity || 1)) : 0), 0) || saleNet;
        const saleDiscount = sale.items?.reduce((sum, item) => sum + (item.price < 0 ? Math.abs(item.price * (item.quantity || 1)) : 0), 0) || 0;

        acc.discounts += saleDiscount;

        if (sale.paymentMethod === 'efectivo') {
            acc.cash += saleNet;
        } else if (sale.paymentMethod === 'tarjeta') {
            acc.card += saleNet;
        } else if (sale.paymentMethod === 'transferencia') {
            acc.transfer += saleNet;
        } else if (sale.paymentMethod === 'mixto') {
            const cashPart = sale.cashReceived || 0;
            const cardPart = sale.cardReceived || 0;
            const transferPart = sale.transferReceived || 0;
            const totalPaid = cashPart + cardPart + transferPart;

            if (totalPaid > 0) {
                // Proportional distribution of net amount based on sub-payments
                acc.cash += (cashPart / totalPaid) * saleNet;
                acc.card += (cardPart / totalPaid) * saleNet;
                acc.transfer += (transferPart / totalPaid) * saleNet;
            } else {
                // Fallback: if no breakdown, assume all cash for the net amount
                acc.cash += saleNet;
            }
        }
        return acc;
    }, { cash: 0, card: 0, transfer: 0, discounts: 0 });

    const allWithdrawals = currentExpenses.filter(e => e.type !== 'income' && e.savedToEnvelope);
    const withdrawalsAmount = allWithdrawals.reduce((sum, ex) => sum + Number(ex.amount), 0);

    const allExpensesOnly = currentExpenses.filter(e => e.type !== 'income' && !e.savedToEnvelope);
    const expensesAmount = allExpensesOnly.reduce((sum, ex) => sum + Number(ex.amount), 0);

    // Virtual expenses from POS discounts (for detailing)
    const discountItems = currentSales.flatMap(sale =>
        (sale.items || [])
            .filter(item => item.price < 0 || item.isExpense)
            .map(item => ({
                id: `sale-${sale.id}-${item.name}`,
                description: `${item.name}${item.obs ? `: ${item.obs}` : ''} (Venta #${sale.orderNumber})`,
                amount: Math.abs(item.price * (item.quantity || 1)),
                type: 'expense',
                timestamp: sale.timestamp,
                isPOSDiscount: true // Flag to identify it's from a sale
            }))
    );

    const totalIncomes = currentExpenses.filter(e => e.type === 'income').reduce((sum, ex) => sum + Number(ex.amount), 0);

    // For legacy compatibility if needed
    const totalExpenses = withdrawalsAmount + expensesAmount;

    // Expected Cash in Drawer
    // Physical Cash Expected = Initial + Net Cash Sales - Expenses + Incomes
    const netCashReceived = currentSales.reduce((sum, sale) => {
        if (sale.paymentMethod === 'efectivo') return sum + (sale.totalAmount || 0);
        if (sale.paymentMethod === 'mixto') {
            const cashPart = sale.cashReceived || 0;
            const cardPart = sale.cardReceived || 0;
            const transferPart = sale.transferReceived || 0;
            if (cashPart + cardPart + transferPart === 0) return sum + (sale.totalAmount || 0);
            return sum + cashPart;
        }
        return sum;
    }, 0);
    const expectedCash = (activeSession.initialCash || 0) + netCashReceived - totalExpenses + totalIncomes;

    // Difference (Declared vs Expected Physical Cash)
    const difference = declaredTotal - expectedCash;

    const handleClose = () => {
        if (activeSession.salesCount > 0 && declaredTotal === 0) {
            if (!window.confirm('¿Cerrar con CAJA EN CERO a pesar de tener ventas?')) return;
        }
        // Detailed message with breakdown
        const confirmMsg = `
                    Resumen del Cierre:
                    -------------------
                    Ventas Efectivo: $${stats.cash.toLocaleString('es-AR')}
                    Ventas Tarjeta: $${stats.card.toLocaleString('es-AR')}
                    Ventas Transfer.: $${stats.transfer.toLocaleString('es-AR')}
                    Gastos: $${totalExpenses.toLocaleString('es-AR')}
                    Ingresos Extras: $${totalIncomes.toLocaleString('es-AR')}
                    -------------------
                    Esperado en Caja: $${expectedCash.toLocaleString('es-AR')}
                    Declarado: $${declaredTotal.toLocaleString('es-AR')}
                    DIFERENCIA: $${difference.toLocaleString('es-AR')}
                    -------------------
                    ¿Confirmar cierre del turno?`;

        if (!window.confirm(confirmMsg)) return;

        const finalNotes = (activeSession.auditLogs && activeSession.auditLogs.length > 0)
            ? `${notes}\n\n=== AUDITORÍA ===\n${activeSession.auditLogs.join('\n')}`
            : notes;

        const closureData = {
            declaredTotal,
            notes: finalNotes,
            salesCount: currentSales.length,
            difference,
            expectedCash,
            stats: {
                cashSales: stats.cash,
                cardSales: stats.card,
                transferSales: stats.transfer,
                totalExpenses,
                totalIncomes,
                totalDiscounts: stats.discounts,
                cashBreakdown,
                difference,
                expectedCash
            }
        };

        closeSession(closureData);
        alert('Turno cerrado correctamente.');

        if (window.confirm('¿Desea imprimir el resumen de cierre?')) {
            printSessionClosure({ ...activeSession, ...closureData, endedAt: new Date().toISOString() });
        }
    };

    // --- INCOME / EXPENSE HANDLERS ---
    const handleAddExpense = (e) => {
        if (e) e.preventDefault();
        if (!expenseAmount || !expenseDesc) return;

        const amount = parseCurrency(expenseAmount);
        const newExpense = {
            description: expenseDesc,
            amount: amount,
            savedToEnvelope: saveToEnvelope,
            envelopeName: saveToEnvelope ? envelopeName : null,
            type: 'expense'
        };
        addExpense(newExpense);

        if (window.confirm('¿Desea imprimir el comprobante de retiro?')) {
            printWithdrawalTicket({ ...newExpense, timestamp: new Date().toISOString() }, activeSession.cashier);
        }

        if (saveToEnvelope && envelopeName) {
            addToEnvelope(envelopeName, newExpense.amount, activeSession.cashier);
        }

        setExpenseDesc('');
        setExpenseAmount('');
        setSaveToEnvelope(false);
        setEnvelopeName('');
    };

    const handleAddIncome = () => {
        const desc = prompt("Concepto del Ingreso (Ej: Cambio, Propina, Venta Extra):");
        if (!desc) return;
        const amountStr = prompt("Monto a ingresar a CAJA:");
        if (!amountStr) return;
        const amount = parseCurrency(amountStr);

        if (amount > 0) {
            addExpense({
                amount: amount,
                description: desc,
                type: 'income'
            });
            alert(`✅ Ingresados $${amount.toLocaleString('es-AR')} a la caja.`);
        }
    };

    const handlePaymentMethodUpdate = (saleId, newPaymentMethod, reason, overrides) => {
        const result = updateSalePaymentMethod(saleId, newPaymentMethod, reason, null, overrides);
        if (result.success) {
            alert('✅ Forma de pago actualizada correctamente');
            setEditingSale(null);
        } else {
            alert('❌ Error: ' + result.error);
        }
    };

    const handleForceSync = async () => {
        if (!window.confirm('¿Intentar subir manualmente los turnos faltantes a la nube?')) return;

        setIsSyncing(true);
        const result = await forceSyncSessions();
        setIsSyncing(false);

        if (result.success) {
            alert(`✅ Sincronización completa. Se subieron ${result.count} turnos.`);
        } else {
            alert('❌ Error al sincronizar: ' + result.error);
        }
    };
    // Polling: Auto-refresh data from cloud every 60 seconds while viewing Cash Control
    useEffect(() => {
        const interval = setInterval(() => {
            console.log("⏱️ Auto-refreshing cash control data...");
            loadData();
        }, 60000);
        return () => clearInterval(interval);
    }, [loadData]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                            <DollarSign className="text-brand-500" />
                            Control de Caja
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{activeSession.cashier}</span>
                            <span>•</span>
                            <span>Iniciado: {new Date(activeSession.startedAt).toLocaleTimeString('es-AR', { hour12: false })}</span>
                        </div>
                        {/* DEBUG INFO */}
                        <div className="text-xs text-slate-400 mt-1 font-mono">
                            Memoria: {sales.length} | Visibles: {currentSales.length} | ID Turno: {activeSession.id.slice(-4)}
                        </div>
                    </div>
                    <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Turno Activo
                    </span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {/* LEFT COLUMN: FINANCIAL SUMMARY LIST */}
                    <div className="w-full md:w-1/3 space-y-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Resumen Financiero</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">Fondo Inicial</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">${(activeSession.initialCash || 0).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-700 dark:text-green-400">
                                    <span className="font-bold flex items-center gap-1"><Plus size={12} /> Ventas Efectivo</span>
                                    <span className="font-bold">${stats.cash.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-blue-700 dark:text-blue-400">
                                    <span className="font-medium flex items-center gap-1"><CreditCard size={12} /> Ventas Tarjeta</span>
                                    <span className="font-bold">${stats.card.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-purple-700 dark:text-purple-400">
                                    <span className="font-medium flex items-center gap-1"><ArrowRight size={12} /> Transferencias</span>
                                    <span className="font-bold">${stats.transfer.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                                    <span className="font-medium flex items-center gap-1"><Minus size={12} /> Descuentos</span>
                                    <span className="font-bold">-${stats.discounts.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                                    <span className="font-medium flex items-center gap-1"><Minus size={12} /> Gastos / Pagos</span>
                                    <span className="font-bold">-${expensesAmount.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-red-600 dark:text-red-400 border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                                    <span className="font-medium flex items-center gap-1"><ArrowRight size={12} className="rotate-45" /> Retiros / Buzón</span>
                                    <span className="font-bold">-${withdrawalsAmount.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                    <span className="font-medium flex items-center gap-1"><Plus size={12} /> Ingresos Extra</span>
                                    <span className="font-bold">+${totalIncomes.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-800 p-2 rounded-lg mt-2 shadow-inner">
                                    <span className="font-bold text-xs uppercase opacity-70">Efectivo en Caja</span>
                                    <span className="font-bold text-lg">${expectedCash.toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* CASH WITHDRAWAL / DROP INPUT */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2 text-xs uppercase">
                                <Lock size={14} className="text-red-500" /> Retiro a Buzón/Sobre
                            </h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 leading-tight">
                                Registra el dinero que retiras de la caja para seguridad (sobre/buzón).
                            </p>
                            <form onSubmit={handleAddExpense} className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        className="w-2/3 px-3 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                                        placeholder="Detalle (ej: Sobre #1, Retiro)"
                                        value={expenseDesc}
                                        onChange={e => setExpenseDesc(e.target.value)}
                                    />
                                    <input
                                        className="w-1/3 px-3 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                                        placeholder="$ Monto"
                                        type="text"
                                        value={expenseAmount}
                                        onChange={e => setExpenseAmount(formatCurrency(e.target.value))}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Minus size={18} /> REGISTRAR RETIRO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddIncome}
                                        className="px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center"
                                        title="Agregar ingreso de dinero extra"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>

                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 dark:bg-slate-800 focus:ring-brand-500"
                                            checked={saveToEnvelope}
                                            onChange={e => setSaveToEnvelope(e.target.checked)}
                                        />
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors uppercase">Guardar en Sobre / Buzón</span>
                                    </label>

                                    {saveToEnvelope && (
                                        <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                                            <input
                                                list="existing-envelopes"
                                                className="w-full px-3 py-2 text-xs rounded-lg border-2 border-brand-200 dark:border-brand-900/50 outline-none focus:border-brand-500 bg-brand-50/30 dark:bg-brand-900/10 text-slate-900 dark:text-white"
                                                placeholder="Nombre del sobre (ej: Buzón 1, Lunes...)"
                                                value={envelopeName}
                                                onChange={e => setEnvelopeName(e.target.value)}
                                            />
                                            <datalist id="existing-envelopes">
                                                {envelopes.filter(e => e.status !== 'deposited').map(e => (
                                                    <option key={e.id} value={e.name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    )}
                                </div>
                            </form>
                            {currentExpenses.length > 0 && (
                                <div className="max-h-32 overflow-y-auto space-y-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Historial Retiros</h5>
                                    {([...currentExpenses, ...discountItems].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))).reverse().map(ex => (
                                        <div key={ex.id} className={`text-sm flex flex-col gap-1 p-2 rounded group border ${ex.isPOSDiscount ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border-transparent dark:border-slate-800/50'}`}>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    {ex.type !== 'income' && !ex.isPOSDiscount && (
                                                        <button
                                                            onClick={() => printWithdrawalTicket(ex, activeSession.cashier)}
                                                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Re-imprimir sobre"
                                                        >
                                                            <Printer size={14} />
                                                        </button>
                                                    )}
                                                    <span>{ex.isPOSDiscount && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded mr-1">TICKET</span>}{ex.description}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold ${ex.type === 'income' ? 'text-green-600 dark:text-green-400' : (ex.savedToEnvelope ? 'text-red-600 dark:text-red-400' : (ex.isPOSDiscount ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'))}`}>
                                                        {ex.type === 'income' ? '+' : '-'}${Number(ex.amount).toLocaleString('es-AR')}
                                                    </span>
                                                    {!ex.isPOSDiscount && (
                                                        <button
                                                            onClick={() => deleteExpense(ex.id)}
                                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                            title="Eliminar movimiento"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {ex.savedToEnvelope && (
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 dark:text-green-400 px-1">
                                                    <div className="w-1 h-1 rounded-full bg-green-500" />
                                                    GUARDADO EN SOBRE: {ex.envelopeName}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COL: BILL COUNTER & CLOSE */}
                    <div className="flex-1 space-y-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase border-b border-slate-200 dark:border-slate-800 pb-2">Arqueo de Caja (Cierre)</h3>

                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Left Section: Bill Counter */}
                            <div className="flex-[2]">
                                <BillCounter denominations={cashBreakdown} onTotalChange={handleCashCountChange} />
                                <div className="text-right font-black text-2xl text-slate-900 dark:text-white">
                                    Total Arqueo: ${declaredTotal.toLocaleString('es-AR')}
                                </div>
                            </div>

                            {/* Right Section: Difference Box */}
                            <div className="flex-1">
                                <div className={`h-full flex flex-col justify-center items-center p-4 rounded-2xl border-2 shadow-sm transition-colors ${difference === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400' : difference < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'}`}>
                                    <span className="text-[10px] uppercase font-black opacity-60 tracking-wider text-center">Diferencia</span>
                                    <span className="font-black text-4xl my-2">{difference > 0 ? '+' : ''}{difference.toLocaleString('es-AR')}</span>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border border-current bg-white dark:bg-slate-900 shadow-sm`}>
                                        {difference === 0 ? 'EXACTO' : difference < 0 ? 'FALTA DINERO' : 'SOBRA DINERO'}
                                    </span>


                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Notes & Confirm */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1.5 tracking-wide">Notas del Cierre</label>
                                {activeSession.auditLogs && activeSession.auditLogs.length > 0 && (
                                    <div className="mb-2 max-h-24 overflow-y-auto bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-200 dark:border-red-900/30 select-none">
                                        <div className="text-[10px] font-bold text-red-800 dark:text-red-400 mb-1 uppercase">Registro de Auditoría (No Borrable)</div>
                                        {activeSession.auditLogs.map((log, i) => (
                                            <div key={i} className="text-[11px] font-mono text-slate-700 dark:text-slate-300">{log}</div>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none h-24 text-sm font-medium shadow-inner"
                                    placeholder="Escribe aquí observaciones relevantes..."
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleClose}
                                    className="w-full h-16 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-lg hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] border-b-4 border-slate-700 dark:border-slate-950"
                                >
                                    <Lock size={24} /> CERRAR TURNO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SALES HISTORY SECTION */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Sincronización en línea
                        </div>


                        <button
                            onClick={async () => {
                                if (confirm("¿Forzar recarga completa?")) {
                                    await syncFromCloud();
                                    await forceSyncSessions();
                                    window.location.reload();
                                }
                            }}
                            className="text-xs text-slate-400 hover:text-brand-500 underline ml-auto"
                        >
                            ¿Problemas? Recargar
                        </button>

                        <div className="text-[10px] text-slate-300 font-mono ml-auto">
                            v5.8.2-fix
                        </div>
                    </div>




                    <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                        <History size={20} className="text-brand-500" /> Detalle de Ventas del Turno
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase">
                                <tr>
                                    <th className="px-3 py-2">Hora</th>
                                    <th className="px-3 py-2">Items</th>
                                    <th className="px-3 py-2">Total</th>
                                    <th className="px-3 py-2">Método</th>
                                    <th className="px-3 py-2 text-center">Revisado</th>
                                    <th className="px-3 py-2 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {currentSales.length === 0 ? (
                                    <tr><td colSpan="6" className="p-4 text-center text-slate-400 dark:text-slate-500 italic">Sin ventas en este turno.</td></tr>
                                ) : (
                                    currentSales.map((sale) => ( // Eliminado .reverse() ya que el store viene DESC
                                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{new Date(sale.timestamp).toLocaleTimeString('es-AR', { hour12: false })}</td>
                                            <td className="px-3 py-2 max-w-[200px] truncate text-slate-600 dark:text-slate-300" title={sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                                {sale.items.length} items ({sale.items[0]?.name}...)
                                            </td>
                                            <td className="px-3 py-2 font-bold text-slate-800 dark:text-white">${(sale.totalAmount || 0).toLocaleString('es-AR')}</td>
                                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                                <span className="capitalize">{sale.paymentMethod}</span>
                                                {sale.paymentMethod === 'mixto' && (
                                                    <span className="text-[9px] block opacity-80 leading-tight">
                                                        (${Number(sale.cashReceived || 0).toLocaleString()} Ef
                                                        {Number(sale.cardReceived || 0) > 0 ? `, ${Number(sale.cardReceived || 0).toLocaleString()} Tar` : ''}
                                                        {Number(sale.transferReceived || 0) > 0 ? `, ${Number(sale.transferReceived || 0).toLocaleString()} Tra` : ''})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {(sale.paymentMethod === 'transferencia' || (sale.paymentMethod === 'mixto' && sale.transferReceived > 0)) && (
                                                    <button
                                                        onClick={() => toggleSaleVerified(sale.id)}
                                                        className={`p-1 rounded-full transition-colors ${sale.verified ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                                                        title={sale.verified ? 'Transferencia corroborada' : 'Marcar como corroborada'}
                                                    >
                                                        {sale.verified ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => setEditingSale(sale)}
                                                        className="text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 p-1 rounded transition-colors"
                                                        title="Editar Forma de Pago"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => printTicket(sale)}
                                                        className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-1 rounded transition-colors"
                                                        title="Reimprimir Ticket"
                                                    >
                                                        <Printer size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSale(sale.id)}
                                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                                                        title="Anular/Borrar Venta"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <History size={20} className="text-slate-400 dark:text-slate-500" />
                        Historial de Turnos
                        {(!historySearch && !historyDate) && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium ml-2">Últimos 5</span>}
                    </h3>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button
                            onClick={handleForceSync}
                            disabled={isSyncing}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95'}`}
                        >
                            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                            {isSyncing ? 'SINCRONIZANDO...' : 'FORZAR SUBIDA DE DATOS'}
                        </button>
                        <div className="relative flex-1 md:w-48">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar cajero..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                                value={historySearch}
                                onChange={e => setHistorySearch(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input
                                type="date"
                                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                                value={historyDate}
                                onChange={e => setHistoryDate(e.target.value)}
                            />
                        </div>
                        {(historySearch || historyDate) && (
                            <button
                                onClick={() => { setHistorySearch(''); setHistoryDate(''); }}
                                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Limpiar filtros"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Iniciado</th>
                                <th className="px-4 py-3">Finalizado</th>
                                <th className="px-4 py-3">Cajero</th>
                                <th className="px-4 py-3">Declarado</th>
                                <th className="px-4 py-3">Diferencia</th>
                                <th className="px-4 py-3 text-right">Ventas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {(() => {
                                let list = [...sessions]; // El store ya está ordenado DESC

                                // Apply Filters
                                if (historySearch) {
                                    const query = historySearch.toLowerCase();
                                    list = list.filter(s => s.cashier?.toLowerCase().includes(query));
                                }
                                if (historyDate) {
                                    list = list.filter(s => s.startedAt?.startsWith(historyDate));
                                }

                                const isFiltering = historySearch || historyDate;
                                const displayList = isFiltering ? list : list.slice(0, 5);

                                if (displayList.length === 0) {
                                    return <tr><td colSpan="6" className="py-10 text-center text-slate-400 dark:text-slate-500 italic">No se encontraron turnos que coincidan.</td></tr>
                                }

                                return displayList.map(s => (
                                    <tr
                                        key={s.id}
                                        className={`${s.endedAt ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer' : 'bg-green-50 dark:bg-green-900/10'} transition-colors`}
                                        onClick={() => s.endedAt && setSelectedSession(s)}
                                    >
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(s.startedAt).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.endedAt ? new Date(s.endedAt).toLocaleString() : <span className="text-green-600 dark:text-green-400 font-bold">Activo</span>}</td>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{s.cashier}</td>
                                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">${s.declaredTotal?.toLocaleString('es-AR') || '-'}</td>
                                        <td className={`px-4 py-3 font-bold ${(s.difference || s.stats?.difference) < 0 ? 'text-red-500 dark:text-red-400' : (s.difference || s.stats?.difference) > 0 ? 'text-green-500 dark:text-green-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                            {(s.difference !== undefined && s.difference !== null) ? `$${s.difference.toLocaleString('es-AR')}` : (s.stats?.difference !== undefined ? `$${s.stats.difference.toLocaleString('es-AR')}` : '-')}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                            {s.endedAt ? (s.salesCount || 0) : (currentSales?.length || 0)}
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Payment Method Modal */}
            {
                editingSale && (
                    <EditPaymentMethodModal
                        sale={editingSale}
                        onClose={() => setEditingSale(null)}
                        onSave={handlePaymentMethodUpdate}
                    />
                )
            }
        </div >
    );
};

export default function CashControl() {
    const {
        activeSession, openSession, closeSession, sessions, sales,
        getCurrentSessionSales, getCurrentSessionExpenses, addExpense, deleteExpense, deleteSale,
        expenses: allExpenses, updateSalePaymentMethod, updateActiveSession, toggleSaleVerified,
        forceSyncSessions, loadData, fixCatalogNames, syncFromCloud
    } = useStore();

    const [currentSales, setCurrentSales] = useState([]);
    const [currentExpenses, setCurrentExpenses] = useState([]);
    const [historySearch, setHistorySearch] = useState('');
    const [historyDate, setHistoryDate] = useState('');

    // Derived state for dashboard
    useEffect(() => {
        if (activeSession) {
            const sales = getCurrentSessionSales();
            const sessionExpenses = getCurrentSessionExpenses();
            setCurrentSales(sales);
            setCurrentExpenses(sessionExpenses);
        } else {
            setCurrentSales([]);
            setCurrentExpenses([]);
        }
    }, [activeSession, allExpenses, sessions, sales]); // Re-run when global state changes




    // --- MAIN RENDER ---
    const [selectedSession, setSelectedSession] = useState(null);

    return (
        <>
            {activeSession ? (
                <ActiveTurnView
                    activeSession={activeSession}
                    closeSession={closeSession}
                    addExpense={addExpense}
                    deleteExpense={deleteExpense}
                    deleteSale={deleteSale}
                    currentSales={currentSales}
                    currentExpenses={currentExpenses}

                    historySearch={historySearch}
                    setHistorySearch={setHistorySearch}
                    historyDate={historyDate}
                    setHistoryDate={setHistoryDate}
                    sessions={sessions}
                    setSelectedSession={setSelectedSession}
                    updateSalePaymentMethod={updateSalePaymentMethod}
                    updateActiveSession={updateActiveSession}
                    toggleSaleVerified={toggleSaleVerified}
                    forceSyncSessions={forceSyncSessions}
                    loadData={loadData}
                    sales={sales}
                    fixCatalogNames={fixCatalogNames}
                    syncFromCloud={syncFromCloud}
                />
            ) : (
                <OpenTurnView
                    sessions={sessions}
                    openSession={openSession}
                    forceSyncSessions={forceSyncSessions}
                    setSelectedSession={setSelectedSession}
                    loadData={loadData}
                />
            )}

            {/* Session Detail Modal */}
            {selectedSession && (
                <SessionDetailModal
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                />
            )}
        </>
    );
}
