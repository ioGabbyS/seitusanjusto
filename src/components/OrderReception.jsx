import React, { useState, useMemo } from 'react';
import { Search, Package, Trash2, CheckCircle, Calculator, Info, Edit2, Save } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { normalize } from '../utils/formatters';

const CATEGORY_ORDER = [
    "Palitos de Agua",
    "Palitos de Crema",
    "Palitos Cormillot",
    "Palito Bombón",
    "Copa Sei Tu x 220 cc",
    "Caritas",
    "Palitos Sei Bom",
    "Barrita",
    "Copitas x 110 cc",
    "Cono Tu (Cono Flama)",
    "Línea Gastronomía",
    "Línea Hogareña Pack x 6",
    "Bomboncitos",
    "Alfajor Helado",
    "Tortas Premium Pack x 6",
    "Balde x 2 Litros",
    "Baldes x 3 Litros",
    "Baldes x 5 Litros",
    "Potes x 750 cc x 8 Unid",
    "Potes 360 cc X 12 Unidades",
    "Potes Premium x 750 cc"
];

export default function OrderReception() {
    const { inventory, bulkAdjustStock, activeSession, updateCatalogItem, theme } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [inputs, setInputs] = useState({}); // { itemName: { bultos: '', units: '' } }
    const [editingPackUnits, setEditingPackUnits] = useState(null); // itemName

    const isDark = theme === 'dark';

    const handleInputChange = (itemName, field, value) => {
        setInputs(prev => ({
            ...prev,
            [itemName]: {
                ...(prev[itemName] || { bultos: '', units: '' }),
                [field]: value
            }
        }));
    };

    const calculateItemTotal = (item) => {
        const input = inputs[item.name] || { bultos: '', units: '' };
        const packUnits = Number(item.packUnits) || 1;
        return (Number(input.bultos) || 0) * packUnits + (Number(input.units) || 0);
    };

    const totalUnits = useMemo(() => {
        return Object.values(inventory).reduce((sum, item) => sum + calculateItemTotal(item), 0);
    }, [inventory, inputs]);

    const activeAdjustmentsCount = useMemo(() => {
        return Object.values(inputs).filter(i => (Number(i.bultos) || 0) > 0 || (Number(i.units) || 0) > 0).length;
    }, [inputs]);

    const filteredInventory = useMemo(() => {
        return Object.values(inventory).filter(item => {
            const matchesSearch = normalize(item.name).includes(normalize(searchTerm));
            // Show only ice cream categories mostly
            const isIceCream = CATEGORY_ORDER.includes(item.category) ||
                item.category.toLowerCase().includes('lata') ||
                item.category.toLowerCase().includes('balde') ||
                item.category.toLowerCase().includes('potes');
            return matchesSearch && isIceCream;
        });
    }, [inventory, searchTerm]);

    const groupedItems = useMemo(() => {
        const groups = {};
        filteredInventory.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [filteredInventory]);

    const sortedCategories = useMemo(() => {
        const cats = Object.keys(groupedItems);
        return cats.sort((a, b) => {
            const indexA = CATEGORY_ORDER.indexOf(a);
            const indexB = CATEGORY_ORDER.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [groupedItems]);

    const processOrder = () => {
        const adjustments = Object.values(inventory)
            .map(item => ({
                productName: item.name,
                addition: calculateItemTotal(item)
            }))
            .filter(adj => adj.addition > 0);

        if (adjustments.length === 0) return;

        if (window.confirm(`¿Confirmar recepción de ${totalUnits} unidades? Se sumarán al stock actual.`)) {
            bulkAdjustStock(
                adjustments.map(a => ({ ...a, reason: 'Recepción de pedido' })),
                activeSession?.cashier || 'Admin'
            );
            setInputs({});
            alert(`✅ Stock actualizado exitosamente.`);
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Recepción de Pedido</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Carga por Bultos y Unidades</p>
                    </div>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-8">
                {sortedCategories.map(category => (
                    <section key={category} className="space-y-4">
                        <div className="flex items-center gap-4 ml-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{category}</h3>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4 text-center">Unidades x Bulto</th>
                                        <th className="px-6 py-4 text-center">x Bulto</th>
                                        <th className="px-6 py-4 text-center">x Unidad</th>
                                        <th className="px-6 py-4 text-center">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {groupedItems[category].map(item => {
                                        const subtotal = calculateItemTotal(item);
                                        const isEditingUnits = editingPackUnits === item.name;

                                        return (
                                            <tr key={item.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase">{item.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isEditingUnits ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <input
                                                                type="number"
                                                                className="w-16 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-center font-bold text-xs p-1"
                                                                defaultValue={item.packUnits || 1}
                                                                id={`pu-${item.id}`}
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const val = document.getElementById(`pu-${item.id}`).value;
                                                                    updateCatalogItem(item.id, { packUnits: parseInt(val) || 1 });
                                                                    setEditingPackUnits(null);
                                                                }}
                                                                className="text-emerald-500"
                                                            >
                                                                <Save size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 group">
                                                            <span className="font-black text-sm text-slate-400">{item.packUnits || 1}</span>
                                                            <button onClick={() => setEditingPackUnits(item.name)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                                                                <Edit2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-black text-slate-700 dark:text-white p-2 shadow-inner"
                                                        placeholder="0"
                                                        value={inputs[item.name]?.bultos || ''}
                                                        onChange={(e) => handleInputChange(item.name, 'bultos', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-black text-slate-700 dark:text-white p-2 shadow-inner"
                                                        placeholder="0"
                                                        value={inputs[item.name]?.units || ''}
                                                        onChange={(e) => handleInputChange(item.name, 'units', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-black text-lg ${subtotal > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                                                        {subtotal}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ))}
            </div>

            {/* Floating Summary Bar */}
            {activeAdjustmentsCount > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 z-[100] border-4 border-white dark:border-slate-800 min-w-[500px]">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black opacity-50 tracking-widest leading-none mb-1">Items en Boleta</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black">{totalUnits}</span>
                            <span className="text-sm font-bold opacity-70">Unidades Totales</span>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-white/10"></div>

                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => setInputs({})}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all text-sm font-bold"
                        >
                            <Trash2 size={18} className="text-slate-400" /> Limpiar
                        </button>
                        <button
                            onClick={processOrder}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <CheckCircle size={24} /> CARGAR PEDIDO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-icons
const Truck = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
);
