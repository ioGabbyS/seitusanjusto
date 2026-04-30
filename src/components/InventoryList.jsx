import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Edit2, Save, X, RotateCcw, Settings, ClipboardList, PenTool, FileSpreadsheet, Wrench } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { CATEGORIES } from '../data/products';
import { exportToExcel } from '../utils/excelExport';
import { normalize } from '../utils/formatters';

export default function InventoryList() {
    const { inventory, catalog, updateProductSettings, updateCatalogItem, restoreDefaultCatalog, adjustStock, stockLogs, activeSession, categories, fixCatalogNames } = useStore();
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [tempMin, setTempMin] = useState(0);
    const [tempPointsRatio, setTempPointsRatio] = useState(1);
    const [tempPointsCost, setTempPointsCost] = useState(0);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'audit'

    // Stock Adjustment State
    const [adjustingItem, setAdjustingItem] = useState(null);
    const [adjustQty, setAdjustQty] = useState('');
    const [adjustReason, setAdjustReason] = useState('');

    const handleRestore = () => {
        if (window.confirm("¿Estás seguro? Esto realizar un RESET DE FÁBRICA: Borrará TODO el catálogo personalizado y restaurará únicamente los productos oficiales de la planilla. Los precios y stock volverán a 0.")) {
            restoreDefaultCatalog();
        }
    };


    const filtered = Object.values(inventory).filter(item => {
        // 1. Ghost Filter: Only show items that exist in the Catalog
        // Check by ID (preferred) or Name (fallback)
        const existsInCatalog = catalog.some(c => c.id === item.id || c.name === item.name);
        if (!existsInCatalog) return false;

        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

        const isExact = searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length > 2;
        const cleanSearch = isExact ? searchTerm.slice(1, -1) : searchTerm;
        const normalizedSearch = normalize(cleanSearch);

        let matchesSearch;
        if (isExact) {
            matchesSearch = normalize(item.name) === normalizedSearch ||
                (item.barcode && normalize(item.barcode) === normalizedSearch);
        } else {
            matchesSearch = normalize(item.name).includes(normalizedSearch) ||
                (item.barcode && normalize(item.barcode).includes(normalizedSearch));
        }

        return matchesCategory && matchesSearch;
    });

    const startEdit = (item) => {
        setEditingId(item.name);
        setTempMin(item.minStock);
        setTempPointsRatio(item.pointsEarnedRatio !== undefined ? item.pointsEarnedRatio : 1);
        setTempPointsCost(item.pointCost || 0);
    };

    const saveEdit = (item) => {
        updateProductSettings(item.name, { minStock: Number(tempMin) });
        updateCatalogItem(item.id, {
            pointsEarnedRatio: Number(tempPointsRatio),
            pointCost: Number(tempPointsCost)
        });
        setEditingId(null);
    };

    const openAdjustment = (item) => {
        setAdjustingItem(item);
        setAdjustQty(item.currentStock); // Pre-fill with current detailed stock
        setAdjustReason('');
    };

    const saveAdjustment = () => {
        if (!adjustReason.trim()) {
            alert("Debes indicar un motivo para el ajuste (Ej: 'Vencido', 'Error de conteo')");
            return;
        }
        if (window.confirm(`¿Confirmar cambio de stock de ${adjustingItem.name} a ${adjustQty}?`)) {
            // Use ID for precise adjustment
            adjustStock(adjustingItem.id, adjustQty, adjustReason, activeSession?.cashier || localStorage.getItem('seitu_user') || 'Admin');
            setAdjustingItem(null);
        }
    };

    const handleExportExcel = () => {
        const data = filtered.map(item => ({
            'Producto': item.name,
            'Categoría': item.category,
            'Mínimo': item.minStock,
            'Stock Actual': Number(item.quantity).toFixed(2),
            'Estado': item.quantity < item.minStock ? 'Bajo' : 'OK'
        }));
        exportToExcel(data, `Inventario_${new Date().toISOString().split('T')[0]}`, 'Stock');
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Inventario</h2>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            Lista
                        </button>
                        <button
                            onClick={() => setViewMode('audit')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${viewMode === 'audit' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            <ClipboardList size={14} /> Auditoría
                        </button>
                    </div>
                </div>

                {viewMode === 'list' && (
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="flex gap-2">
                            <button
                                onClick={handleRestore}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/30"
                                title="Restaurar lista completa original"
                            >
                                <RotateCcw size={16} /> Reset de Fábrica
                            </button>

                            <button
                                onClick={fixCatalogNames}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-lg transition-colors border border-brand-200 dark:border-brand-900/30"
                                title="Corregir nombres duplicados y recuperar precios perdidos"
                            >
                                <Wrench size={16} /> Reparar Catálogo
                            </button>

                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-900/30"
                                title="Exportar stock actual a Excel"
                            >
                                <FileSpreadsheet size={16} /> Exportar Excel
                            </button>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none w-48 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                            <option value="ALL">Todas</option>
                            {categories.sort().map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {viewMode === 'list' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-semibold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4 text-center">Config. Puntos</th>
                                <th className="px-6 py-4 text-center">Mínimo</th>
                                <th className="px-6 py-4 text-center">Stock Actual</th>
                                <th className="px-6 py-4 text-right">Ajuste</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                            {filtered.length > 0 ? (
                                filtered.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-1 rounded text-xs">{item.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {editingId === item.name ? (
                                                <div className="flex flex-col gap-1 items-center">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Ratio</span>
                                                        <input
                                                            type="number"
                                                            value={tempPointsRatio}
                                                            onChange={(e) => setTempPointsRatio(e.target.value)}
                                                            className="w-12 px-1 py-0.5 border dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-center text-xs text-slate-900 dark:text-white"
                                                            placeholder="1"
                                                            step="0.1"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Costo</span>
                                                        <input
                                                            type="number"
                                                            value={tempPointsCost}
                                                            onChange={(e) => setTempPointsCost(e.target.value)}
                                                            className="w-12 px-1 py-0.5 border dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-center text-xs text-slate-900 dark:text-white"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1 items-center text-xs">
                                                    <div title="Puntos ganados por cada $100" className={`${item.pointsEarnedRatio === 0 ? 'text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        x{item.pointsEarnedRatio !== undefined ? item.pointsEarnedRatio : 1}
                                                    </div>
                                                    {item.pointCost > 0 && (
                                                        <div title="Costo en Puntos para Canje" className="text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 rounded">
                                                            -{item.pointCost} pts
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {editingId === item.name ? (
                                                <div className="flex items-center gap-1 justify-center">
                                                    <input
                                                        type="number"
                                                        value={tempMin}
                                                        onChange={(e) => setTempMin(e.target.value)}
                                                        className="w-16 px-2 py-1 border dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-center text-slate-900 dark:text-white"
                                                    />
                                                    <button onClick={() => saveEdit(item)} className="text-green-600 dark:text-green-500 font-bold">OK</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(item)} className="flex items-center gap-1 mx-auto text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400">
                                                    {item.minStock} <Settings size={14} />
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold px-3 py-1 rounded-full ${item.quantity < item.minStock ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                                                }`}>
                                                {Number(item.quantity).toFixed(2).replace('.00', '')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openAdjustment(item)}
                                                className="text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-2 rounded-lg transition-colors"
                                                title="Ajustar Stock Manualmente"
                                            >
                                                <PenTool size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400 dark:text-slate-600">
                                        No se encontraron productos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-semibold uppercase text-xs sticky top-0">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Detalle</th>
                                <th className="px-6 py-4">Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                            {stockLogs && stockLogs.length > 0 ? (
                                stockLogs.slice().reverse().map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <td className="px-6 py-4 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{log.user}</td>
                                        <td className="px-6 py-4 font-medium dark:text-white">{log.product}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 dark:text-slate-600 line-through">{log.oldStock}</span>
                                                <span className="text-slate-300 dark:text-slate-700">→</span>
                                                <span className={`font-bold ${log.difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {log.newStock}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-600">({log.difference > 0 ? '+' : ''}{log.difference})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 italic">"{log.reason}"</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400 dark:text-slate-600">No hay registros de auditoría.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Adjust Stock Modal */}
            {adjustingItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/10">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" /> Ajuste de Stock
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Estás modificando el stock de <strong className="text-slate-800 dark:text-slate-200">{adjustingItem.name}</strong>.
                            Esta acción quedará registrada.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Nuevo Stock Real</label>
                                <input
                                    type="number"
                                    autoFocus
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-lg font-bold outline-none focus:border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={adjustQty}
                                    onChange={e => setAdjustQty(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Motivo (Obligatorio)</label>
                                <textarea
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none h-20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="Ej: Conteo físico, Mercadería vencida, Rotura..."
                                    value={adjustReason}
                                    onChange={e => setAdjustReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setAdjustingItem(null)}
                                    className="flex-1 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveAdjustment}
                                    className="flex-1 py-2 bg-slate-900 dark:bg-brand-600 text-white font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-brand-500 shadow-lg transition-transform active:scale-95"
                                >
                                    Confirmar Ajuste
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
