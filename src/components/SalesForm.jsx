import React, { useState } from 'react';
import { TrendingUp, Save } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { printTicket } from '../utils/ticketPrinter';

export default function SalesForm({ onSave, inventory }) {
    const [date, setDate] = useState('');
    const [items, setItems] = useState([{ name: '', quantity: 1 }]);

    // Filter accessible products from inventory for autocomplete (simple implementation)
    const productOptions = inventory.map(p => p.name);

    const addItem = () => setItems([...items, { name: '', quantity: 1 }]);

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!date || items.length === 0) return;

        // We need to resolve names to categories if possible, or just store name
        // For this simple version, we assume user types name exactly or we match it
        const enrichedItems = items.map(item => {
            // Try to find exact match first (if user selected from list "Name - Category" or similar, 
            // but we are using just Name in value.
            // Better strategy: The user selects "Name". If "Name" is duplicated, we have ambiguity.
            // But we changed getInventory to rely on Category - Name key.
            // SalesForm needs to capture Category.

            // For now, let's find the product in inventory that matches the name. 
            // If multiple, default to first or ideally ask. 
            // Improved: finding by name check.
            const invItem = inventory.find(i => i.name === item.name);
            return {
                ...item,
                category: invItem ? invItem.category : 'General'
            };
        });

        onSave({
            date,
            items: enrichedItems,
            paymentMethod: 'Efectivo', // Default for now
            totalAmount: 0 // Calc if we had prices
        });

        // Print Ticket
        // Note: In real world we need specific prices per item to print nicely.
        // For now we print what we have.
        try {
            printTicket({
                date,
                items: enrichedItems,
                paymentMethod: 'Efectivo',
                totalAmount: 0
            });
        } catch (e) {
            console.error("Printing failed", e);
        }

        setDate('');
        setItems([{ name: '', quantity: 1 }]);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
                <TrendingUp className="text-brand-500" />
                Registrar Ventas
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Período / Fecha</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-slate-200"
                    />
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 items-end">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Producto</label>
                                <input
                                    type="text"
                                    list="inventory-suggestions"
                                    placeholder="Buscar producto..."
                                    value={item.name}
                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded border border-slate-200"
                                />
                            </div>
                            <div className="w-24">
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Cant.</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.25"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded border border-slate-200 text-center"
                                />
                            </div>
                            <button type="button" onClick={() => removeItem(index)} className="text-red-400 font-bold px-2 py-2 hover:bg-red-50 rounded">X</button>
                        </div>
                    ))}
                    <datalist id="inventory-suggestions">
                        {inventory.map((p, i) => (
                            <option key={i} value={p.name}>{p.category}</option>
                        ))}
                    </datalist>
                    <button type="button" onClick={addItem} className="text-brand-600 text-sm font-medium">+ Agregar otro</button>
                </div>

                <div className="pt-4 flex justify-end">
                    <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-xl">Guardar Venta</button>
                </div>
            </form>
        </div>
    );
}
