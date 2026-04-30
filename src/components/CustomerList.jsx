import React, { useState } from 'react';
import { Search, UserPlus, Phone, Mail, IdCard, Star, Trash2, Edit2, History, ChevronDown, ChevronUp, Cloud, ArrowUpDown } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';

export default function CustomerList() {
    const { customers, rewards, sales, addCustomer, updateCustomer, deleteCustomer, syncToCloud } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedHistory, setExpandedHistory] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const handleFullSync = async () => {
        if (!window.confirm('¿Quieres subir todos los clientes y premios actuales a la nube? Esto actualizará el portal de clientes.')) return;
        setSyncing(true);
        try {
            for (const c of customers) await syncToCloud(c, 'customers');
            for (const r of rewards) await syncToCloud(r, 'rewards');
            alert('¡Sincronización masiva completada!');
        } catch (err) {
            alert('Error durante la sincronización.');
        } finally {
            setSyncing(false);
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        dni: '',
        phone: '',
        email: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' }); // Default sort by points high to low

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.dni && c.dni.includes(searchTerm)) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    // Apply Sorting
    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        if (sortConfig.key) {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle points specifically as numbers
            if (sortConfig.key === 'points') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            } else if (sortConfig.key === 'date') {
                // Handle Date sorting (createdAt)
                aValue = new Date(a.createdAt || 0).getTime();
                bValue = new Date(b.createdAt || 0).getTime();
            } else {
                // String comparison for other fields
                aValue = (aValue || '').toString().toLowerCase();
                bValue = (bValue || '').toString().toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
        }
        return 0;
    });

    // Apply Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateCustomer(editingId, formData);
            setEditingId(null);
        } else {
            addCustomer(formData);
        }
        setFormData({ name: '', dni: '', phone: '', email: '' });
        setShowForm(false);
    };

    const handleEdit = (customer) => {
        setFormData({
            name: customer.name,
            dni: customer.dni || '',
            phone: customer.phone || '',
            email: customer.email || ''
        });
        setEditingId(customer.id);
        setShowForm(true);
    };

    const toggleHistory = (id) => {
        setExpandedHistory(expandedHistory === id ? null : id);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Clientes y Puntos</h2>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700">
                            {customers.length}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona tu base de clientes y su programa de lealtad.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleFullSync}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                        title="Sincronizar todo con la nube"
                    >
                        <Cloud size={20} className={syncing ? 'animate-pulse text-brand-500' : ''} />
                        {syncing ? 'Sincronizando...' : 'Subir a la nube'}
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', dni: '', phone: '', email: '' });
                            setShowForm(!showForm);
                        }}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm"
                    >
                        <UserPlus size={20} />
                        {showForm ? 'Cancelar' : 'Nuevo Cliente'}
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre Completo *</label>
                            <input
                                required
                                type="text"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">DNI (Para puntos)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.dni}
                                onChange={e => setFormData({ ...formData, dni: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Teléfono</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-slate-900 dark:bg-brand-600 text-white font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-brand-500 transition-colors shadow-lg"
                        >
                            {editingId ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative max-w-md w-full md:w-auto flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, DNI o teléfono..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset page on search
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <ArrowUpDown size={16} className="text-slate-400 dark:text-slate-500" />
                        <select
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2 outline-none font-bold"
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={(e) => {
                                const [key, direction] = e.target.value.split('-');
                                setSortConfig({ key, direction });
                            }}
                        >
                            <option value="points-desc">Mayor Puntaje</option>
                            <option value="points-asc">Menor Puntaje</option>
                            <option value="name-asc">Nombre (A-Z)</option>
                            <option value="name-desc">Nombre (Z-A)</option>
                            <option value="date-desc">Más Recientes</option>
                            <option value="date-asc">Más Antiguos</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                <th
                                    className="px-6 py-3 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Cliente {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-3">Contacto</th>
                                <th
                                    className="px-6 py-3 text-center cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                                    onClick={() => handleSort('points')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Puntos Acumulados {sortConfig.key === 'points' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-center">Alta</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {currentItems.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400 dark:text-slate-600">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            )}
                            {currentItems.map(customer => (
                                <React.Fragment key={customer.id}>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-lg">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">{customer.name}</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                        <IdCard size={12} /> {customer.dni || 'S/DNI'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {customer.phone && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                        <Phone size={12} /> {customer.phone}
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                        <Mail size={12} /> {customer.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black ${customer.points > 1000 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}>
                                                <Star size={16} fill="currentColor" className={customer.points > 1000 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'} />
                                                {customer.points || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => toggleHistory(customer.id)}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all"
                                                    title="Ver Historial"
                                                >
                                                    <History size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`¿Eliminar a ${customer.name}?`)) deleteCustomer(customer.id);
                                                    }}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedHistory === customer.id && (
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                            <td colSpan="5" className="px-6 py-4">
                                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-in fade-in slide-in-from-top-1">
                                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                                                        <History size={14} /> Historial de Puntos
                                                    </h4>
                                                    {customer.history && customer.history.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {customer.history.map((h, idx) => {
                                                                // Find sale to show details
                                                                const sale = sales.find(s => s.id === h.saleId || (s.orderNumber && s.orderNumber.toString() === h.saleId));
                                                                const productNames = sale ? sale.items.map(i => `${i.quantity > 1 ? i.quantity + 'x ' : ''}${i.name}`).join(', ') : '';

                                                                return (
                                                                    <div key={idx} className="flex flex-col text-xs p-2 border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <div>
                                                                                <span className="font-bold text-slate-600 dark:text-slate-300">{new Date(h.date).toLocaleDateString()}</span>
                                                                                <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
                                                                                <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                                                    {h.type === 'manual_adjustment' ? 'Ajuste Manual' : `Venta #${h.saleId?.slice(-4) || 'S/N'}`}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex gap-4">
                                                                                <span className="text-green-600 dark:text-green-400 font-bold">+{h.pointsEarned}</span>
                                                                                {h.pointsRedeemed > 0 && <span className="text-red-500 dark:text-red-400 font-bold">-{h.pointsRedeemed}</span>}
                                                                                <span className="text-slate-400 dark:text-slate-500 font-medium">Saldo: {h.balance}</span>
                                                                            </div>
                                                                        </div>
                                                                        {/* Product Details Row */}
                                                                        {productNames && (
                                                                            <div className="text-slate-400 dark:text-slate-500 pl-2 text-[10px] italic truncate" title={productNames}>
                                                                                ↳ {productNames}
                                                                            </div>
                                                                        )}
                                                                        {h.reason && (
                                                                            <div className="text-slate-400 dark:text-slate-500 pl-2 text-[10px] italic">
                                                                                "{h.reason}"
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-slate-400 dark:text-slate-600 text-xs py-4">No hay movimientos registrados.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center gap-2">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-50"
                        >
                            <ChevronDown className="rotate-90" size={20} />
                        </button>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            Página {currentPage} de {totalPages} ({sortedCustomers.length} clientes)
                        </span>
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-50"
                        >
                            <ChevronDown className="-rotate-90" size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
