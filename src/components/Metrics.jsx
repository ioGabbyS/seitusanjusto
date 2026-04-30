import React, { useState, useMemo } from 'react';
import { BarChart3, Calendar, Clock, DollarSign, TrendingUp, ArrowRight, Banknote } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';

export default function Metrics() {
    const { sales, activeSession, sessions, expenses } = useStore();
    const [period, setPeriod] = useState('turn'); // turn, today, month, all, history
    const [metricType, setMetricType] = useState('sales'); // sales, expenses
    const [selectedSession, setSelectedSession] = useState(null);

    // Helper: Is Same Day
    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    // Helper: Is Same Month
    const isSameMonth = (d1, d2) => {
        return d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const filteredSales = useMemo(() => {
        const now = new Date();

        switch (period) {
            case 'turn':
                if (activeSession) {
                    const sessionStart = new Date(activeSession.startedAt).getTime();
                    return sales.filter(s => new Date(s.timestamp).getTime() > sessionStart);
                } else {
                    return [];
                }
            case 'today':
                return sales.filter(s => isSameDay(new Date(s.timestamp), now));
            case 'month':
                return sales.filter(s => isSameMonth(new Date(s.timestamp), now));
            case 'all':
                return sales;
            case 'history':
                if (selectedSession) {
                    const start = new Date(selectedSession.startedAt).getTime();
                    const end = selectedSession.endedAt ? new Date(selectedSession.endedAt).getTime() : Date.now();
                    return sales.filter(s => {
                        const t = new Date(s.timestamp).getTime();
                        return t >= start && t <= end;
                    });
                }
                return [];
            default:
                return sales;
        }
    }, [sales, period, activeSession, selectedSession]);

    const filteredExpenses = useMemo(() => {
        const now = new Date();

        switch (period) {
            case 'turn':
                if (activeSession) {
                    const sessionStart = new Date(activeSession.startedAt).getTime();
                    return expenses.filter(e => new Date(e.timestamp).getTime() > sessionStart);
                } else {
                    return [];
                }
            case 'today':
                return expenses.filter(e => isSameDay(new Date(e.timestamp), now));
            case 'month':
                return expenses.filter(e => isSameMonth(new Date(e.timestamp), now));
            case 'all':
                return expenses;
            case 'history':
                if (selectedSession) {
                    const start = new Date(selectedSession.startedAt).getTime();
                    const end = selectedSession.endedAt ? new Date(selectedSession.endedAt).getTime() : Date.now();
                    return expenses.filter(e => {
                        const t = new Date(e.timestamp).getTime();
                        return t >= start && t <= end;
                    });
                }
                return [];
            default:
                return expenses;
        }
    }, [expenses, period, activeSession, selectedSession]);

    const metrics = useMemo(() => {
        let totalRevenue = 0;
        let totalItems = 0;
        const productStats = {};

        // Bundle / Promo Breakdown Definition
        const BUNDLE_COMPONENTS = {
            'promo desayuno': [
                { name: 'Café (Cualquiera)', qty: 1 },
                { name: 'Medialunas', qty: 2 }
            ],
            'promo merienda': [
                { name: 'Café (Cualquiera)', qty: 1 },
                { name: 'Tostados (J&Q)', qty: 1 }
            ],
        };

        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const subtotal = Number(item.price) * Number(item.quantity);
                totalRevenue += subtotal;
                totalItems += Number(item.quantity);

                const itemNameLower = item.name.toLowerCase();
                let components = [];

                if (BUNDLE_COMPONENTS[itemNameLower]) {
                    components = BUNDLE_COMPONENTS[itemNameLower];
                } else if (itemNameLower.includes('milkshake') && itemNameLower.includes('tostado')) {
                    components = [{ name: 'Milkshake', qty: 1 }, { name: 'Tostados (J&Q)', qty: 1 }];
                } else {
                    components = [{ name: item.name, qty: 1, isOriginal: true }];
                }

                components.forEach(comp => {
                    const compName = comp.name;
                    const compQty = Number(item.quantity) * comp.qty;

                    if (!productStats[compName]) {
                        productStats[compName] = {
                            name: compName,
                            quantity: 0,
                            revenue: 0,
                            category: comp.isOriginal ? item.category : 'Desglosado / Insumo'
                        };
                    }
                    productStats[compName].quantity += compQty;

                    if (comp.isOriginal) {
                        productStats[compName].revenue += subtotal;
                    }
                });
            });
        });

        const sortedProducts = Object.values(productStats).sort((a, b) => b.quantity - a.quantity);
        return { totalRevenue, totalItems, sortedProducts };
    }, [filteredSales]);

    const expenseMetrics = useMemo(() => {
        let totalExpenses = 0;
        const groupStats = {};

        filteredExpenses.forEach(exp => {
            totalExpenses += Number(exp.amount);
            const desc = exp.description || 'Sin descripción';
            if (!groupStats[desc]) {
                groupStats[desc] = {
                    name: desc,
                    count: 0,
                    total: 0
                };
            }
            groupStats[desc].count += 1;
            groupStats[desc].total += Number(exp.amount);
        });

        const sortedExpenses = Object.values(groupStats).sort((a, b) => b.total - a.total);
        return { totalExpenses, count: filteredExpenses.length, sortedExpenses };
    }, [filteredExpenses]);

    // Data for "Today" Breakdown
    const todayData = useMemo(() => {
        if (period !== 'today') return null;

        const now = new Date();
        // 1. Sessions from Today
        const todaysSessions = sessions.filter(s => isSameDay(new Date(s.startedAt), now));

        // 2. Expenses from Today
        // We filter expenses by today's date
        // Assuming 'expenses' is available from useStore, wait I need to import it.
        // I'll grab it from useStore() hook call above.

        return { sessions: todaysSessions };
    }, [period, sessions]);

    const todaysExpenses = useMemo(() => {
        if (period !== 'today') return [];
        const now = new Date();
        return expenses.filter(e => isSameDay(new Date(e.timestamp), now));
    }, [period, expenses]);

    // View: Session List
    if (period === 'history' && !selectedSession) {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setPeriod('turn')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowRight className="rotate-180" size={20} /></button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Historial de Turnos</h2>
                            <p className="text-xs text-slate-500">Selecciona un turno para ver su detalle</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.slice().sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).map(session => (
                        <button
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${session.endedAt ? 'bg-white border-slate-200 hover:border-brand-300' : 'bg-green-50 border-green-200'}`}
                        >
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-slate-700">{session.cashier}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${session.endedAt ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700 font-bold'}`}>
                                    {session.endedAt ? 'Cerrado' : 'Activo'}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 space-y-1">
                                <div className="flex items-center gap-2"><Clock size={12} /> Inicio: {new Date(session.startedAt).toLocaleString('es-AR', { hour12: false })}</div>
                                {session.endedAt && <div className="flex items-center gap-2"><Clock size={12} /> Fin: {new Date(session.endedAt).toLocaleString('es-AR', { hour12: false })}</div>}
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-slate-200">
                                    <DollarSign size={12} /> Declarado: <strong>${(session.declaredTotal || 0).toLocaleString('es-AR')}</strong>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Filter */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-100 rounded-xl text-brand-600">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {period === 'history' ? `Detalle: ${selectedSession?.cashier} (${new Date(selectedSession?.startedAt).toLocaleDateString()})` : (metricType === 'sales' ? 'Métricas de Venta' : 'Métricas de Gastos')}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {period === 'history' ? 'Análisis detallado del turno seleccionado' : 'Analiza el rendimiento de tu negocio'}
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setMetricType('sales')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${metricType === 'sales' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Ventas
                    </button>
                    <button
                        onClick={() => setMetricType('expenses')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${metricType === 'expenses' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Gastos
                    </button>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
                    <button
                        onClick={() => { setPeriod('turn'); setSelectedSession(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${period === 'turn' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Turno Actual
                    </button>
                    <button
                        onClick={() => { setPeriod('today'); setSelectedSession(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${period === 'today' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => { setPeriod('month'); setSelectedSession(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${period === 'month' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Este Mes
                    </button>
                    <button
                        onClick={() => { setPeriod('history'); setSelectedSession(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${period === 'history' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Historial Turnos
                    </button>
                </div>
            </div>

            {/* Back Button for History Mode */}
            {period === 'history' && selectedSession && (
                <button
                    onClick={() => setSelectedSession(null)}
                    className="flex items-center gap-2 text-sm text-brand-600 font-bold hover:underline"
                >
                    <ArrowRight className="rotate-180" size={16} /> Volver a la lista de turnos
                </button>
            )}

            {/* KPI Cards & Arqueo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metricType === 'sales' ? (
                    <>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                                <DollarSign size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Ingresos Venta</p>
                                <h3 className="text-3xl font-black text-slate-800">${metrics.totalRevenue.toLocaleString('es-AR')}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                                <Package size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Productos Vendidos</p>
                                <h3 className="text-3xl font-black text-slate-800">{metrics.totalItems} <span className="text-sm text-slate-400 font-normal">unidades</span></h3>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-red-50 text-red-600 rounded-full">
                                <DollarSign size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Gastos</p>
                                <h3 className="text-3xl font-black text-slate-800">${expenseMetrics.totalExpenses.toLocaleString('es-AR')}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-full">
                                <ClipboardList size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Cantidad de Gastos</p>
                                <h3 className="text-3xl font-black text-slate-800">{expenseMetrics.count} <span className="text-sm text-slate-400 font-normal">registros</span></h3>
                            </div>
                        </div>
                    </>
                )}

                {/* Arqueo Card (Only visible in History or Turn if data exists) */}
                {selectedSession?.cashBreakdown && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-slate-500 uppercase text-xs font-bold mb-2">
                            <Banknote size={16} /> Resumen de Billetes (Cierre)
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {Object.entries(selectedSession.cashBreakdown).map(([denom, qty]) => (
                                qty > 0 && (
                                    <div key={denom} className="flex justify-between border-b border-dashed border-slate-100 py-1">
                                        <span className="text-slate-500">${(Number(denom) || 0).toLocaleString()} x {qty}</span>
                                        <span className="font-bold text-slate-800">${(Number(denom) * qty || 0).toLocaleString()}</span>
                                    </div>
                                )
                            ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                            <span>Total Declarado:</span>
                            <span>${(selectedSession.declaredTotal || 0).toLocaleString('es-AR')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* TODAY'S BREAKDOWN: SESSIONS & EXPENSES */}
            {period === 'today' && todayData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sessions List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 text-sm uppercase">Turnos de Hoy</h3>
                        </div>
                        <div className="p-4">
                            {todayData.sessions.length > 0 ? (
                                <div className="space-y-3">
                                    {todayData.sessions.slice().reverse().map(s => (
                                        <div key={s.id} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-bold text-slate-800">{s.cashier}</div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(s.startedAt).toLocaleTimeString('es-AR', { hour12: false })} - {s.endedAt ? new Date(s.endedAt).toLocaleTimeString('es-AR', { hour12: false }) : 'En curso'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-brand-600">
                                                    {/* If closed, show sales from stats. If open, we can't easily calculate total live here without expensive filtering again, so we show 'Activo' or declared? */}
                                                    {s.stats ? `$${((s.stats.cashSales || 0) + (s.stats.cardSales || 0) + (s.stats.transferSales || 0)).toLocaleString('es-AR')}` : <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded-full">Activo</span>}
                                                </div>
                                                {s.stats && <div className="text-xs text-slate-400">Ventas Totales</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No hay turnos registrados hoy.</p>
                            )}
                        </div>
                    </div>

                    {/* Expenses List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 text-sm uppercase">Gastos / Retiros de Hoy</h3>
                            <span className="font-bold text-red-600 text-sm">Total: ${todaysExpenses.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString('es-AR')}</span>
                        </div>
                        <div className="p-4">
                            {todaysExpenses.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {todaysExpenses.slice().reverse().map(ex => (
                                        <div key={ex.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                            <div>
                                                <div className="text-sm font-medium text-slate-700">{ex.description}</div>
                                                <div className="text-xs text-slate-400">{new Date(ex.timestamp).toLocaleTimeString('es-AR', { hour12: false })}</div>
                                            </div>
                                            <div className="font-bold text-red-600">-${Number(ex.amount).toLocaleString('es-AR')}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No hay gastos registrados hoy.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {metricType === 'sales' ? (
                            <>
                                <TrendingUp size={20} className="text-brand-500" /> Ranking de Productos {period === 'history' ? `(Turno de ${selectedSession?.cashier})` : ''}
                            </>
                        ) : (
                            <>
                                <TrendingUp size={20} className="text-red-500" /> Ranking de Gastos {period === 'history' ? `(Turno de ${selectedSession?.cashier})` : ''}
                            </>
                        )}
                    </h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <div className="min-w-[500px]"> {/* Ensure min width for table in mobile */}
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs sticky top-0">
                                {metricType === 'sales' ? (
                                    <tr>
                                        <th className="px-6 py-4">Ranking</th>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4 text-center">Cant. Vendida</th>
                                        <th className="px-6 py-4 text-right">Ingresos Generados</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-6 py-4">Ranking</th>
                                        <th className="px-6 py-4">Descripción del Gasto</th>
                                        <th className="px-6 py-4 text-center">Cant. Veces</th>
                                        <th className="px-6 py-4 text-right">Monto Total</th>
                                        <th className="px-6 py-4 text-right">% del Total</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {metricType === 'sales' ? (
                                    metrics.sortedProducts.length > 0 ? (
                                        metrics.sortedProducts.map((prod, idx) => (
                                            <tr key={prod.name} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-400">#{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{prod.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{prod.category}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-brand-600 bg-brand-50/50 rounded-lg">
                                                    {prod.quantity}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-600">
                                                    ${prod.revenue.toLocaleString('es-AR')}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-slate-400">
                                                No hay ventas registradas en este período.
                                            </td>
                                        </tr>
                                    )
                                ) : (
                                    expenseMetrics.sortedExpenses.length > 0 ? (
                                        expenseMetrics.sortedExpenses.map((exp, idx) => (
                                            <tr key={exp.name} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-400">#{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{exp.name}</td>
                                                <td className="px-6 py-4 text-center font-bold text-red-600 bg-red-50/50 rounded-lg">
                                                    {exp.count}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-700">
                                                    ${exp.total.toLocaleString('es-AR')}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500">
                                                    {expenseMetrics.totalExpenses > 0 ? ((exp.total / expenseMetrics.totalExpenses) * 100).toFixed(1) : 0}%
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-slate-400">
                                                No hay gastos registrados en este período.
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for Package icon if needed, or import from lucide-react in the file
import { Package, ClipboardList } from 'lucide-react';
