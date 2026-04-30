import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { ICE_CREAM_CATEGORIES } from '../data/iceCreamFlavors';
import { ChevronDown, ChevronUp, Save, Search, LayoutGrid, List as ListIcon, ClipboardList, TrendingUp, Package, Clock, X, Trash2, CheckCircle, RefreshCw } from 'lucide-react';

const FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const FRACTION_LABELS = {
    0: '0',
    0.25: '1/4',
    0.5: '1/2',
    0.75: '3/4',
    1: '1'
};

// Layout físico del mostrador (v15.0)
const FREEZER_LAYOUT = [
    // Freezer 1 (Izquierda) - 8x2
    {
        id: 'F1',
        name: 'Freezer 1 (Izquierda)',
        rows: [
            ["DULCE DE LECHE", "SUPER DULCE DE LECHE", "DULCE CON NUEZ", "GRANIZADO", "LIMON", "CREMA OREO", "FRUTILLA", "DURAZNO"],
            ["DULCE GRANIZADO", "DULCE DE LECHE SEI TU", "TRAMONTANA", "AMERICANA", "LIMON A LA REINA", "DULCE DE LECHE CON OREO", "FRUTOS PATAGONICOS", "ANANA"]
        ]
    },
    // Freezer 2 (Centro) - 8x2
    {
        id: 'F2',
        name: 'Freezer 2 (Centro)',
        rows: [
            ["FRUTILLA A LA CREMA", "CEREZA A LA CREMA", "BANANITA DOLCA", "CHOCOLATE", "CHOCOLATE SHOT", "CHOCOLATE C/ ALMENDRAS", "CREMA FLAN", "SAMBAYON"],
            ["FRUTILLA CADBURY", "BANANA", "BANANA SPLIT", "CHOCOLATE BLANCO", "CHOCOLATE MARROC", "SUPER CHOCO SEI TU", "VAINILLA", "MASCARPONE C/ FRUTOS ROJOS"]
        ]
    },
    // Freezer 3 (Derecha) - 4x2
    {
        id: 'F3',
        name: 'Freezer 3 (Derecha)',
        rows: [
            ["TIRAMISU", "PISTACHO", "MULTISABOR", "CREMA DEL CIELO"],
            ["MENTA GRANIZADA", "MANTECOL", "CHOCOLATE MILKA MOUSSE", "CHOCOLATE DUBAI"]
        ]
    }
];

