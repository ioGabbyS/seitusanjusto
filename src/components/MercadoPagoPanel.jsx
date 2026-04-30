import React, { useState, useEffect, useCallback } from 'react';
import {
    CreditCard, RefreshCw, TrendingUp, DollarSign, CheckCircle2,
    AlertCircle, Clock, XCircle, QrCode, X, ExternalLink,
    ArrowUpRight, Filter, Calendar, Smartphone, Banknote,
    ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import { tenant } from '../config/tenant';

// ============================================================
// PANEL DE TRANSACCIONES DE MERCADO PAGO
// ============================================================

export default function MercadoPagoPanel() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;

    // Filtros
    const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all

    const fetchPayments = useCallback(async (reset = false) => {
        setLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        if (reset) setOffset(0);

        try {
            const params = new URLSearchParams({ limit: LIMIT, offset: currentOffset });

            // Aplicar filtro de fecha
            const now = new Date();
            if (dateFilter === 'today') {
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                params.append('begin_date', start.toISOString());
                params.append('end_date', now.toISOString());
            } else if (dateFilter === 'week') {
                const start = new Date(now);
                start.setDate(start.getDate() - 7);
                params.append('begin_date', start.toISOString());
                params.append('end_date', now.toISOString());
            } else if (dateFilter === 'month') {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                params.append('begin_date', start.toISOString());
                params.append('end_date', now.toISOString());
            }

            const response = await fetch(`/api/mp-transactions?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Error al obtener pagos');

            if (reset) {
                setPayments(data.payments);
            } else {
                setPayments(prev => [...prev, ...data.payments]);
            }
            setTotal(data.total);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [offset, dateFilter]);

    useEffect(() => {
        fetchPayments(true);
    }, [dateFilter]);

    // Estadísticas del panel
    const approvedPayments = payments.filter(p => p.status === 'approved');
    const totalApproved = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = approvedPayments.reduce((sum, p) => sum + (p.fee_amount || 0), 0);
    const netAmount = totalApproved - totalFees;

    return (
        <div className="h-full flex flex-col gap-4">

            {/* Resumen de Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                <StatCard
                    label="Cobrado"
                    value={`$${totalApproved.toLocaleString('es-AR')}`}
                    icon={<DollarSign size={20} />}
                    color="green"
                />
                <StatCard
                    label="Neto (sin comisión)"
                    value={`$${netAmount.toLocaleString('es-AR')}`}
                    icon={<TrendingUp size={20} />}
                    color="blue"
                />
                <StatCard
                    label="Transacciones"
                    value={approvedPayments.length}
                    icon={<CheckCircle2 size={20} />}
                    color="purple"
                />
                <StatCard
                    label="Total encontradas"
                    value={total}
                    icon={<Filter size={20} />}
                    color="orange"
                />
            </div>

            {/* Filtros y Acciones */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-wrap gap-2 items-center justify-between shrink-0">
                <div className="flex gap-1">
                    {[
                        { id: 'today', label: 'Hoy' },
                        { id: 'week', label: '7 días' },
                        { id: 'month', label: 'Este mes' },
                        { id: 'all', label: 'Todo' },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setDateFilter(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateFilter === f.id
                                ? 'bg-[#009ee3] text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => fetchPayments(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#009ee3] text-white rounded-xl font-bold text-sm hover:bg-[#007cb8] transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Lista de Transacciones */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#009ee3' }}>
                        <CreditCard size={16} className="text-white" />
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-white">Transacciones MercadoPago</h3>
                    <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-600">
                        {total} total
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading && payments.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                            <RefreshCw size={32} className="animate-spin text-[#009ee3]" />
                            <p className="text-sm font-medium">Cargando transacciones...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                            <CreditCard size={40} className="opacity-20" />
                            <p className="text-sm font-medium italic">No hay transacciones en este período</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3">Fecha y hora</th>
                                    <th className="px-4 py-3">Descripción / Pagador</th>
                                    <th className="px-4 py-3 text-center">Método</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {payments.map(payment => (
                                    <PaymentRow key={payment.id} payment={payment} />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Paginación */}
                {payments.length < total && (
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
                        <button
                            onClick={() => {
                                setOffset(prev => prev + LIMIT);
                                fetchPayments(false);
                            }}
                            disabled={loading}
                            className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-[#009ee3] hover:text-[#009ee3] transition-all disabled:opacity-50"
                        >
                            Ver más ({total - payments.length} restantes)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Fila de pago ---
function PaymentRow({ payment }) {
    const statusConfig = {
        approved: { label: 'Aprobado', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: <CheckCircle2 size={10} /> },
        pending: { label: 'Pendiente', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', icon: <Clock size={10} /> },
        in_process: { label: 'En proceso', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: <Clock size={10} /> },
        rejected: { label: 'Rechazado', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', icon: <XCircle size={10} /> },
        cancelled: { label: 'Cancelado', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400', icon: <XCircle size={10} /> },
        refunded: { label: 'Devuelto', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', icon: <AlertCircle size={10} /> },
    };

    const methodIcons = {
        account_money: '📱',
        debit_card: '💳',
        credit_card: '💳',
        bank_transfer: '🏦',
        ticket: '🎫',
        pix: '⚡',
    };

    const status = statusConfig[payment.status] || statusConfig['pending'];
    const dateObj = new Date(payment.date_created);

    return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-sm">
            <td className="px-4 py-3">
                <div className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                    {dateObj.toLocaleDateString('es-AR')}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="font-medium text-slate-700 dark:text-slate-200 text-xs truncate max-w-[180px]">
                    {payment.description || 'Venta'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                    {payment.payer_name}
                    {payment.payer_email ? ` · ${payment.payer_email}` : ''}
                </div>
            </td>
            <td className="px-4 py-3 text-center">
                <span className="text-lg" title={payment.payment_type}>
                    {methodIcons[payment.payment_type] || '💰'}
                </span>
                {payment.last_four_digits && (
                    <div className="text-[10px] text-slate-400 font-bold">**{payment.last_four_digits}</div>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${status.color}`}>
                        {status.icon} {status.label}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 text-right">
                <div className={`font-black text-sm ${payment.status === 'approved' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    ${Number(payment.amount).toLocaleString('es-AR')}
                </div>
                {payment.installments > 1 && (
                    <div className="text-[10px] text-slate-400 font-bold">
                        {payment.installments} cuotas
                    </div>
                )}
            </td>
        </tr>
    );
}

// --- Stat Card ---
function StatCard({ label, value, icon, color }) {
    const colors = {
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30',
    };

    return (
        <div className={`rounded-2xl border p-4 flex items-center justify-between ${colors[color]}`}>
            <div>
                <div className="text-[10px] font-black uppercase opacity-70 mb-1">{label}</div>
                <div className="text-xl font-black">{value}</div>
            </div>
            <div className="opacity-60">{icon}</div>
        </div>
    );
}

// ============================================================
// MODAL QR PARA COBRAR CON MERCADO PAGO (usado desde el POS)
// ============================================================

export function MPQRModal({ amount, items, cashier, onClose, onPaymentDetected }) {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checking, setChecking] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'
    const [pollCount, setPollCount] = useState(0);

    const externalRef = `seitu-pos-${Date.now()}`;

    useEffect(() => {
        createQR();
    }, []);

    // Polling para detectar el pago
    useEffect(() => {
        if (!qrData || paymentStatus === 'approved' || paymentStatus === 'rejected') return;

        const interval = setInterval(async () => {
            checkPaymentStatus();
            setPollCount(prev => prev + 1);
        }, 5000); // Cada 5 segundos

        return () => clearInterval(interval);
    }, [qrData, paymentStatus]);

    const createQR = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/mp-create-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    description: `Venta ${tenant.systemName}`,
                    items: items || [],
                    external_reference: externalRef,
                    cashier: cashier || 'Sistema'
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al crear QR');
            setQrData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkPaymentStatus = async () => {
        if (checking) return;
        setChecking(true);
        try {
            const params = new URLSearchParams({
                limit: 5,
                begin_date: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Últimos 10 min
                end_date: new Date().toISOString()
            });
            const response = await fetch(`/api/mp-transactions?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) return;

            // Buscar un pago aprobado por el monto exacto o referencia
            const matchingPayment = data.payments?.find(p =>
                p.status === 'approved' &&
                (p.external_reference === externalRef || Math.abs(p.amount - amount) < 1)
            );

            if (matchingPayment) {
                setPaymentStatus('approved');
                if (onPaymentDetected) onPaymentDetected(matchingPayment);
            }
        } catch (err) {
            console.error('Error chequeando pago:', err);
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

                {/* Header */}
                <div className="p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #009ee3, #0070c0)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <QrCode size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg">Cobrar con MP</h3>
                            <p className="text-blue-100 text-xs font-medium">Escanear para pagar</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
                        <X size={22} />
                    </button>
                </div>

                {/* Monto */}
                <div className="text-center py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Total a cobrar</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">
                        ${Number(amount).toLocaleString('es-AR')}
                    </div>
                </div>

                {/* QR Content */}
                <div className="p-6 flex flex-col items-center gap-4">
                    {loading ? (
                        <div className="w-64 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                            <RefreshCw size={32} className="animate-spin text-[#009ee3]" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">Generando QR...</p>
                        </div>
                    ) : error ? (
                        <div className="w-64 h-64 bg-red-50 dark:bg-red-900/20 rounded-2xl flex flex-col items-center justify-center gap-3 border border-red-200 dark:border-red-900/30">
                            <AlertCircle size={32} className="text-red-500" />
                            <p className="text-sm text-red-600 dark:text-red-400 text-center px-4">{error}</p>
                            <button
                                onClick={createQR}
                                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : paymentStatus === 'approved' ? (
                        <div className="w-64 h-64 bg-green-50 dark:bg-green-900/20 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-green-300 dark:border-green-700">
                            <CheckCircle2 size={56} className="text-green-500" />
                            <div className="text-center">
                                <p className="font-black text-green-700 dark:text-green-400 text-lg">¡PAGO RECIBIDO!</p>
                                <p className="text-green-600 dark:text-green-500 text-sm">El pago fue acreditado</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <img
                                    src={qrData?.qr_image_url}
                                    alt="QR MercadoPago"
                                    className="w-64 h-64 rounded-2xl border-4 border-slate-100 dark:border-slate-700 shadow-lg"
                                />
                                {checking && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow">
                                        <RefreshCw size={12} className="animate-spin text-[#009ee3]" />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                                Mostrá este código al cliente para que pague con su app de MercadoPago
                            </p>
                        </>
                    )}

                    {/* Link alternativo */}
                    {qrData?.init_point && paymentStatus !== 'approved' && (
                        <a
                            href={qrData.init_point}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-[#009ee3] hover:underline font-bold"
                        >
                            <ExternalLink size={12} />
                            Abrir link de pago
                        </a>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex gap-2">
                    {paymentStatus === 'approved' ? (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-green-500 text-white font-black rounded-xl hover:bg-green-600 transition-colors shadow-lg"
                        >
                            ✅ Continuar
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={checkPaymentStatus}
                                disabled={checking}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
                                Verificar pago
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-slate-600 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
