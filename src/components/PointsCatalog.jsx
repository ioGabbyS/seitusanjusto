import React, { useState } from 'react';
import { Gift, Plus, Trash2, Edit2, Star, Box, Search, UploadCloud } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';

// Note: We now receive rewards and methods as props from App.jsx to ensure Single Source of Truth
export default function PointsCatalog({ rewards, addReward, updateReward, deleteReward, uploadImage }) {
    // const { rewards, addReward, updateReward, deleteReward, uploadImage } = useStore(); // REMOVED
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [importQueue, setImportQueue] = useState([]); // Array of { name, status }
    const [isImporting, setIsImporting] = useState(false);

    // Hidden input ref
    const fileInputRef = React.useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Puntos',
        pointCost: 0,
        stock: 0,
        image: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateReward(editingId, formData);
            setEditingId(null);
        } else {
            addReward(formData);
        }
        setFormData({ name: '', category: 'Puntos', pointCost: 0, stock: 0, image: '' });
        setIsAdding(false);
    };

    const handleEdit = (reward) => {
        setFormData(reward);
        setEditingId(reward.id);
        setIsAdding(true);
    };

    const handleBulkImport = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsImporting(true);
        setImportQueue(files.map(f => ({ name: f.name, status: 'pending' })));

        let completed = 0;
        let errors = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Update current status
            setImportQueue(prev => prev.map((item, idx) =>
                idx === i ? { ...item, status: 'processing' } : item
            ));

            try {
                // 1. Upload Image
                const publicUrl = await uploadImage(file);

                if (publicUrl) {
                    // 2. Create Reward Name (remove extension and capitalize)
                    const rawName = file.name.replace(/\.[^/.]+$/, ""); // remove extension
                    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

                    // 3. Add to Store
                    addReward({
                        name: name,
                        category: 'Puntos',
                        pointCost: 0, // Default to 0, user edits later
                        stock: 1,     // Default to 1
                        image: publicUrl
                    });

                    setImportQueue(prev => prev.map((item, idx) =>
                        idx === i ? { ...item, status: 'success' } : item
                    ));
                    completed++;
                } else {
                    throw new Error("Upload failed");
                }
            } catch (err) {
                console.error(`Error importing ${file.name}:`, err);
                errors++;
                setImportQueue(prev => prev.map((item, idx) =>
                    idx === i ? { ...item, status: 'error' } : item
                ));
            }
        }

        alert(`Importación finalizada: ${completed} premios creados.${errors > 0 ? ` ${errors} errores.` : ''}`);
        setIsImporting(false);
        setImportQueue([]);
        e.target.value = ''; // Reset input
    };

    const filteredRewards = rewards.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                        <Gift className="text-brand-500" size={32} />
                        Tienda de Puntos
                    </h1>
                    <p className="text-slate-500 font-medium">Gestiona los premios y canjes disponibles</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleBulkImport}
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        disabled={isImporting}
                        className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        {isImporting ? (
                            <span className="animate-pulse">Importando...</span> // Simple loading state
                        ) : (
                            <><UploadCloud size={20} /> Importación Masiva</>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setIsAdding(!isAdding);
                            setEditingId(null);
                            setFormData({ name: '', category: 'Puntos', pointCost: 0, stock: 0, image: '' });
                        }}
                        className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        {isAdding ? 'Cerrar Panel' : <><Plus size={20} /> Nuevo Premio</>}
                    </button>
                </div>
            </div>

            {/* Import Progress Overlay/Indicator (Optional but helpful) */}
            {isImporting && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-blue-800">Procesando imágenes...</p>
                        <p className="text-xs text-blue-600">
                            {importQueue.filter(i => i.status === 'success').length} completados,
                            {importQueue.filter(i => i.status === 'pending' || i.status === 'processing').length} restantes
                        </p>
                    </div>
                </div>
            )}

            {/* Form Panel */}
            {isAdding && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl animate-in zoom-in-95 duration-200">
                    <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                        {editingId ? <Edit2 size={20} className="text-brand-500" /> : <Plus size={20} className="text-brand-500" />}
                        {editingId ? 'Editar Premio' : 'Agregar Nuevo Premio'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-4 flex justify-center mb-4">
                            <label className="cursor-pointer w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:bg-slate-100 hover:border-brand-300 transition-all group relative">
                                {formData.image ? (
                                    <div className="relative w-full h-full">
                                        <img src={formData.image} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs">Cambiar</div>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud size={24} className="text-slate-400 mb-2" />
                                        <span className="text-xs text-slate-400 font-bold">Subir Foto</span>
                                    </>
                                )}
                                {/* Simple URL Input fallback or file reader? Let's use URL for now as per plan "Add an 'Image URL' input field", BUT user said "agregar productos... y que se vean... como se podria hacer?" and previous conversation used base64. Let's stick to Base64 for consistency with Catalog, using a hidden file input */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const publicUrl = await uploadImage(file);
                                            if (publicUrl) {
                                                setFormData({ ...formData, image: publicUrl });
                                            }
                                        }
                                    }}
                                />
                            </label>
                            <div className="ml-4 flex-1">
                                <label className="block text-xs font-black text-slate-500 uppercase mb-1">O pegar URL de imagen</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    value={formData.image && formData.image.startsWith('http') ? formData.image : ''}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Recomendado: Imágenes cuadradas (1:1)</p>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Nombre del Premio</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                placeholder="Ej: 1/4 Kg Helado Art."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Costo en Puntos</label>
                            <div className="relative">
                                <Star className="absolute left-3 top-2.5 text-amber-500" size={18} />
                                <input
                                    required
                                    type="number"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-amber-600"
                                    value={formData.pointCost}
                                    onChange={e => setFormData({ ...formData, pointCost: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Stock Disponible</label>
                            <div className="relative">
                                <Box className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    required
                                    type="number"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-4 flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-brand-500 text-white px-8 py-2 rounded-xl font-bold hover:bg-brand-600 transition-all shadow-md shadow-brand-100"
                            >
                                {editingId ? 'Guardar Cambios' : 'Crear Premio'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Header & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                        placeholder="Buscar por nombre o categoría..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                    <span className="text-xs font-black text-slate-400 uppercase">Total:</span>
                    <span className="font-bold text-slate-700">{rewards.length} premios</span>
                </div>
            </div>

            {/* Grid of Rewards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredRewards.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 italic text-slate-400">
                        {searchTerm ? 'No se encontraron premios que coincidan con la búsqueda' : 'No hay premios registrados. ¡Crea el primero!'}
                    </div>
                ) : (
                    filteredRewards.map(reward => (
                        <div key={reward.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            {/* Image Header */}
                            <div className="h-32 bg-slate-50 overflow-hidden relative rounded-xl">
                                {reward.image ? (
                                    <img src={reward.image} alt={reward.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Gift size={48} opacity={0.2} />
                                    </div>
                                )}
                                <div className="absolute top-0 right-0 p-3">
                                    <div className="bg-white/90 backdrop-blur text-amber-600 px-3 py-1 rounded-full font-black text-xs flex items-center gap-1 shadow-sm">
                                        <Star size={12} fill="currentColor" />
                                        {reward.pointCost} pts
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-brand-600 transition-colors line-clamp-1">{reward.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{reward.category}</p>

                                <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                        <Box size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold">Stock: {reward.stock}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(reward)}
                                            className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('¿Eliminar este premio?')) deleteReward(reward.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
