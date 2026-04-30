import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, Box, List, CheckCircle, Edit2, Save, ClipboardCheck, RotateCcw, Lock, Trash2, RefreshCw } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { normalize as basicNormalize } from '../utils/formatters';

// v5.3.2: RESTORATION MODE - ONLY FIXING REQUESTED ITEMS
const normalize = (s) => {
    if (!s) return "";
    let str = s.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/seibon/g, "seibom")
        .replace(/sei bom/g, "seibom")
        .replace(/bombom/g, "bombon")
        .replace(/nevado/g, "blanco")
        .replace(/clasico/g, "negro");

    // --- SPECIFIC FIXES (REQUESTED BY USER) ---
    if (str.includes("cormillot") && str.includes("vainilla")) return "frutillavainilla";
    if (str.includes("crocante")) return "palitocrocante";
    // v5.3.3: Removed over-aggressive Almendrado normalization to distinguish x8 and x20
    if (str.includes("cookies") && str.includes("16")) return "seibomcookies";
    if (str.includes("blanco") && str.includes("16")) return "seibomblanco";

    // Identity-Safe Noise Removal (Piccole, Frisky, Giovi are now PROTECTED)
    str = str.replace(/\b(seitu|sei|helado|unidad|unid|unidades|u|un|pack|caja|extra|de|la|el|x|funcional)\b/g, " ");

    return str.replace(/[^a-z0-9]/g, "").trim();
};
import { ICE_CREAM_PRODUCTS, ICE_CREAM_PACK_UNITS, ICE_CREAM_CATEGORIES, ICE_CREAM_CATALOG } from '../data/iceCreamProducts.js';

// --- ESTRUCTURA DINAMICA BASADA EN EL CATALOGO OFICIAL ---


