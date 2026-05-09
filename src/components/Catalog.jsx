import React, { useState } from 'react';
import { useStore } from '../hooks/useStore.jsx';
import { Search, Plus, Check, X, BookOpen, Settings, List, Save, Edit2, Trash2, UploadCloud, FileSpreadsheet, RotateCcw, Box } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { normalize, formatCurrency } from '../utils/formatters';
import CatalogFixer from './CatalogFixer';

export default function Catalog() {
    const {
        catalog, addToCatalog, updateCatalogItem, removeFromCatalog,
        categories, addCategory, removeCategory, uploadImage, fixCatalogNames
    } = useStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [editingId, setEditingId] = useState(null);
    const [tempData, setTempData] = useState({});

    // New item state
    const [isAdding, setIsAdding] = useState(false);
    const [isManagingCats, setIsManagingCats] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    const isEditing = editingId !== null;
    const [fileError, setFileError] = useState(null);
    const [uploadingId, setUploadingId] = useState(null);

    const [newItem, setNewItem] = useState({
        name: '', barcode: '', category: categories[0] || 'General',
        costPrice: '', price: '', packUnits: 1, minStock: 5,
        image: '', bonusPoints: 0, pointsEarnedRatio: 1
    });

    const compressImage = async (file, maxMB = 1) => {
        // If file is already small enough, just return it
        if (file.size <= maxMB * 1024 * 1024) return file;
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000;
                    const MAX_HEIGHT = 1000;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (!blob) return resolve(file);
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
                        resolve(newFile);
                    }, 'image/jpeg', 0.8);
                };
            };
        });
    };

    const handleImageUpload = async (e, targetStateSetter, currentData) => {
        const file = e.target.files[0];
        if (!file) return;
        const compressedFile = await compressImage(file, 1); // Compress if > 1MB
        const publicUrl = await uploadImage(compressedFile);
        if (publicUrl) targetStateSetter({ ...currentData, image: publicUrl });
    };

    const handleInlineImageUpload = async (e, item) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingId(item.id);
        try {
            const compressedFile = await compressImage(file, 1); // Compress if > 1MB
            const publicUrl = await uploadImage(compressedFile);
            if (publicUrl) {
                updateCatalogItem(item.id, { image: publicUrl });
            }
        } finally {
            setUploadingId(null);
        }
    };

    const filtered = catalog.filter(item => {
        const isExact = searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length > 2;
        const cleanSearch = isExact ? searchTerm.slice(1, -1) : searchTerm;
        const searchTerms = normalize(cleanSearch).split(" ").filter(t => t);
        const itemName = normalize(item.name);
        const itemBarcode = item.barcode ? normalize(item.barcode) : '';
        if (isExact) return itemName === normalize(cleanSearch) || itemBarcode === normalize(cleanSearch);
        const matchesSearch = searchTerms.every(term => itemName.includes(term) || itemBarcode.includes(term));
        const matchesCategory = filterCategory === 'Todas' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.name) return;
        addToCatalog(newItem);
        setNewItem({
            name: '', barcode: '', category: categories[0] || 'General',
            costPrice: '', price: '', packUnits: 1, minStock: 5,
            image: '', bonusPoints: 0, pointsEarnedRatio: 1
        });
        setIsAdding(false);
    };

    const handleExportExcel = () => {
        const data = filtered.map(item => ({
            'Nombre': item.name, 'Código': item.barcode || '-', 'Categoría': item.category,
            'Costo Neto': item.costPrice || 0, 'Precio Venta': item.price || 0,
            'Unidades x Bulto': item.packUnits || 1, 'Stock Mínimo': item.minStock || 5
        }));
        exportToExcel(data, `Catalogo_${new Date().toISOString().split('T')[0]}`, 'Catalogo');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-indigo-500" />
                            Catálogo de Productos
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Administra los detalles de tus productos aquí.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => fixCatalogNames()}
                            id="btn-fix-catalog"
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-sm font-bold text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            🔥 REPARAR CATALOGO Y CATEGORIAS
                        </button>

                        <button
                            onClick={() => setBulkModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition-all shadow-sm text-gray-700 dark:text-slate-200 font-medium text-sm"
                        >
                            <UploadCloud className="w-4 h-4" />
                            Importar Fotos
                        </button>

                        <button
                            onClick={() => setIsManagingCats(!isManagingCats)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition-all shadow-sm text-gray-700 dark:text-slate-200 font-medium text-sm"
                        >
                            <Settings className="w-4 h-4" />
                            Categorías
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all font-medium text-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar Excel
                        </button>

                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none font-bold text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Producto
                        </button>
                    </div>
                </div>

                {/* MODAL CATEGORIAS */}
                {isManagingCats && (
                    <div className="mb-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Gestionar Categorías</h3>
                            <button onClick={() => setIsManagingCats(false)}><X className="w-4 h-4 text-slate-400" /></button>
                        </div>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="Nueva Categoría..."
                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button
                                onClick={() => { addCategory(newCatName); setNewCatName(''); }}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase"
                            >
                                AGREGAR
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.sort().map(cat => (
                                <div key={cat} className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-xs text-slate-700 dark:text-slate-300">
                                    <span>{cat}</span>
                                    <button onClick={() => removeCategory(cat)} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* FILTROS Y BUSCADOR */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-w-[200px]"
                    >
                        <option value="Todas">Todas</option>
                        {categories.sort().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                {/* TABLA DE PRODUCTOS */}
                <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 w-16 text-center">Img</th>
                                <th className="px-4 py-3 w-16 text-center">ID</th>
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3 text-right">Costo Neto</th>
                                <th className="px-4 py-3 text-right">U x Bulto</th>
                                <th className="px-4 py-3 text-center">Ratio Pts</th>
                                <th className="px-4 py-3 text-center">Min. Stock</th>
                                <th className="px-4 py-3 text-right">Precio Venta</th>
                                <th className="px-4 py-3 text-right w-24 sticky right-0 bg-slate-100 dark:bg-slate-800 z-10 shadow-l">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filtered.length > 0 ? (
                                filtered.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <label className="relative cursor-pointer group flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden border border-transparent hover:border-indigo-400 transition-colors" title="Cambiar Foto">
                                                {uploadingId === item.id ? (
                                                    <span className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></span>
                                                ) : item.image ? (
                                                    <>
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                                                            <UploadCloud className="w-4 h-4 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <UploadCloud className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 mb-0.5" />
                                                        <span className="text-[7px] text-slate-400 font-bold leading-none uppercase">Foto</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleInlineImageUpload(e, item)} disabled={uploadingId === item.id} />
                                            </label>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${item.id?.toString().match(/^\d+$/) ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-400'}`}>
                                                #{item.id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {editingId === item.id ? (
                                                <input type="text" value={tempData.barcode || ''} onChange={(e) => setTempData({ ...tempData, barcode: e.target.value })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs" />
                                            ) : (item.barcode || '-')}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                                            {editingId === item.id ? (
                                                <input type="text" value={tempData.name || ''} onChange={(e) => setTempData({ ...tempData, name: e.target.value.toUpperCase() })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded" />
                                            ) : item.name}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {editingId === item.id ? (
                                                <select value={tempData.category || ''} onChange={(e) => setTempData({ ...tempData, category: e.target.value })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded">
                                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            ) : item.category}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {editingId === item.id ? (
                                                <input type="number" step="0.01" value={tempData.costPrice || ''} onChange={(e) => setTempData({ ...tempData, costPrice: e.target.value })} className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-right" />
                                            ) : formatCurrency(item.costPrice || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs">
                                            {editingId === item.id ? (
                                                <input type="number" value={tempData.packUnits || 1} onChange={(e) => setTempData({ ...tempData, packUnits: Number(e.target.value) })} className="w-12 px-2 py-1 bg-white border border-slate-200 rounded text-right" />
                                            ) : `x${item.packUnits || 1}`}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs">
                                            {editingId === item.id ? (
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={tempData.pointsEarnedRatio !== undefined ? tempData.pointsEarnedRatio : 1}
                                                    onChange={(e) => setTempData({ ...tempData, pointsEarnedRatio: Number(e.target.value) })}
                                                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-center"
                                                />
                                            ) : (
                                                `x${item.pointsEarnedRatio !== undefined ? item.pointsEarnedRatio : 1}`
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">
                                            {editingId === item.id ? (
                                                <input type="number" value={tempData.minStock || 5} onChange={(e) => setTempData({ ...tempData, minStock: Number(e.target.value) })} className="w-12 px-2 py-1 bg-white border border-slate-200 rounded text-center" />
                                            ) : (item.minStock || 5)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                            {editingId === item.id ? (
                                                <input type="number" step="0.01" value={tempData.price || ''} onChange={(e) => setTempData({ ...tempData, price: e.target.value })} className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-right" />
                                            ) : formatCurrency(item.price || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right sticky right-0 bg-white dark:bg-slate-900 shadow-l">
                                            <div className="flex justify-end gap-1">
                                                {editingId === item.id ? (
                                                    <>
                                                        <button onClick={() => { updateCatalogItem(item.id, tempData); setEditingId(null); }} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-400 text-white rounded-lg hover:bg-slate-500"><X className="w-4 h-4" /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setEditingId(item.id); setTempData({ ...item }); }} className="p-1.5 text-slate-400 hover:text-indigo-500"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => { if (window.confirm('¿Borrar producto?')) removeFromCatalog(item.id); }} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="11" className="px-4 py-10 text-center text-slate-400 italic">No se encontraron productos</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL NUEVO PRODUCTO (MINIMIZADO PARA ESTE EDIT) */}
            {isAdding && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Plus className="w-6 h-6 text-indigo-500" />
                                Nuevo Producto
                            </h3>
                            <button onClick={() => setIsAdding(false)}><X className="w-6 h-6 text-slate-400 hover:text-slate-600 transition-colors" /></button>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                        {newItem.image ? <img src={newItem.image} className="w-full h-full object-cover" /> : <UploadCloud className="w-6 h-6 text-slate-300" />}
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Foto del Producto (Opcional)</label>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewItem, newItem)} className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 cursor-pointer w-full" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Producto</label>
                                    <input type="text" required value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
                                    <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Código (Barcode)</label>
                                    <input type="text" value={newItem.barcode} onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Costo Neto</label>
                                    <input type="number" step="0.01" value={newItem.costPrice} onChange={(e) => setNewItem({ ...newItem, costPrice: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Precio de Venta</label>
                                    <input type="number" step="0.01" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unidades x Bulto</label>
                                    <input type="number" value={newItem.packUnits} onChange={(e) => setNewItem({ ...newItem, packUnits: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ratio de Puntos</label>
                                    <input type="number" step="0.1" value={newItem.pointsEarnedRatio} onChange={(e) => setNewItem({ ...newItem, pointsEarnedRatio: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all">CREAR PRODUCTO</button>
                                <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all">CANCELAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
