import React, { useState, useEffect } from 'react';
import { Sun, Download, Upload, AlertTriangle, Database, Trash2, HardDrive, PackageCheck, Star, Users, RefreshCw, Wrench, RotateCcw, Instagram, MessageCircle, Facebook, Plus, Youtube, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { INITIAL_PRODUCTS } from '../data/products.js';
import { supabase } from '../utils/supabaseClient';
import CatalogFixer from './CatalogFixer';

const StockTool = () => {
    const { catalog, categories, updateWholeCatalog, inventory } = useStore();
    const [selectedCat, setSelectedCat] = useState(categories[0] || 'Cafetería');
    const [targetStock, setTargetStock] = useState(10000);

    const applyStock = () => {
        if (!window.confirm(`¿Estás SEGURO de establecer el stock de TODA la categoría "${selectedCat}" a ${targetStock} unidades?`)) return;

        let count = 0;
        const targetNumber = Number(targetStock);

        // Prepare new catalog
        const newCatalog = catalog.map(item => {
            if (item.category === selectedCat) {
                // Find this item in inventory to get its totalPurchased/totalSold
                // Inventory keys are "Category - Name"
                const invKey = `${item.category} - ${item.name}`;
                const invItem = inventory.find(i => `${i.category} - ${i.name}` === invKey);

                if (invItem) {
                    // Formula: baseQuantity = targetStock - totalPurchased + totalSold
                    const newBaseQty = targetNumber - (invItem.totalPurchased || 0) + (invItem.totalSold || 0);
                    count++;
                    return { ...item, quantity: newBaseQty };
                }
            }
            return item;
        });

        updateWholeCatalog(newCatalog);
        alert(`¡Listo! Se actualizó el stock de ${count} productos en "${selectedCat}".`);
    };

    return (
        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                <PackageCheck size={20} /> Asignación Masiva de Stock
            </h3>
            <p className="text-sm text-emerald-800 mb-4">
                Usa esto para "resetear" el stock de una categoría completa (ej: Cafetería) a un número fijo.
            </p>


            <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-emerald-700 block mb-1">Categoría</label>
                    <select
                        value={selectedCat}
                        onChange={e => setSelectedCat(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="w-full sm:w-32">
                    <label className="text-xs font-bold text-emerald-700 block mb-1">Stock Objetivo</label>
                    <input
                        type="number"
                        value={targetStock}
                        onChange={e => setTargetStock(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white"
                    />
                </div>
                <button
                    onClick={applyStock}
                    className="w-full sm:w-auto bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 shadow-sm whitespace-nowrap"
                >
                    APLICAR
                </button>
            </div>
        </div>
    );
};

const LoyaltySettings = () => {
    const { settings, updateGlobalSettings } = useStore();
    const [ratio, setRatio] = useState(settings?._global?.pointRatio || 100);

    const handleSave = () => {
        updateGlobalSettings({ pointRatio: Number(ratio) });
        alert('✅ Configuración de puntos actualizada.');
    };

    return (
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <Star size={20} /> Configuración de Puntos
            </h3>
            <p className="text-sm text-amber-800 mb-4">
                Define cuántos pesos (ARS) equivalen a 1 punto.
            </p>

            <div className="flex items-end gap-3 max-w-sm">
                <div className="flex-1">
                    <label className="text-xs font-bold text-amber-700 block mb-1">Pesos por 1 Punto</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-amber-500 font-bold">$</span>
                        <input
                            type="number"
                            value={ratio}
                            onChange={e => setRatio(e.target.value)}
                            className="w-full pl-6 pr-3 py-2 rounded-lg border border-amber-200 bg-white font-bold text-amber-900"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 shadow-sm"
                >
                    GUARDAR
                </button>
            </div>
            <p className="text-xs text-amber-600 mt-2">
                Ejemplo: Si pones <strong>100</strong>, una compra de $1.000 generará <strong>10 puntos</strong>.
            </p>
        </div>
    );
};

// --- NEW ROW: SESSION MANAGER ---
const SessionManager = () => {
    const { sessions, deleteSession } = useStore();
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    const handleDelete = async (id, cashier, date) => {
        if (window.confirm(`⚠️ ¿Estás seguro de eliminar el turno de "${cashier}" del ${new Date(date).toLocaleString()}?\n\nEsta acción es irreversible y borrará el turno de la nube.`)) {
            const result = await deleteSession(id);
            if (result.success) {
                // alert('✅ Turno eliminado');
            } else {
                alert('❌ Error: ' + result.error);
            }
        }
    };

    return (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Trash2 size={20} /> Gestión de Turnos (Borrado Manual)
            </h3>
            <p className="text-sm text-slate-600 mb-4">
                Aquí puedes eliminar turnos de prueba individualmente.
            </p>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600 font-bold text-xs uppercase sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left">Fecha</th>
                            <th className="px-4 py-2 text-left">Cajero</th>
                            <th className="px-4 py-2 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedSessions.map(s => (
                            <tr key={s.id} className="hover:bg-red-50 transition-colors">
                                <td className="px-4 py-2 text-slate-600">
                                    {new Date(s.startedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 font-medium text-slate-800">
                                    {s.cashier}
                                    {s.endedAt ? '' : <span className="text-xs ml-2 text-green-600 font-bold">(Activo)</span>}
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <button
                                        onClick={() => handleDelete(s.id, s.cashier, s.startedAt)}
                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded"
                                        title="Eliminar este turno permanentemente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StaffManager = () => {
    const { staffUsers, addStaffUser, deleteStaffUser } = useStore();
    const [newName, setNewName] = useState('');
    const [newPass, setNewPass] = useState('');

    const handleAdd = () => {
        if (!newName || !newPass) return;
        addStaffUser(newName, newPass);
        setNewName('');
        setNewPass('');
        alert('✅ Personal añadido correctamente.');
    };

    return (
        <div className="p-6 bg-orange-50 border border-orange-100 rounded-xl">
            <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                <Users size={20} /> Gestión de Personal (Reposición)
            </h3>
            <p className="text-sm text-orange-800 mb-4">
                Crea claves individuales para que cada empleado tenga su propio acceso y sepas quién hace los cambios.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div>
                    <label className="text-xs font-bold text-orange-700 block mb-1">Nombre</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Ej: Juan"
                        className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-orange-700 block mb-1">Clave de Acceso</label>
                    <input
                        type="text"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        placeholder="Ej: 1234"
                        className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleAdd}
                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 shadow-sm"
                    >
                        AÑADIR PERSONAL
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-orange-100 text-orange-600 font-bold text-xs uppercase">
                        <tr>
                            <th className="px-4 py-2 text-left">Nombre</th>
                            <th className="px-4 py-2 text-left">Clave</th>
                            <th className="px-4 py-2 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                        {staffUsers.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-4 py-4 text-center text-orange-300 italic">No hay personal configurado. Usa el bypass "helados2026" o crea uno nuevo arriba.</td>
                            </tr>
                        ) : staffUsers.map(u => (
                            <tr key={u.id} className="hover:bg-orange-50/50">
                                <td className="px-4 py-2 font-bold text-orange-900">{u.name}</td>
                                <td className="px-4 py-2 text-orange-700 font-mono tracking-widest">{u.password}</td>
                                <td className="px-4 py-2 text-right">
                                    <button
                                        onClick={() => window.confirm(`¿Borrar acceso a "${u.name}"?`) && deleteStaffUser(u.id)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CatalogRestore = () => {
    const { updateWholeCatalog } = useStore();

    const handleRestore = async () => {
        if (window.confirm("⚠️ ¿Estás seguro de RESTAURAR EL CATÁLOGO ORIGINAL?\n\nEsto borrará productos creados manualmente y dejará solo la lista oficial (Helados + Cafetería) con sus precios base.\n\nEl stock y las ventas existentes SE MANTENDRÁN (se re-vincularán por nombre).")) {
            try {
                updateWholeCatalog(INITIAL_PRODUCTS);
                alert("✅ Catálogo restaurado correctamente (Helados + Cafetería).");
                window.location.reload();
            } catch (e) {
                alert("Error: " + e.message);
            }
        }
    };

    return (
        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <RefreshCw size={20} /> Restaurar Catálogo Oficial
            </h3>
            <p className="text-sm text-indigo-800 mb-4">
                Si borraste productos por error o no aparecen categorías (como Cafetería), usa esto para volver a cargar la lista completa de productos.
            </p>
            <button
                onClick={handleRestore}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2 w-full sm:w-auto justify-center"
            >
                <RefreshCw size={18} /> RESTAURAR LISTA DE PRODUCTOS
            </button>
        </div>
    );
};

const SocialManager = () => {
    const {
        socialLinks,
        updateSocialLinks,
        landingPosts,
        updateLandingPosts,
        uploadImage,
        promoBanner,
        updatePromoBanner
    } = useStore();

    const [editingLinks, setEditingLinks] = useState({ ...socialLinks });
    const [newPost, setNewPost] = useState({ img: '', label: '', url: '' });
    const [isUploading, setIsUploading] = useState(false);

    // PROMO BANNER STATE
    const [localPromo, setLocalPromo] = useState(promoBanner || { active: false, img: '', url: '' });

    useEffect(() => {
        setLocalPromo(promoBanner || { active: false, img: '', url: '' });
    }, [promoBanner]);

    const handleLinkSave = () => {
        updateSocialLinks(editingLinks);
        alert('✅ Enlaces de redes sociales actualizados.');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadImage(file);
            if (url) {
                setNewPost(prev => ({ ...prev, img: url }));
            }
        } catch (err) {
            alert("Error al subir imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddPost = () => {
        if (!newPost.img || !newPost.label) return;

        let finalImg = newPost.img;
        // Si es un link de Instagram, intentar convertirlo a imagen directa (mejorado)
        if (finalImg.includes('instagram.com/p/')) {
            const postId = finalImg.split('/p/')[1].split('/')[0];
            finalImg = `https://www.instagram.com/p/${postId}/media/?size=l`;
        }

        updateLandingPosts([...landingPosts, { ...newPost, img: finalImg, id: Date.now() }]);
        setNewPost({ img: '', label: '', url: '' });
    };

    const handleRemovePost = (id) => {
        updateLandingPosts(landingPosts.filter(p => p.id !== id));
    };

    const movePost = (index, direction) => {
        const newPosts = [...landingPosts];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newPosts.length) return;

        [newPosts[index], newPosts[targetIndex]] = [newPosts[targetIndex], newPosts[index]];
        updateLandingPosts(newPosts);
    };

    return (
        <div className="space-y-6">
            <div className="p-6 bg-pink-50 border border-pink-100 rounded-xl">
                <h3 className="font-bold text-pink-900 mb-4 flex items-center gap-2">
                    <Instagram size={20} /> Enlaces de Redes Sociales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-bold text-pink-700 block mb-1 uppercase tracking-wider">Instagram URL</label>
                        <input
                            type="text"
                            value={editingLinks.instagram}
                            onChange={e => setEditingLinks({ ...editingLinks, instagram: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-sm"
                            placeholder="https://instagram.com/..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-pink-700 block mb-1 uppercase tracking-wider">TikTok URL</label>
                        <input
                            type="text"
                            value={editingLinks.tiktok}
                            onChange={e => setEditingLinks({ ...editingLinks, tiktok: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-sm"
                            placeholder="https://tiktok.com/@..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-pink-700 block mb-1 uppercase tracking-wider">WhatsApp</label>
                        <input
                            type="text"
                            value={editingLinks.whatsapp}
                            onChange={e => setEditingLinks({ ...editingLinks, whatsapp: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-sm"
                            placeholder="54911..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-pink-700 block mb-1 uppercase tracking-wider">Facebook URL</label>
                        <input
                            type="text"
                            value={editingLinks.facebook}
                            onChange={e => setEditingLinks({ ...editingLinks, facebook: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-pink-200 bg-white text-sm"
                            placeholder="https://facebook.com/..."
                        />
                    </div>
                </div>
                <button
                    onClick={handleLinkSave}
                    className="bg-pink-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-pink-700 shadow-sm transition-all"
                >
                    GUARDAR ENLACES
                </button>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Star size={20} /> Galería de la Web (Instagram/TikTok)
                </h3>
                <p className="text-xs text-slate-500 mb-6">Gestiona las imágenes que aparecen en el carrusel de la página principal.</p>

                {/* Formulario Nueva Foto */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Nueva Publicación</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Imagen URL (Opcional si subís foto)</label>
                                <input
                                    type="text"
                                    value={newPost.img}
                                    onChange={e => setNewPost({ ...newPost, img: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">O Subir Foto desde tu equipo</label>
                                <input
                                    type="file"
                                    accept="image/*,video/mp4"
                                    onChange={handleFileUpload}
                                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200 w-full"
                                />
                                {isUploading && <div className="absolute right-3 bottom-2 animate-spin text-pink-500"><RefreshCw size={14} /></div>}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Etiqueta (Título)</label>
                                <input
                                    type="text"
                                    value={newPost.label}
                                    onChange={e => setNewPost({ ...newPost, label: e.target.value })}
                                    placeholder="Ej: Promo Pomelada"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Link al que lleva (Opcional)</label>
                                <input
                                    type="text"
                                    value={newPost.url}
                                    onChange={e => setNewPost({ ...newPost, url: e.target.value })}
                                    placeholder="https://instagram.com/..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleAddPost}
                        disabled={!newPost.img || !newPost.label}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Plus size={18} /> AÑADIR A LA GALERÍA
                    </button>
                </div>

                {/* Lista de Publicaciones */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {landingPosts.map((post, idx) => (
                        <div key={post.id} className="group relative aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                            <img src={post.img} className="w-full h-full object-cover" alt={post.label} referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-2 text-center">
                                <span className="text-white text-[10px] font-bold mb-2 uppercase tracking-tighter leading-none">{post.label}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => movePost(idx, -1)}
                                        disabled={idx === 0}
                                        className="p-1.5 bg-white/20 hover:bg-white text-slate-900 rounded-lg disabled:opacity-20 transition-all"
                                        title="Subir orden"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleRemovePost(post.id)}
                                        className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg"
                                        title="Borrar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => movePost(idx, 1)}
                                        disabled={idx === landingPosts.length - 1}
                                        className="p-1.5 bg-white/20 hover:bg-white text-slate-900 rounded-lg disabled:opacity-20 transition-all"
                                        title="Bajar orden"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="absolute top-2 left-2 w-5 h-5 bg-slate-900/80 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                                {idx + 1}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PROMO BANNER MANAGER */}
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                    <Sun size={20} className="text-amber-600" /> Pop-up Promocional (Ocasional)
                </h3>
                <p className="text-xs text-amber-600/80 mb-6 font-medium">Ventana emergente que aparece al entrar a la web. Ideal para anuncios temporales.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Controles */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setLocalPromo({ ...localPromo, active: !localPromo.active })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localPromo.active ? 'bg-amber-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localPromo.active ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-sm font-bold text-slate-700">
                                {localPromo.active ? 'POP-UP ACTIVADO' : 'POP-UP DESACTIVADO'}
                            </span>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">Imagen del Banner</label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={localPromo.img}
                                    onChange={e => setLocalPromo({ ...localPromo, img: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm bg-white"
                                    placeholder="https://..."
                                />
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*,video/mp4"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setIsUploading(true);
                                            try {
                                                const url = await uploadImage(file);
                                                if (url) setLocalPromo(prev => ({ ...prev, img: url }));
                                            } catch (err) {
                                                alert("Error al subir archivo");
                                            } finally {
                                                setIsUploading(false);
                                            }
                                        }}
                                        className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 w-full"
                                    />
                                    {isUploading && <div className="absolute right-3 bottom-2 animate-spin text-amber-500"><RefreshCw size={14} /></div>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Destino del Click (Opcional)</label>
                            <input
                                type="text"
                                value={localPromo.url}
                                onChange={e => setLocalPromo({ ...localPromo, url: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm bg-white"
                                placeholder="Link a WhatsApp, Instagram, etc."
                            />
                        </div>

                        <button
                            onClick={() => {
                                updatePromoBanner(localPromo);
                                alert("✅ Pop-up actualizado correctamente!");
                            }}
                            className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-md shadow-amber-200"
                        >
                            GUARDAR CONFIGURACIÓN POP-UP
                        </button>
                    </div>

                    {/* Preview */}
                    <div className="bg-white/50 border-2 border-dashed border-amber-200 rounded-2xl flex flex-col items-center justify-center p-4">
                        {localPromo.img ? (
                            <div className="relative w-full max-w-[200px] aspect-[4/5] rounded-xl overflow-hidden shadow-xl ring-4 ring-white">
                                {localPromo.img.toLowerCase().includes('.mp4') ? (
                                    <video
                                        src={localPromo.img}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <img src={localPromo.img} className="w-full h-full object-cover" alt="Preview" />
                                )}
                                {!localPromo.active && (
                                    <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-[2px] flex items-center justify-center text-center p-2">
                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest rotate-[-15deg]">Desactivado</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <Sun size={40} className="mx-auto text-amber-200 mb-2" />
                                <span className="text-xs text-amber-400 font-medium italic">Sin contenido configurado</span>
                            </div>
                        )}
                        <span className="mt-4 text-[10px] font-bold text-amber-800 uppercase tracking-tighter">Vista previa del banner</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TucitoManager = () => {
    const [prompt, setPrompt] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPrompt = async () => {
            try {
                const { data } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'tucito_prompt')
                    .single();
                if (data) setPrompt(data.value);
            } catch (e) {
                console.error("Error cargando prompt de Tucito");
            } finally {
                setIsLoading(false);
            }
        };
        loadPrompt();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({ key: 'tucito_prompt', value: prompt, id: 'tucito_prompt' }, { onConflict: 'key' });

            if (error) throw error;
            alert('✅ ¡El Cerebro de Tucito ha sido actualizado!');
        } catch (err) {
            alert('❌ Error al guardar instrucciones: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 bg-cyan-50 border border-cyan-100 rounded-xl relative overflow-hidden">
            <div className="absolute -top-6 -right-6 opacity-10 rotate-12">
                <Sparkles size={80} className="text-cyan-600" />
            </div>

            <h3 className="font-bold text-cyan-900 mb-2 flex items-center gap-2 relative z-10">
                <Sparkles size={20} className="text-cyan-600" /> Cerebro de Tucito AI
            </h3>
            <p className="text-sm text-cyan-800 mb-4 relative z-10">
                Define aquí cómo debe comportarse Tucito. Dale instrucciones sobre horarios, precios, promociones o su personalidad.
            </p>

            <div className="space-y-4 relative z-10">
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    disabled={isLoading}
                    placeholder={isLoading ? "Cargando cerebro..." : "Ej: Eres Tucito, el dragón de Sei Tu San Justo. Atendemos de 12 a 00hs. La promo de hoy es..."}
                    className="w-full h-40 px-4 py-3 rounded-xl border border-cyan-200 bg-white shadow-inner text-sm focus:ring-2 focus:ring-cyan-500/20 text-slate-800 font-medium leading-relaxed transition-all"
                />

                <button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="w-full py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-all shadow-md shadow-cyan-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
                    {isSaving ? 'GUARDANDO INSTRUCCIONES...' : 'GUARDAR CEREBRO DE TUCITO'}
                </button>
            </div>
        </div>
    );
};

export default function Settings() {
    const { exportData, importData, purgeOldData, clearAllImages, factoryReset, clearHistory } = useStore();

    const handleDownload = () => {
        const json = exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_seitu_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target.result;
                const data = JSON.parse(json);

                // PREVIEW ANALYSIS
                const sessions = (data.seitu_sessions || data.sessions || []);
                // Sort by date to find the absolute latest
                sessions.sort((a, b) => new Date(b.startedAt || b.date) - new Date(a.startedAt || a.date));

                const lastSession = sessions[0];
                const lastDate = lastSession ? new Date(lastSession.startedAt || lastSession.date).toLocaleString() : 'N/A';

                const stats = {
                    sessions: sessions.length,
                    sales: (data.seitu_sales || data.sales || []).length,
                    customers: (data.seitu_customers || data.customers || []).length,
                    legacy: (data.seitu_cash_cuts || data.cashCuts || []).length
                };

                const msg = `📦 ANALISIS DEL BACKUP:\n\n` +
                    `• FECHA ÚLTIMO TURNO: ${lastDate}\n` +
                    `--------------------------------\n` +
                    `• Total Turnos: ${stats.sessions}\n` +
                    `• Ventas: ${stats.sales}\n` +
                    `• Recuperables (Legacy): ${stats.legacy}\n\n` +
                    `¿Confirmas la importación?`;

                if (window.confirm(msg)) {
                    const result = importData(json);
                    if (!result.success) {
                        alert("Error al importar: " + result.error);
                    }
                }
            } catch (err) {
                alert("El archivo no es válido o está corrupto.");
            }
        };
        reader.readAsText(file);
    };

    const handlePurge = (months) => {
        const confirmMsg = months === 0
            ? "¿Seguro que quieres borrar TODO el historial? (Ventas, Gastos, Sesiones). Solo quedará el Catálogo y Stock actual."
            : `¿Seguro que quieres borrar el historial de más de ${months} meses?`;

        if (window.confirm(confirmMsg)) {
            const result = purgeOldData(months);
            if (result.success) {
                alert(`¡Listo! Se eliminaron ${result.count} registros antiguos.`);
            } else {
                alert("Error al intentar limpiar datos.");
            }
        }
    };

    const handleClearImages = () => {
        if (window.confirm("⚠️ ¿Estás seguro de eliminar TODAS las fotos del catálogo? Esto liberará mucho espacio y permitirá seguir facturando. Esta acción no se puede deshacer.")) {
            const result = clearAllImages();
            if (result.success) {
                alert(`¡Listo! Se eliminaron las fotos de ${result.count} productos.`);
            }
        }
    };

    const handleReset = () => {
        factoryReset();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Copia de Seguridad y Datos</h2>
                        <p className="text-slate-500">Gestiona tus datos y el almacenamiento.</p>
                    </div>
                </div>

                {/* Storage usage indicator */}
                {(() => {
                    const usage = (useStore()).getStorageUsage();
                    return (usage && usage.percentage !== undefined ? (
                        <div className={`p-3 rounded-xl border flex flex-col items-end ${usage.isCritical ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <HardDrive size={14} className={usage.isCritical ? 'text-red-500' : 'text-slate-400'} />
                                <span className={`text-[10px] font-bold uppercase ${usage.isCritical ? 'text-red-600' : 'text-slate-500'}`}>
                                    Almacenamiento: {usage.percentage}%
                                </span>
                            </div>
                            <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${usage.isCritical ? 'bg-red-500' : 'bg-brand-500'}`}
                                    style={{ width: `${usage.percentage}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1">{usage.totalMB} MB de ~5 MB</span>
                        </div>
                    ) : null);
                })()}
            </div>

            {/* BACKUP & RESTORE */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2">Respaldo</h3>

                {/* EXPORT */}
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Download size={20} /> Exportar Datos (Backup)
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                        Descarga un archivo con TODOS tus datos (Productos, Fotos, Ventas, Historial).
                        Guárdalo seguro periódicamente.
                    </p>
                    <button
                        onClick={handleDownload}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
                    >
                        <Download size={18} /> DESCARGAR BACKUP
                    </button>
                </div>

                {/* IMPORT */}
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
                    <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                        <Upload size={20} /> Restaurar Datos (Importar)
                    </h3>
                    <p className="text-sm text-amber-800 mb-4">
                        Carga el archivo de backup aquí para recuperar todos tus datos.
                    </p>

                    <div className="bg-white p-4 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                            <div className="text-xs text-amber-800">
                                <strong>ADVERTENCIA:</strong> Esta acción sobrescribirá todos los datos actuales.
                            </div>
                        </div>

                        <input
                            type="file"
                            accept=".json"
                            onChange={handleUpload}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-amber-100 file:text-amber-700
                                hover:file:bg-amber-200
                            "
                        />
                    </div>
                </div>
            </div>



            {/* CATALOG RESTORE (New) */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <Database size={20} /> Recuperación de Catálogo
                </h3>
                <CatalogRestore />
            </div>

            {/* CATALOG REPAIR */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <Wrench size={20} /> Reparación de Catálogo
                </h3>
                <CatalogFixer />
            </div>

            {/* STOCK TOOLS */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <PackageCheck size={20} /> Herramientas de Stock
                </h3>

                <StockTool />
            </div>

            {/* SESSION MANAGER */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <Trash2 size={20} /> Historial y Limpieza
                </h3>
                <SessionManager />
            </div>

            {/* LOYALTY SETTINGS */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <Star size={20} /> Programa de Puntos
                </h3>
                <LoyaltySettings />
            </div>

            {/* STAFF MANAGEMENT */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <Users size={20} /> Gestión de Personal
                </h3>
                <StaffManager />
            </div>

            {/* SOCIAL MEDIA AND LANDING (NEW) */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <Instagram size={20} /> Redes Sociales y Galería Web
                </h3>
                <SocialManager />
            </div>

            {/* TUCITO AI MANAGER (NEW) */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <Sparkles size={20} className="text-cyan-500" /> Cerebro de la Inteligencia Artificial
                </h3>
                <TucitoManager />
            </div>

            {/* MAINTENANCE */}
            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-700 text-lg border-b pb-2 flex items-center gap-2">
                    <HardDrive size={20} /> Mantenimiento y Reset
                </h3>

                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-6">
                    <h3 className="font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} /> Zona de Peligro
                    </h3>

                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-red-100 dark:border-red-900/20 shadow-sm">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-2">Limpiar Historial</h4>
                            <p className="text-xs text-slate-500 mb-4">
                                Borra todas las ventas, turnos y movimientos de stock pasados.
                                <br /><strong>Tus productos y precios se mantienen intactos.</strong>
                                <br />El stock base se mantendrá, pero al no haber ventas restando, verás el stock original.
                            </p>
                            <button
                                onClick={clearHistory}
                                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow flex items-center justify-center gap-2 uppercase tracking-wide"
                            >
                                <Trash2 size={18} /> BORRAR HISTORIAL DE VENTAS Y TURNOS
                            </button>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg flex flex-col gap-2">
                            <h4 className="font-bold text-slate-600 dark:text-slate-300 text-sm">Otras acciones críticas</h4>
                            <button
                                onClick={handleReset}
                                className="w-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} /> RESTAURAR DE FÁBRICA (BORRA TODO INCL. PRODUCTOS)
                            </button>

                            <button
                                onClick={handleClearImages}
                                className="w-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} /> ELIMINAR FOTOS (LIBERAR ESPACIO)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