const VisualBucket = ({ fraction, colorClass }) => {
    const heightPercent = fraction * 100;
    return (
        <div className="w-4 h-7 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
            <div
                className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${colorClass}`}
                style={{ height: `${heightPercent}%` }}
            ></div>
        </div>
    );
};

export default function IceCreamStock() {
    const { iceCreamStock, iceCreamLogs, updateIceCreamStock, bulkUpdateIceCreamStock, factoryReset } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('mostrador'); // Default 'mostrador' v15.0
    const [incomingOrder, setIncomingOrder] = useState({});

    const userRole = localStorage.getItem('seitu_role') || 'admin';
    const userName = localStorage.getItem('seitu_user') || 'Admin';
    const isAdmin = userRole === 'admin' || userName === 'Admin' || userName === 'Mariana' || userName === 'Dueño' || userName === 'seitucastillo@gmail.com' || userName === 'Admin Local';

    const handleUpdate = (flavor, field, value) => {
        updateIceCreamStock(flavor, { [field]: value }, userRole, userName);
    };

    const handleOrderChange = (flavor, qty) => {
        setIncomingOrder(prev => ({
            ...prev,
            [flavor]: parseInt(qty) || 0
        }));
    };

    const totalIncoming = Object.values(incomingOrder).reduce((sum, q) => sum + q, 0);

    const processIncomingOrder = () => {
        const updates = Object.entries(incomingOrder)
            .filter(([_, qty]) => qty > 0)
            .map(([flavor, qty]) => ({
                flavor,
                updates: { reserve: (iceCreamStock[flavor]?.reserve || 0) + qty }
            }));

        if (updates.length === 0) return;

        if (window.confirm(`¿Confirmar recepción de ${totalIncoming} baldes? Se sumarán a la reserva de cada sabor.`)) {
            bulkUpdateIceCreamStock(updates, userRole, userName);
            setIncomingOrder({});
            alert(`✅ Pedido cargado: ${totalIncoming} baldes agregados al stock.`);
        }
    };

    const calculateTotal = (stock) => {
        return (stock.front1 || 0) + (stock.front2 || 0) + (stock.reserve || 0);
    };

    const getStatusColor = (current, necessary) => {
        if (!necessary || necessary === 0) return 'bg-slate-100 text-slate-400 dark:bg-slate-800';
        const percent = (current / necessary) * 100;
        if (percent < 25) return 'bg-red-500 text-white';
        if (percent < 75) return 'bg-orange-500 text-white';
        return 'bg-emerald-500 text-white';
    };

    const filteredFlavors = (category) => {
        return ICE_CREAM_CATEGORIES[category].filter(f =>
            f.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const SummaryTable = ({ category, showHeader = true }) => {
        const flavors = filteredFlavors(category);
        if (flavors.length === 0) return null;

        return (
            <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Sabor</th>
                                <th className="px-4 py-3 text-center">Hay en Stock</th>
                                <th className="px-4 py-3 text-center text-orange-500">Falta Reponer</th>
                                <th className="px-4 py-3 text-center">Stock Mín. Semanal</th>
                                <th className="px-4 py-3 text-center">Balance Pedido</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {flavors.map(flavor => {
                                const stock = iceCreamStock[flavor] || { front1: 0, front2: 0, reserve: 0, necessary: 0 };
                                const total = calculateTotal(stock);
                                const necessary = stock.necessary || 0;
                                const balance = total - necessary;
                                const toRefill = (1 - (stock.front1 || 0)) + (1 - (stock.front2 || 0));

                                return (
                                    <tr key={flavor} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200">{flavor}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="font-black text-slate-500">
                                                {total.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {toRefill > 0 ? (
                                                <span className="text-orange-500 font-black px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 rounded-md">
                                                    +{toRefill.toFixed(1)}
                                                </span>
                                            ) : (
                                                <span className="text-emerald-500 font-bold">Lleno</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="number"
                                                step="0.25"
                                                value={necessary}
                                                onChange={(e) => handleUpdate(flavor, 'necessary', parseFloat(e.target.value) || 0)}
                                                className="w-14 px-1 py-0.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-brand-500 outline-none font-bold dark:text-white"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`font-black ${balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {balance > 0 ? `+${balance.toFixed(1)}` : balance.toFixed(1)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const FreezerMap = () => {
        return (
            <div className="space-y-12">
                {FREEZER_LAYOUT.map(freezer => (
                    <div key={freezer.id} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 ml-2">
                            <div className="w-8 h-8 flex items-center justify-center bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/20 font-black text-xs">
                                {freezer.id}
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">{freezer.name}</h3>
                        </div>

                        <div className="space-y-4">
                            {freezer.rows.map((row, rowIndex) => (
                                <div key={rowIndex} className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                    {row.map((flavor, colIndex) => {
                                        const stock = iceCreamStock[flavor] || { front1: 0, front2: 0, reserve: 0 };
                                        const toRefill = (1 - (stock.front1 || 0)) + (1 - (stock.front2 || 0));

                                        return (
                                            <div
                                                key={colIndex}
                                                className={`relative p-2 rounded-2xl border transition-all flex flex-col items-center justify-center text-center min-h-[85px] ${toRefill > 0
                                                    ? 'bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-500/30'
                                                    : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 opacity-60'
                                                    }`}
                                            >
                                                <span className="text-[8px] font-black uppercase text-slate-400 mb-2 leading-tight px-1 line-clamp-2">
                                                    {flavor}
                                                </span>

                                                <div className="flex gap-2 mb-1 mt-1">
                                                    <VisualBucket
                                                        fraction={stock.front1 || 0}
                                                        colorClass={stock.front1 >= 1 ? 'bg-brand-500' : 'bg-orange-400'}
                                                    />
                                                    <VisualBucket
                                                        fraction={stock.front2 || 0}
                                                        colorClass={stock.front2 >= 1 ? 'bg-brand-500' : 'bg-orange-400'}
                                                    />
                                                </div>

                                                {toRefill > 0 && (
                                                    <div className="absolute top-1 right-1 bg-orange-500 text-white text-[8.5px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                                                        +{toRefill.toFixed(1)}
                                                    </div>
                                                )}

                                                {stock.reserve > 0 && (
                                                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg shadow-sm" title="Reserva disponible">
                                                        R:{stock.reserve}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const FlavorCard = ({ flavor }) => {
        const stock = iceCreamStock[flavor] || { front1: 0, front2: 0, reserve: 0, necessary: 0 };
        const total = calculateTotal(stock);

        return (
            <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-[11px] text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors truncate pr-2" title={flavor}>
                        {flavor}
                    </h4>
                    <div className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(total, stock.necessary)}`}>
                        {total.toFixed(1)}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="space-y-2">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Balde 1</label>
                                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{FRACTION_LABELS[stock.front1 || 0]}</span>
                            </div>
                            <div className="flex bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-100 dark:border-slate-700">
                                {FRACTIONS.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => handleUpdate(flavor, 'front1', f)}
                                        className={`flex-1 text-[8px] py-1 rounded-md transition-all ${stock.front1 === f ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                    >
                                        {FRACTION_LABELS[f]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Balde 2</label>
                                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{FRACTION_LABELS[stock.front2 || 0]}</span>
                            </div>
                            <div className="flex bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-100 dark:border-slate-700">
                                {FRACTIONS.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => handleUpdate(flavor, 'front2', f)}
                                        className={`flex-1 text-[8px] py-1 rounded-md transition-all ${stock.front2 === f ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                    >
                                        {FRACTION_LABELS[f]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-1">Reserva</label>
                            <span className="text-sm font-black text-slate-800 dark:text-white ml-1">{stock.reserve || 0}</span>
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => handleUpdate(flavor, 'reserve', Math.max(0, (stock.reserve || 0) - 1))}
                                className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-all font-black text-sm"
                            >
                                -
                            </button>
                            <button
                                onClick={() => handleUpdate(flavor, 'reserve', (stock.reserve || 0) + 1)}
                                className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-all font-black text-sm"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header / Search (Compacto) */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500 rounded-xl text-white shadow-lg shadow-brand-500/20">
                        <Package size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white leading-none">Control de Baldes</h2>
                        <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-wider">Gestión Física de Stock</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar sabor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs shadow-sm focus:ring-4 focus:ring-brand-500/10 dark:text-white"
                        />
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setViewMode('mostrador')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'mostrador' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-500' : 'text-slate-400'}`}
                        >
                            <LayoutGrid size={14} />
                            Mapa
                        </button>
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-500' : 'text-slate-400'}`}
                                ><Package size={16} /></button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-500' : 'text-slate-400'}`}
                                ><ListIcon size={16} /></button>
                                <button
                                    onClick={() => factoryReset()}
                                    className="p-1.5 text-red-500 hover:text-red-600 transition-all border-l border-slate-200 dark:border-slate-700 ml-1 pl-2 flex items-center gap-1"
                                    title="RESET DE FÁBRICA"
                                >
                                    <RefreshCw size={16} />
                                    <span className="text-[10px] font-black uppercase">Reset de Fábrica</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido Principal (v15.0/15.1 prioriza Mapa y Planilla) */}
            {/* Contenido Principal (v15.3 reorganizado) */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-12 pb-10">

                {/* --- VISTA MAPA (MOSTRADOR) --- */}
                {viewMode === 'mostrador' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Mapa Físico arriba */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Mapa Físico de Freezers</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Ubicación real en el mostrador</p>
                                </div>
                                <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-500/10 px-4 py-2 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                    <div className="flex items-center gap-2 text-orange-600">
                                        <VisualBucket fraction={0.5} colorClass="bg-orange-500" />
                                        <span className="text-[9px] font-black uppercase">Reponer</span>
                                    </div>
                                    <div className="h-4 w-px bg-orange-200 dark:bg-orange-500/20"></div>
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <VisualBucket fraction={1} colorClass="bg-brand-500" />
                                        <span className="text-[9px] font-black uppercase">Lleno</span>
                                    </div>
                                </div>
                            </div>
                            <FreezerMap />
                        </section>

                        {/* Tarjetas de Carga abajo */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Carga de Pantalla</h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Ajuste rápido de baldes y reserva</p>
                            </div>

                            {Object.keys(ICE_CREAM_CATEGORIES).map(cat => (
                                <section key={cat} className="mb-10 last:mb-0">
                                    <div className="flex items-center gap-4 mb-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{cat.replace('_', ' ')}</h3>
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {filteredFlavors(cat).map(flavor => (
                                            <FlavorCard key={flavor} flavor={flavor} />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {/* LISTA DE RESERVAS PARA EMPLEADOS (v16.25) */}
                        <div className="pt-10 border-t border-slate-200 dark:border-slate-800">
                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] p-6 border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-500 rounded-xl text-white">
                                        <ListIcon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-blue-900 dark:text-blue-300 uppercase tracking-tighter">Lista de Reservas (Para Reponer)</h3>
                                        <p className="text-blue-600/60 dark:text-blue-400/50 text-[10px] font-bold uppercase tracking-wider">Potes listos para bajar al mostrador</p>
                                    </div>
                                </div>

                                {(() => {
                                    const flavorsWithReserve = Object.entries(iceCreamStock)
                                        .filter(([_, stock]) => stock.reserve > 0)
                                        .sort((a, b) => a[0].localeCompare(b[0]));

                                    const totalReserve = flavorsWithReserve.reduce((sum, [_, stock]) => sum + (stock.reserve || 0), 0);

                                    if (flavorsWithReserve.length === 0) {
                                        return <p className="text-center py-6 text-blue-400 dark:text-blue-600 font-bold text-sm">No hay potes en reserva actualmente.</p>;
                                    }

                                    return (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {flavorsWithReserve.map(([flavor, stock]) => (
                                                    <div key={flavor} className="flex justify-between items-center bg-white dark:bg-slate-900/50 px-4 py-3 rounded-2xl border border-blue-100 dark:border-blue-900/20 shadow-sm">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{flavor}</span>
                                                        <span className="bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-blue-500/20">
                                                            {stock.reserve}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-900/30 flex justify-between items-center px-2">
                                                <span className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase">Total Baldes en Reserva</span>
                                                <span className="text-2xl font-black text-blue-600">
                                                    {totalReserve}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VISTA GESTIÓN (CUADRADITO / PAQUETE) --- */}
                {viewMode === 'grid' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
                        {/* Planilla General al inicio de esta vista */}
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                                        <ClipboardList className="text-brand-500" size={28} />
                                        Planilla General de Reposición
                                    </h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Totales para carga interna y pedidos externos</p>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                        <span className="text-[9px] font-black uppercase text-slate-500">Crítico</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                                        <span className="text-[9px] font-black uppercase text-slate-500">Atención</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[9px] font-black uppercase text-slate-500">Suficiente</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {Object.keys(ICE_CREAM_CATEGORIES).map(cat => (
                                    <div key={cat} className="space-y-2">
                                        <div className="flex items-center gap-2 ml-1">
                                            <div className="w-1.5 h-4 bg-brand-500 rounded-full"></div>
                                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{cat.replace('_', ' ')}</h4>
                                        </div>
                                        <SummaryTable category={cat} showHeader={true} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Historial de Auditoría abajo de la planilla */}
                        <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={20} className="text-brand-500" />
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Historial de Cambios</h3>
                                </div>
                                <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">
                                    Últimos 10 cambios
                                </span>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                {iceCreamLogs.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-slate-400 font-medium">No hay cambios registrados aún.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Fecha / Hora</th>
                                                    <th className="px-6 py-4">Sabor</th>
                                                    <th className="px-6 py-4 text-center">Campo</th>
                                                    <th className="px-6 py-4 text-center">Cambio</th>
                                                    <th className="px-6 py-4 text-center">Usuario</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {iceCreamLogs.slice(0, 10).map(log => (
                                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                                            {new Date(log.timestamp).toLocaleString('es-AR', {
                                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                                            {log.flavor}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-black uppercase text-slate-500">
                                                                {log.field === 'front1' ? 'Balde 1' :
                                                                    log.field === 'front2' ? 'Balde 2' :
                                                                        log.field === 'reserve' ? 'Reserva' :
                                                                            log.field === 'necessary' ? 'Necesario' : log.field}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="text-slate-400 line-through">
                                                                    {typeof log.oldValue === 'number' ? log.oldValue.toFixed(2).replace('.00', '') : (log.oldValue || '0')}
                                                                </span>
                                                                <span className="text-brand-500 font-black">→</span>
                                                                <span className="text-brand-600 font-black">
                                                                    {typeof log.newValue === 'number' ? log.newValue.toFixed(2).replace('.00', '') : log.newValue}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${log.userRole === 'stock' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                                                                {log.userName || (log.userRole === 'stock' ? 'Personal' : 'Admin')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VISTA LISTA (GESTIÓN RÁPIDA) --- */}
                {viewMode === 'list' && Object.keys(ICE_CREAM_CATEGORIES).map(cat => (
                    <section key={cat} className="animate-in fade-in duration-500">
                        <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{cat.replace('_', ' ')}</h3>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            {filteredFlavors(cat).map((flavor, index, arr) => {
                                const stock = iceCreamStock[flavor] || { front1: 0, front2: 0, reserve: 0, necessary: 0 };
                                const total = calculateTotal(stock);
                                return (
                                    <div key={flavor} className={`p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 ${index !== arr.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(total, stock.necessary).split(' ')[0]}`}></div>
                                            <span className="font-bold text-xs text-slate-700 dark:text-slate-200">{flavor}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            {/* SECCIÓN INGRESO DE PEDIDO (v16.27) */}
                                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                                <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400">¿Viene?</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={incomingOrder[flavor] || ''}
                                                    onChange={(e) => handleOrderChange(flavor, e.target.value)}
                                                    className="w-12 bg-white dark:bg-slate-800 border-none rounded-lg text-center font-black text-blue-600 dark:text-blue-400 text-sm shadow-inner"
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="space-y-0.5">
                                                <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest">Total</span>
                                                <span className="text-sm font-black text-brand-500">{total.toFixed(2)}</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <div className="flex bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-100 dark:border-slate-700">
                                                    {FRACTIONS.map(f => (
                                                        <button
                                                            key={f}
                                                            onClick={() => handleUpdate(flavor, 'front1', f)}
                                                            className={`px-2 py-1 rounded-md text-[8px] font-bold transition-all ${stock.front1 === f ? 'bg-brand-500 text-white' : 'text-slate-400'}`}
                                                        >
                                                            {FRACTION_LABELS[f]}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg px-2 border border-slate-100 dark:border-slate-700 gap-2">
                                                    <button onClick={() => handleUpdate(flavor, 'reserve', Math.max(0, (stock.reserve || 0) - 1))} className="text-slate-400 text-sm font-black">-</button>
                                                    <span className="font-black text-xs text-slate-700 dark:text-white min-w-[15px] text-center">{stock.reserve || 0}</span>
                                                    <button onClick={() => handleUpdate(flavor, 'reserve', (stock.reserve || 0) + 1)} className="text-slate-400 text-sm font-black">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                {/* --- FLOATING BAR: CONFIRMAR PEDIDO (v16.27) --- */}
                {totalIncoming > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-[100] border-4 border-white dark:border-slate-800">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black opacity-70 tracking-widest">Resumen del Pedido</span>
                            <span className="text-2xl font-black">{totalIncoming} Baldes</span>
                        </div>
                        <div className="h-10 w-px bg-white/20"></div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIncomingOrder({})}
                                className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white font-bold transition-all text-sm rounded-xl hover:bg-white/10"
                            >
                                <Trash2 size={16} /> Cancelar
                            </button>
                            <button
                                onClick={processIncomingOrder}
                                className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center gap-3 text-sm"
                            >
                                <CheckCircle size={20} /> CARGAR {totalIncoming} BALDES
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