export default function IceCreamUnitControl() {
    const { inventory, bulkAdjustStock, activeSession, updateCatalogItem, theme, stockLogs, updateWholeCatalog, deleteStockSession, applyStockSession, factoryReset } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [inputs, setInputs] = useState({}); // { itemName: { bultos: '', units: '' } }
    const [confirmed, setConfirmed] = useState({}); // Toggles visuales (tachado verde)
    const [viewMode, setViewMode] = useState('map'); // 'map', 'cube', 'list'
    const [editingPackUnits, setEditingPackUnits] = useState(null);
    const [isAdditiveMode, setIsAdditiveMode] = useState(false); // v16.86: Mode switch for counting vs receiving order

    const userName = localStorage.getItem('seitu_user') || 'Admin';
    const userRole = localStorage.getItem('seitu_role') || 'admin';
    // v16.80: Correctly check admin permissions
    const isAdmin = userRole === 'admin' || userName === 'Admin' || userName === 'Mariana' || userName === 'Dueño' || userName === 'seitucastillo@gmail.com' || userName === 'Admin Local';

    const handleInputChange = (productId, field, value) => {
        setInputs(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || { bultos: '', units: '' }),
                [field]: value
            }
        }));
    };

    const getPackUnits = (item) => {
        // v4.8.5: Global Search across ALL ice cream groups
        const itemNameNorm = normalize(item.name);
        let foundPack = null;

        // Try to find the product in ANY group of the official catalog config
        for (const catKey in ICE_CREAM_PACK_UNITS) {
            const config = ICE_CREAM_PACK_UNITS[catKey];

            // 1. Direct match in this group
            if (config[item.name]) {
                foundPack = config[item.name];
                break;
            }
            if (config[item.name.toUpperCase()]) {
                foundPack = config[item.name.toUpperCase()];
                break;
            }

            // 2. Fuzzy match in this group (skip 'default')
            const specificKey = Object.keys(config)
                .sort((a, b) => b.length - a.length)
                .find(k => {
                    if (k === 'default') return false;
                    const kNorm = normalize(k);
                    // Match if name is same or contained (e.g. "FRUTILLA" in "PALITO FRUTILLA")
                    return itemNameNorm === kNorm || itemNameNorm.includes(kNorm);
                });

            if (specificKey) {
                foundPack = config[specificKey];
                break;
            }
        }

        // Final fallbacks: Found in config > Item's own database packUnits > Default to 1
        return foundPack || Number(item.packUnits) || 1;
    };

    const calculateItemTotal = (item) => {
        const input = inputs[item.id] || { bultos: '', units: '' };
        const packUnits = getPackUnits(item);
        return (Number(input.bultos) || 0) * packUnits + (Number(input.units) || 0);
    };

    const toggleTicked = (productId) => {
        setConfirmed(prev => ({ ...prev, [productId]: !prev[productId] }));
    };

    const handleConfirmAll = () => {
        // v4.9.1: Correctly use REAL inventory items from the state
        const itemsToConfirm = inventory.filter(item => {
            const input = inputs[item.id];
            return input && (input.bultos !== '' || input.units !== '');
        });

        if (itemsToConfirm.length === 0) {
            alert("⚠️ No hay conteos para confirmar. Asegúrate de haber ingresado una cantidad en algún producto.");
            return;
        }

        const modeLabel = isAdditiveMode ? "INGRESO DE PEDIDO (SUMAR)" : "RECUENTO FÍSICO (REEMPLAZAR)";
        const confirmMsg = isAdmin
            ? `¿Confirmar ${isAdditiveMode ? 'INGRESO' : 'RECUENTO'} de ${itemsToConfirm.length} productos?\n\nModo: ${modeLabel}`
            : `¿Confirmar la carga de ${itemsToConfirm.length} productos?`;

        if (window.confirm(confirmMsg)) {
            const adjustments = itemsToConfirm.map(item => {
                const total = calculateItemTotal(item);
                const input = inputs[item.id];

                return {
                    productId: item.id,
                    productName: item.name,
                    category: item.category,
                    barcode: item.barcode || "",
                    newTotal: total,
                    reason: isAdditiveMode ? 'Ingreso de mercadería (Pedido)' : 'Conteo físico de helados',
                    bultos: input.bultos || 0,
                    units: input.units || 0,
                    packUnits: getPackUnits(item),
                    isAdditive: isAdditiveMode
                };
            });

            bulkAdjustStock(adjustments, userName);
            alert(`✅ ${isAdditiveMode ? "Pedido ingresado" : "Conteo cargado"} correctamente.`);
            setInputs({});
            setConfirmed({});
        }
    };

    const sortedData = useMemo(() => {
        const groups = [];

        // v4.8: Grouping by "Wholesale Order List" logic (Blue headers in user image)
        Object.entries(ICE_CREAM_CATALOG).forEach(([subGroupName, templateItems]) => {
            const itemsInGroup = [];

            templateItems.forEach(template => {
                // Find matching item in REAL inventory by barcode or normalized name
                // This ensures we update the item even if it's in category "IMPULSIVOS" or "BALDES Y POTES"
                const dbMatch = inventory.find(invItem => {
                    const templateId = template.id?.toString();
                    const invId = invItem.id?.toString();

                    // 1. Strict ID Match (Strongest)
                    if (templateId && invId && templateId === invId) return true;

                    // 2. Barcode Match (Only if ID doesn't match AND barcode is unique-ish)
                    // If we have a barcode like 7798138004597 (Almendrado) that belongs to x8, 
                    // we must not match it to the x20 if the template is asking for x8.
                    const sameBarcode = invItem.barcode && template.barcode && invItem.barcode === template.barcode;

                    // 3. Name match (Normalized)
                    const sameName = normalize(invItem.name) === normalize(template.name);

                    // To prevent Hogareña items matching Gastronomia items by accident:
                    // If we have an ID match, we stick with it. 
                    // If not, we only allow name/barcode match if the category is somewhat related.
                    return sameBarcode || sameName;
                });

                if (dbMatch) {
                    itemsInGroup.push(dbMatch);
                } else {
                    // v5.1: Nuclear Shield - Never let a product disappear from the UI
                    // It creates a "proxy" item so the user can still see it and load stock
                    itemsInGroup.push({
                        id: `missing-${template.id}`,
                        name: template.name.toUpperCase(),
                        category: "IMPULSIVOS",
                        currentStock: 0,
                        quantity: 0,
                        barcode: template.barcode || "",
                        packUnits: template.pack,
                        isMissingInDb: true
                    });
                }
            });

            if (itemsInGroup.length > 0) {
                groups.push({
                    category: subGroupName, // The blue header title
                    items: itemsInGroup.sort((a, b) => a.name.localeCompare(b.name))
                });
            }
        });

        // Search filter
        if (!searchTerm) return groups;

        return groups.map(g => ({
            ...g,
            items: g.items.filter(i => normalize(i.name).includes(normalize(searchTerm)))
        })).filter(g => g.items.length > 0);
    }, [inventory, searchTerm]);

    const auditByDate = useMemo(() => {
        const countLogs = (stockLogs || []).filter(log => log.reason === 'Conteo físico de helados');
        const grouped = {};
        countLogs.forEach(log => {
            const dateStr = new Date(log.timestamp).toLocaleDateString();
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(log);
        });
        return grouped;
    }, [stockLogs]);

    const renderTable = (isReadOnly = false) => (
        <div className="space-y-12">
            {sortedData.map(group => (
                <section key={group.category} className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-in slide-in-from-bottom-4 transition-all duration-700">
                    <div className="bg-gradient-to-r from-sky-50 to-white dark:from-slate-800 dark:to-slate-900 px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-500 px-8 py-3 rounded-2xl shadow-xl shadow-sky-500/20 border border-white/20">
                                {group.category}
                            </h3>
                            <span className="bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {group.items.length} Sabores
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-slate-800/50">
                                    <th className="px-8 py-5">Producto</th>
                                    <th className="px-6 py-5 text-center w-28 text-sky-600 font-black">Stock Actual</th>
                                    <th className="px-6 py-5 text-center w-32">Código</th>
                                    <th className="px-6 py-5 text-center w-28">Pack</th>
                                    <th className="px-6 py-5 text-center w-28">Bultos</th>
                                    <th className="px-6 py-5 text-center w-28">Unidades</th>
                                    <th className="px-6 py-5 text-center bg-sky-50/30 dark:bg-sky-500/5 w-28 text-sky-600">Total</th>
                                    {!isReadOnly && <th className="px-6 py-5 text-center w-20">Visto</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {group.items.map(item => {
                                    const subtotal = calculateItemTotal(item);
                                    const isTicked = confirmed[item.id];

                                    return (
                                        <tr key={item.id} className={`group transition-all duration-500 border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${isTicked ? 'bg-emerald-50/50 dark:bg-emerald-500/10' : 'hover:bg-sky-50/30 dark:hover:bg-slate-800/20'}`}>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className={`font-black text-[13px] tracking-tight uppercase transition-colors duration-500 ${isTicked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-sky-600'}`}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-mono text-[13px] font-black ${item.currentStock <= 0 ? 'text-rose-500' : 'text-sky-600'}`}>
                                                        {item.currentStock || 0}
                                                    </span>
                                                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-tighter">UNIDADES</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="inline-flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                    <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                                                        {item.barcode || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                                                    <span className="font-black text-[10px] text-slate-500 dark:text-slate-400">
                                                        {getPackUnits(item)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-5 text-center">
                                                <input
                                                    type="number"
                                                    disabled={isReadOnly}
                                                    placeholder="0"
                                                    className={`w-16 bg-slate-50 dark:bg-slate-800 border-2 ${inputs[item.id]?.bultos ? 'border-sky-500/30 ring-4 ring-sky-500/5' : 'border-transparent'} rounded-2xl text-center font-black text-slate-800 dark:text-white p-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:scale-105`}
                                                    value={inputs[item.id]?.bultos || ''}
                                                    onChange={(e) => handleInputChange(item.id, 'bultos', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-2 py-5 text-center">
                                                <input
                                                    type="number"
                                                    disabled={isReadOnly}
                                                    placeholder="0"
                                                    className={`w-16 bg-slate-50 dark:bg-slate-800 border-2 ${inputs[item.id]?.units ? 'border-sky-500/30 ring-4 ring-sky-500/5' : 'border-transparent'} rounded-2xl text-center font-black text-slate-800 dark:text-white p-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:scale-105`}
                                                    value={inputs[item.id]?.units || ''}
                                                    onChange={(e) => handleInputChange(item.id, 'units', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-6 py-5 text-center relative">
                                                <div className={`font-black text-sm absolute inset-0 flex items-center justify-center transition-all duration-500 ${subtotal > 0 ? 'bg-sky-50/50 dark:bg-sky-500/10 text-sky-600 scale-100' : 'text-slate-200 scale-90'}`}>
                                                    {subtotal}
                                                </div>
                                            </td>
                                            {!isReadOnly && (
                                                <td className="px-4 py-5 text-center">
                                                    <button
                                                        onClick={() => toggleTicked(item.id)}
                                                        className={`group/btn p-3 rounded-2xl transition-all duration-500 ${isTicked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110 rotate-[360deg]' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:text-emerald-500 hover:scale-110 hover:shadow-lg hover:bg-emerald-50'}`}
                                                    >
                                                        <CheckCircle size={20} fill={isTicked ? 'white' : 'transparent'} strokeWidth={isTicked ? 3 : 2} className="transition-transform group-hover/btn:scale-110" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </div>
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="bg-gradient-to-br from-white to-sky-50 dark:from-slate-900 dark:to-slate-800 p-8 rounded-[3rem] border border-sky-100 dark:border-slate-700 shadow-xl shadow-sky-500/5 flex flex-col md:flex-row justify-between items-center gap-6 mx-4">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-[1.5rem] shadow-lg shadow-sky-500/40 text-white">
                        <Box size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                            Control de Stock <span className="text-sky-500">Helados</span>
                        </h2>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Planilla de Control Físico Diario</p>
                    </div>
                </div>

                <div className="flex bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl items-center border border-white/50 dark:border-slate-700 shadow-inner">
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <LayoutGrid size={18} />
                        <span className="text-[11px] font-black tracking-tighter uppercase">Modo Mapa</span>
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="Ver Matriz de Control / Auditoría"
                        >
                            <List size={20} />
                            <span className="text-[11px] font-black tracking-tighter uppercase">Historial / Matriz</span>
                        </button>
                    )}
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setIsAdditiveMode(false)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-tighter transition-all duration-300 ${!isAdditiveMode ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                            title="Modo: Inventario (Sobreescribe el stock actual con lo que cuentes)"
                        >
                            RECUENTO (FÍSICO)
                        </button>
                        <button
                            onClick={() => setIsAdditiveMode(true)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-tighter transition-all duration-300 ${isAdditiveMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-500'}`}
                            title="Modo: Pedido (Suma lo que cargues al stock que ya existe)"
                        >
                            INGRESO PEDIDO (+SUMA)
                        </button>
                    </div>
                )}

                <div className="relative w-full md:w-64 group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-sky-500 transition-transform group-focus-within:scale-110">
                        <Search size={18} strokeWidth={3} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar sabor..."
                        className="w-full pl-12 pr-6 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-white placeholder:text-slate-300 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => handleConfirmAll()}
                    className={`flex items-center gap-2 px-8 py-4 bg-gradient-to-r ${isAdditiveMode ? 'from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/20' : 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20'} text-white rounded-2xl font-black text-xs transition-all shadow-xl border border-white/10 active:scale-95 whitespace-nowrap`}
                >
                    <CheckCircle size={18} strokeWidth={3} />
                    <span>
                        {isAdmin ? (isAdditiveMode ? 'CONFIRMAR INGRESO PEDIDO' : 'CONFIRMAR RECUENTO DE STOCK') : 'CONFIRMAR CARGA'}
                    </span>
                </button>
            </div>

            {/* Empty State / Initialization */}
            {
                sortedData.length === 0 && searchTerm === '' && (
                    <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 mx-4 rounded-[4rem] border border-dashed border-sky-200 dark:border-sky-900/50 animate-in zoom-in-95 duration-700 shadow-2xl shadow-sky-500/5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse"></div>
                            <div className="relative p-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-[3rem] text-white shadow-2xl shadow-yellow-500/40 mb-8 border-4 border-white dark:border-slate-800">
                                <Box size={64} className="animate-bounce" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-3 tracking-tighter">¡Planilla Re-Lista!</h3>
                        <p className="text-slate-400 text-sm mb-10 text-center max-w-sm px-10 leading-relaxed font-medium">
                            Parece que el catálogo está listo para recibir los sabores de <span className="text-sky-500 font-black">SEI TU</span>. Inicializala ahora para empezar el conteo.
                        </p>
                        <button
                            onClick={async () => {
                                if (window.confirm("¿Seguro que quieres CARGAR los productos faltantes?\n\nEsto buscará en el archivo maestro y agregará SOLO los que no existan en tu catálogo.\nNo borrará ni modificará los precios de lo que ya tienes.")) {

                                    // v4.8.1: Safe merge logic using REAL categories
                                    const missingItems = ICE_CREAM_PRODUCTS.filter(templateItem => {
                                        // Check by name in REAL inventory
                                        const exists = inventory.some(dbItem =>
                                            normalize(dbItem.name) === normalize(templateItem.name)
                                        );
                                        return !exists;
                                    });

                                    if (missingItems.length === 0) {
                                        alert("✅ No faltan helados en tu catálogo actual.");
                                        return;
                                    }

                                    // Map them to have unique IDs (not starting with ice-)
                                    const itemsToAdd = missingItems.map(item => ({
                                        ...item,
                                        id: `gen-${Date.now()}-${Math.random().toString().slice(2, 6)}`
                                    }));

                                    const newCatalog = [...inventory, ...itemsToAdd];
                                    await updateWholeCatalog(newCatalog);

                                    alert(`✅ Se agregaron ${itemsToAdd.length} productos faltantes con sus categorías correctas (Impulsivos, etc).`);
                                }
                            }}
                            className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-sky-500 to-sky-400 text-white rounded-[2rem] font-black text-sm hover:from-sky-400 hover:to-sky-300 transition-all shadow-2xl shadow-sky-500/40 border-2 border-white/20 active:scale-95 group"
                        >
                            <RotateCcw size={22} className="group-hover:rotate-180 transition-transform duration-700" />
                            <span>AGREGAR FALTANTES (Seguro)</span>
                        </button>
                    </div>
                )
            }

            {/* View Switching */}
            {viewMode === 'map' && sortedData.length > 0 && renderTable(false)}

            {
                viewMode === 'cube' && sortedData.length > 0 && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mx-6 mb-6 p-4 bg-sky-50 dark:bg-sky-900/10 rounded-2xl border border-sky-100 dark:border-sky-800 flex items-center gap-4">
                            <Box className="text-sky-500" size={24} />
                            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest">Resumen de Cantidades Cargadas</span>
                        </div>
                        {renderTable(true)}
                    </div>
                )
            }

            {
                viewMode === 'list' && (
                    <div className="space-y-8 mx-6 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-4 mb-2">
                            <List size={20} className="text-sky-500" />
                            <h2 className="text-lg font-black text-slate-700 dark:text-white uppercase tracking-tighter">Historial de Auditoría (Matriz de Control)</h2>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                        </div>

                        {/* MATRIZ DE CONTROL (Pivot Table) */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
                                            <th className="px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 w-64 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Producto / Sabor</th>
                                            {/* Dynamic Date Columns */}
                                            {(() => {
                                                // Group logs by Session (Minute + User)
                                                const sessions = {};
                                                stockLogs.forEach(log => {
                                                    if (!log.bultos && !log.units) return; // Only show physical counts
                                                    const dateKey = log.timestamp.slice(0, 16); // Minute resolution
                                                    const key = `${dateKey}| ${log.user} `;
                                                    if (!sessions[key]) {
                                                        sessions[key] = {
                                                            ts: log.timestamp,
                                                            user: log.user,
                                                            map: {}
                                                        };
                                                    }
                                                    sessions[key].map[normalize(log.product)] = log;
                                                });
                                                // Sort desc and take top 5
                                                const sortedSessions = Object.values(sessions).sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 15);

                                                return sortedSessions.map((session, idx) => (
                                                    <th key={idx} className="px-1 py-4 text-center border-l border-slate-200 dark:border-slate-700 min-w-[80px] max-w-[100px] group/col relative">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className="text-sky-600 dark:text-sky-400 text-[9px]">{new Date(session.ts).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</span>
                                                                {isAdmin && (
                                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 transition-all">
                                                                        <button
                                                                            onClick={() => {
                                                                                const action = window.prompt("¿Cómo deseas aplicar este stock?\n\n1. RECUENTO (Reemplaza el stock actual con estos números)\n2. PEDIDO (Suma estos números al stock que ya tienes)\n\nEscribe 1 o 2:");
                                                                                if (action === '1' || action === '2') {
                                                                                    const pass = window.prompt("Ingresa la clave (1145):");
                                                                                    if (pass === '1145') {
                                                                                        const success = applyStockSession(session.ts, session.user, action === '2');
                                                                                        if (success) alert("¡Stock actualizado correctamente!");
                                                                                        else alert("No se pudo sincronizar automáticamente.");
                                                                                    } else if (pass !== null) {
                                                                                        alert("Clave incorrecta.");
                                                                                    }
                                                                                } else if (action !== null) {
                                                                                    alert("Opción no válida. Escribe 1 o 2.");
                                                                                }
                                                                            }}
                                                                            className="p-1 text-sky-400 hover:text-sky-600 hover:scale-125 transition-all"
                                                                            title="APLICAR ESTE CONTEO AL STOCK"
                                                                        >
                                                                            <RefreshCw size={10} strokeWidth={3} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const pass = window.prompt("Ingresa la clave para borrar esta prueba (es la misma de Config):");
                                                                                if (pass === '1145') {
                                                                                    deleteStockSession(session.ts, session.user);
                                                                                } else if (pass !== null) {
                                                                                    alert("Clave incorrecta.");
                                                                                }
                                                                            }}
                                                                            className="p-1 text-slate-300 hover:text-rose-500 hover:scale-125 transition-all"
                                                                            title="Borrar Sesión"
                                                                        >
                                                                            <Trash2 size={10} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[8px] text-slate-400 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{new Date(session.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />{session.user.split('@')[0]}</span>
                                                            <div className="grid grid-cols-3 gap-0 mt-2 text-[7px] text-slate-400 border-t border-slate-200 pt-1">
                                                                <span>B</span>
                                                                <span>U</span>
                                                                <span className="font-bold text-sky-500">T</span>
                                                            </div>
                                                        </div>
                                                    </th>
                                                ));
                                            })()}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {sortedData.map(group => (
                                            <React.Fragment key={group.category}>
                                                <tr className="bg-sky-50/50 dark:bg-sky-900/20">
                                                    <td colSpan="10" className="px-6 py-2 text-[10px] font-black text-sky-600 uppercase tracking-widest sticky left-0 bg-sky-50/50 dark:bg-sky-900/20 z-10">
                                                        {group.category}
                                                    </td>
                                                </tr>
                                                {group.items.map(item => (
                                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-6 py-3 font-bold text-[11px] text-slate-600 dark:text-slate-300 uppercase sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                            {item.name}
                                                        </td>
                                                        {(() => {
                                                            // Re-calc sessions logic (should optimize this with memo but ok for now)
                                                            const sessions = {};
                                                            stockLogs.forEach(log => {
                                                                if (!log.bultos && !log.units) return;
                                                                const dateKey = log.timestamp.slice(0, 16);
                                                                const key = `${dateKey}| ${log.user} `;
                                                                if (!sessions[key]) {
                                                                    sessions[key] = { ts: log.timestamp, map: {} };
                                                                }
                                                                // v4.9.2: Key by productId for perfect matching
                                                                const productKey = log.productId || normalize(log.product);
                                                                sessions[key].map[productKey] = log;
                                                            });
                                                            const sortedSessions = Object.values(sessions).sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 5);

                                                            return sortedSessions.map((session, idx) => {
                                                                // Match by ID
                                                                const log = session.map[item.id];

                                                                return (
                                                                    <td key={idx} className="px-1 py-1 text-center border-l border-slate-100 dark:border-slate-800 align-middle">
                                                                        {log ? (
                                                                            <div className="flex flex-col justify-center h-full gap-1 py-1">
                                                                                <div className="grid grid-cols-2 text-[9px] text-slate-400 font-mono border-b border-slate-50 dark:border-slate-800 pb-0.5 mb-0.5">
                                                                                    <span title="Bultos cargados">{log.bultos || '0'}</span>
                                                                                    <span title="Unidades sueltas">{log.units || '0'}</span>
                                                                                </div>
                                                                                <div className="flex flex-col items-center justify-center">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="font-bold text-[10px] text-sky-700 dark:text-sky-400" title="Nuevo Stock">{log.newStock}</span>
                                                                                        {log.difference !== 0 && log.difference !== undefined && (
                                                                                            <span className={`text-[8px] font-bold px-1 rounded ${log.difference < 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                                                                                                {log.difference > 0 ? '+' : ''}{log.difference}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-[7px] text-slate-300 dark:text-slate-600 font-bold uppercase" title="Stock que había antes">Antes: {log.oldStock || 0}</span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-slate-200 text-[10px]">-</span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            });
                                                        })()}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="flex justify-center flex-col items-center gap-2 italic text-slate-400 text-[10px] pb-10">
                <p>Usa los botones superiores para cambiar entre el Mapa de Carga, Resumen de Cantidades y Historial.</p>
                <p className="text-sky-500 font-bold uppercase tracking-widest opacity-50">Tucito - Solar Planck</p>
            </div>
        </div >
    );
}

