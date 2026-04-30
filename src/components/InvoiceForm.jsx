import React, { useState } from 'react';
import { Plus, Trash2, Save, FileText, Upload, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx'; // Import Store
import { parseInvoicePDF } from '../utils/pdfParser';
import { normalize } from '../utils/formatters';

export default function InvoiceForm({ onSave }) {
    const { catalog, categories } = useStore(); // Get dynamic catalog and categories
    const [date, setDate] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');

    // Items in the invoice
    const [items, setItems] = useState([]);

    // Taxes and Perceptions
    const [perceptions, setPerceptions] = useState(0);
    const [applyIVA, setApplyIVA] = useState(true);

    // Historical Mode
    const [isHistorical, setIsHistorical] = useState(false);


    // Filter products for the grid
    const filteredProducts = catalog.filter(item => {
        const searchTerms = normalize(searchTerm).split(" ").filter(t => t); // Split and remove empty
        const itemName = normalize(item.name);
        const matchesSearch = searchTerms.every(term => itemName.includes(term));
        const matchesCategory = filterCategory === 'Todas' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const addToInvoice = (product) => {
        // Check if already in items
        const existingIndex = items.findIndex(i => i.name === product.name);

        if (existingIndex !== -1) {
            // Increment duplicate? or just highlight? Let's increment
            const newItems = [...items];
            newItems[existingIndex].quantity += 1;
            setItems(newItems);
        } else {
            // Add new
            setItems([...items, {
                name: product.name,
                category: product.category,
                quantity: 1,
                packUnits: product.packUnits || 1, // Default from catalog
                price: product.costPrice || 0 // Auto-fill stored Net Cost
            }]);
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Calculations
    const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price)), 0);
    const ivaAmount = applyIVA ? subtotal * 0.21 : 0;
    const finalTotal = subtotal + ivaAmount + Number(perceptions);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!date || items.length === 0) {
            alert("Ingresa Fecha y al menos 1 producto.");
            return;
        }

        onSave({
            date,
            invoiceNumber,
            items,
            subtotal,
            ivaAmount,
            perceptions: Number(perceptions),
            total: finalTotal,
            isHistorical // Flag to skip stock update
        });

        // Reset
        setDate('');
        setInvoiceNumber('');
        setItems([]);
        setPerceptions(0);
        setApplyIVA(true);
        setIsHistorical(false);
        alert("Factura Guardada Correctamente");
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* LEFT: Product Selector (Visual) */}
            <div className="lg:w-3/5 flex flex-col gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-full">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Seleccionar Productos</h3>
                    <div className="text-xs text-slate-400">{filteredProducts.length} productos</div>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm max-w-[150px]"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="Todas">Todas</option>
                        {categories.sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToInvoice(product)}
                                className="flex flex-col items-center p-3 rounded-xl border border-slate-100 hover:border-brand-500 hover:bg-brand-50 transition-all text-center group bg-white h-auto"
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                                    {product.image ? (
                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-slate-300">
                                            {product.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-slate-700 group-hover:text-brand-700 line-clamp-2 leading-tight">
                                    {product.name}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1">{product.category}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: Invoice Details (Form) */}
            <div className="lg:w-2/5 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl p-4 h-full shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="text-brand-500" /> Nueva Factura
                </h3>

                {/* Header Inputs */}
                <div className="grid grid-cols-2 gap-3 mb-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full text-xs font-medium p-1 border-b border-slate-200 outline-none focus:border-brand-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">N° Factura</label>
                        <input
                            type="text"
                            placeholder="0001-XXXX"
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                            className="w-full text-xs font-medium p-1 border-b border-slate-200 outline-none focus:border-brand-500"
                        />
                    </div>
                </div>

                {/* HISTORICAL MODE TOGGLE */}
                <div className="mb-4 bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={isHistorical}
                        onChange={e => setIsHistorical(e.target.checked)}
                        className="mt-1 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        id="historical-check"
                    />
                    <div>
                        <label htmlFor="historical-check" className="text-xs font-bold text-amber-900 block cursor-pointer">
                            Carga Histórica (No sumar Stock)
                        </label>
                        <p className="text-[10px] text-amber-700 leading-tight mt-0.5">
                            Actívalo para cargar facturas viejas solo para estadísticas. No afectará tu inventario actual.
                        </p>
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto mb-4 pr-1">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <Plus size={48} />
                            <p className="text-sm mt-2 text-center">Selecciona productos de la lista<br />para agregarlos a la factura</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item, idx) => {
                                const totalUnits = item.quantity * item.packUnits;
                                const unitCostWithTax = (item.price * 1.21) / item.packUnits;

                                return (
                                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2 animate-in slide-in-from-right-2">
                                        {/* Header: Name & Cat */}
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate">{item.category}</div>
                                            </div>
                                            <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Inputs Row */}
                                        <div className="flex gap-2 items-end">
                                            {/* Qty */}
                                            <div className="w-16">
                                                <label className="text-[9px] text-center block text-slate-400 font-bold">Bultos</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                    className="w-full text-xs text-center border rounded-lg bg-slate-50 py-1.5 focus:ring-2 focus:ring-brand-100 outline-none border-slate-200"
                                                />
                                            </div>

                                            <div className="text-slate-300 pb-2">x</div>

                                            {/* Pack Units */}
                                            <div className="w-14">
                                                <label className="text-[9px] text-center block text-slate-400 font-bold">U.xBulto</label>
                                                <input
                                                    type="number"
                                                    value={item.packUnits}
                                                    onChange={e => updateItem(idx, 'packUnits', e.target.value)}
                                                    className="w-full text-xs text-center border rounded-lg bg-slate-50 py-1.5 focus:ring-2 focus:ring-brand-100 outline-none border-slate-200"
                                                />
                                            </div>

                                            <div className="text-slate-300 pb-2">=</div>

                                            {/* Total Units Display */}
                                            <div className="w-16 pb-1.5">
                                                <label className="text-[9px] text-center block text-slate-400 font-bold">Total Unid.</label>
                                                <div className="text-xs font-bold text-brand-600 text-center">{totalUnits}</div>
                                            </div>

                                            {/* Cost */}
                                            <div className="flex-1">
                                                <label className="text-[9px] text-right block text-slate-400 font-bold">$ Neto Bulto</label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={e => updateItem(idx, 'price', e.target.value)}
                                                        className="w-full text-xs text-right border rounded-lg bg-slate-50 py-1.5 pl-6 pr-2 focus:ring-2 focus:ring-brand-100 outline-none border-slate-200 font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer: Real Calc */}
                                        <div className="bg-brand-50 rounded-lg p-2 flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-brand-700 uppercase">Costo Final Unitario (c/IVA):</span>
                                            <span className="text-xs font-bold text-brand-800">${unitCostWithTax.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* SUMMARY & TAXES */}
                <div className="mt-auto bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Subtotal Neto:</span>
                        <span className="font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* IVA Toggle */}
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applyIVA}
                                onChange={e => setApplyIVA(e.target.checked)}
                                className="rounded text-brand-600 focus:ring-brand-500"
                            />
                            <span>IVA (21%)</span>
                        </label>
                        <span className="font-medium text-slate-600">${ivaAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Perceptions */}
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Perc. IIBB / Otros:</span>
                        <input
                            type="number"
                            value={perceptions}
                            onChange={e => setPerceptions(e.target.value)}
                            className="w-20 text-right text-xs border-b border-slate-300 outline-none p-0 focus:border-brand-500"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Total Final */}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 mt-2">
                        <span className="text-sm font-bold text-slate-800">TOTAL FACTURA:</span>
                        <span className="text-lg font-bold text-brand-700">
                            ${finalTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={items.length === 0 || !date}
                        className={`w-full py-3 rounded-lg font-bold shadow-md transition-all flex justify-center items-center gap-2 mt-4 ${items.length > 0 && date
                            ? 'bg-brand-600 text-white hover:bg-brand-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <Save size={18} /> CONFIRMAR CARGA
                    </button>
                </div>
            </div>
        </div >
    );
}
