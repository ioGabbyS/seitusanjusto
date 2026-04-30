import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore.jsx';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import MercadoPagoPanel from './MercadoPagoPanel';
import {
    Truck,
    Users,
    Calendar,
    Plus,
    History,
    DollarSign,
    Trash2,
    CreditCard,
    Banknote,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    X,
    ShieldCheck,
    ListFilter,
    Mailbox,
    UserCircle,
    Phone,
    Home,
    Instagram,
    Briefcase,
    Notebook,
    Fingerprint,
    Cake,
    AtSign
} from 'lucide-react';

export default function Finances() {
    const {
        debts, addDebt, addDebtPayment, deleteDebt,
        employees, addEmployee, addEmployeeRecord, deleteEmployee, updateEmployee,
        recurringExpenses, addRecurringExpense, deleteRecurringExpense,
        inventory, activeSession, auditLog,
        envelopes, markEnvelopesAsDeposited, resetEmployeeLedger
    } = useStore();

    const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers', 'staff', 'fixed'

    // --- Tab Content Renderers ---
    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
            {/* Header Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-2 flex gap-2 shrink-0">
                <button
                    onClick={() => setActiveTab('suppliers')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all ${activeTab === 'suppliers' ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                    <Truck size={20} />
                    Proveedores
                </button>
                <button
                    onClick={() => setActiveTab('staff')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all ${activeTab === 'staff' ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                    <Users size={20} />
                    Personal
                </button>
                <button
                    onClick={() => setActiveTab('fixed')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all ${activeTab === 'fixed' ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                    <Calendar size={20} />
                    Gastos Fijos
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all ${activeTab === 'audit' ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                    <ShieldCheck size={20} />
                    Auditoría
                </button>
                <button
                    onClick={() => setActiveTab('envelopes')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all ${activeTab === 'envelopes' ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                    <Mailbox size={20} />
                    Sobres
                </button>
                <button
                    onClick={() => setActiveTab('mercadopago')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all ${activeTab === 'mercadopago' ? 'text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                    style={activeTab === 'mercadopago' ? { background: '#009ee3', boxShadow: '0 8px 20px -4px rgba(0,158,227,0.35)' } : {}}
                >
                    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="20" fill={activeTab === 'mercadopago' ? 'rgba(255,255,255,0.2)' : '#009ee3'} />
                        <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">MP</text>
                    </svg>
                    MercadoPago
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'suppliers' && <SuppliersView debts={debts} addDebt={addDebt} addDebtPayment={addDebtPayment} deleteDebt={deleteDebt} activeSession={activeSession} envelopes={envelopes} />}
                {activeTab === 'staff' && <StaffView employees={employees} addEmployee={addEmployee} addEmployeeRecord={addEmployeeRecord} deleteEmployee={deleteEmployee} updateEmployee={updateEmployee} activeSession={activeSession} envelopes={envelopes} resetEmployeeLedger={resetEmployeeLedger} />}
                {activeTab === 'fixed' && <FixedExpensesView recurringExpenses={recurringExpenses} addRecurringExpense={addRecurringExpense} deleteRecurringExpense={deleteRecurringExpense} />}
                {activeTab === 'audit' && <AuditoríaView auditLog={auditLog} />}
                {activeTab === 'envelopes' && <EnvelopesView envelopes={envelopes} markAsDeposited={markEnvelopesAsDeposited} />}
                {activeTab === 'mercadopago' && <MercadoPagoPanel />}
            </div>
        </div>
    );
}

// --- SUB-VIEW: SUPPLIERS ---
function SuppliersView({ debts, addDebt, addDebtPayment, deleteDebt, activeSession, envelopes }) {
    const [showAddDebt, setShowAddDebt] = useState(false);
    const [selectedDebtForPayment, setSelectedDebtForPayment] = useState(null);
    const [selectedDebtForHistory, setSelectedDebtForHistory] = useState(null);

    // Form state
    const [provider, setProvider] = useState('');
    const [total, setTotal] = useState('');
    const [invoice, setInvoice] = useState('');
    const [details, setDetails] = useState('');
    const [notes, setNotes] = useState('');

    const handleAddDebt = (e) => {
        e.preventDefault();
        if (!provider || !total) return;
        addDebt({ provider, total: parseCurrency(total), invoice, details, notes });
        setShowAddDebt(false);
        setProvider(''); setTotal(''); setInvoice(''); setDetails(''); setNotes('');
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <History size={18} className="text-brand-500" />
                        Deudas y Facturas
                    </h3>
                    <button
                        onClick={() => setShowAddDebt(true)}
                        className="bg-brand-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-brand-600 transition-colors shadow-sm"
                    >
                        <Plus size={16} /> NUEVA BOLETA
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Proveedor / Detalle</th>
                                <th className="px-6 py-3">Importe Total</th>
                                <th className="px-6 py-3">Pagado</th>
                                <th className="px-6 py-3">Restante</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {debts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 dark:text-slate-500 italic">No hay boletas registradas</td>
                                </tr>
                            )}
                            {[...debts].sort((a, b) => {
                                const paidA = a.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                                const paidB = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                                const balA = a.total - paidA;
                                const balB = b.total - paidB;
                                if (balA > 0 && balB <= 0) return -1;
                                if (balA <= 0 && balB > 0) return 1;
                                if (balA > 0 && balB > 0) return balB - balA; // Higher balance first
                                return new Date(b.date) - new Date(a.date);
                            }).map(d => {
                                const paidAmount = d.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                                const balance = d.total - paidAmount;
                                const isPaid = balance <= 0;

                                return (
                                    <tr key={d.id} className={`${isPaid ? 'bg-green-50/30 dark:bg-green-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} transition-colors group`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-200">{d.provider}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">{d.details}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500">Factura: {d.invoice || 'S/N'} • {new Date(d.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${d.total.toLocaleString('es-AR')}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedDebtForHistory(d)}
                                                className="text-green-600 dark:text-green-400 font-medium hover:underline flex items-center gap-1"
                                            >
                                                ${paidAmount.toLocaleString('es-AR')}
                                                <History size={12} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                                            {balance > 0 ? `$${balance.toLocaleString('es-AR')}` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {isPaid ? (
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> PAGADO
                                                    </span>
                                                ) : (
                                                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                                                        <AlertCircle size={12} /> PENDIENTE
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!isPaid && (
                                                    <button
                                                        onClick={() => setSelectedDebtForPayment(d)}
                                                        className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                        title="Agregar Pago"
                                                    >
                                                        <DollarSign size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        const pass = prompt('Ingrese clave de seguridad para eliminar esta boleta:');
                                                        if (pass === '1145') {
                                                            if (window.confirm('¿Eliminar esta boleta definitivamente?')) deleteDebt(d.id);
                                                        } else if (pass !== null) {
                                                            alert('❌ Clave incorrecta');
                                                        }
                                                    }}
                                                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals placeholders... will implement full modals in next tool call or integrate here */}
            {showAddDebt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Cargar Nueva Boleta</h3>
                            <button onClick={() => setShowAddDebt(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddDebt} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Proveedor</label>
                                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" value={provider} onChange={e => setProvider(e.target.value)} placeholder="Ej: Ganate, Seitu, etc." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Monto Total</label>
                                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" value={total} onChange={e => setTotal(formatCurrency(e.target.value))} placeholder="$ 0" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Nro Factura (Opcional)</label>
                                <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" value={invoice} onChange={e => setInvoice(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Detalle de Mercadería (Naranjas, Kiwi, etc.)</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 text-sm h-20"
                                    value={details}
                                    onChange={e => setDetails(e.target.value)}
                                    placeholder="Ej: 3 cajones de naranjas, 1 kg de kiwi..."
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg">CARGAR DEUDA</button>
                        </form>
                    </div>
                </div>
            )}

            {selectedDebtForPayment && (
                <DebtPaymentModal debt={selectedDebtForPayment} onClose={() => setSelectedDebtForPayment(null)} addPayment={addDebtPayment} activeSession={activeSession} envelopes={envelopes} />
            )}

            {selectedDebtForHistory && (
                <DebtHistoryModal debt={selectedDebtForHistory} onClose={() => setSelectedDebtForHistory(null)} />
            )}
        </div>
    );
}

function DebtPaymentModal({ debt, onClose, addPayment, activeSession, envelopes = [] }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('efectivo');
    const [paymentSource, setPaymentSource] = useState('caja'); // caja, transferencia, sobres
    const [selectedEnvelopeId, setSelectedEnvelopeId] = useState('');
    const [fromRegister, setFromRegister] = useState(true);

    useEffect(() => {
        if (paymentSource !== 'caja') setFromRegister(false);
        else setFromRegister(true);
    }, [paymentSource]);

    const paidAmount = debt.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = debt.total - paidAmount;

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsedAmount = parseCurrency(amount);

        if (!parsedAmount || parsedAmount <= 0) return;
        if (parsedAmount > balance) {
            alert('El pago supera el saldo pendiente');
            return;
        }
        if (paymentSource === 'sobres' && !selectedEnvelopeId) {
            alert('⚠️ Seleccione un sobre para retirar el dinero.');
            return;
        }

        // Fallback for Cashier Name if activeSession is missing (e.g. reload)
        let currentCashier = activeSession?.cashier || 'Sistema';
        if (currentCashier === 'Sistema') {
            try {
                const stored = localStorage.getItem('activeLoggedInSession');
                if (stored) {
                    const session = JSON.parse(stored);
                    if (session.cashier) currentCashier = session.cashier;
                }
            } catch (err) {
                console.error("Error reading session from storage", err);
            }
        }

        addPayment(debt.id, {
            amount: parsedAmount, // Parsed Number
            paymentSource: paymentSource,
            envelopeId: selectedEnvelopeId,
            method: method,
            fromRegister: fromRegister,
            date: new Date().toISOString(),
            cashier: currentCashier
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Registrar Pago</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{debt.provider}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Monto a Pagar $</label>
                        <input
                            required
                            autoFocus
                            type="text"
                            className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-3xl font-black outline-none focus:ring-2 focus:ring-brand-500 text-center"
                            value={amount}
                            onChange={e => setAmount(formatCurrency(e.target.value))}
                            placeholder="$ 0"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Origen del Dinero</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentSource('caja')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentSource === 'caja' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                            >
                                <Banknote size={24} className={paymentSource === 'caja' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'} />
                                <span className={`text-[10px] font-bold uppercase ${paymentSource === 'caja' ? 'text-brand-700 dark:text-brand-400' : 'text-slate-500'}`}>Caja</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentSource('transferencia')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentSource === 'transferencia' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                            >
                                <CreditCard size={24} className={paymentSource === 'transferencia' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                                <span className={`text-[10px] font-bold uppercase ${paymentSource === 'transferencia' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>Transf.</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentSource('sobres')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentSource === 'sobres' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                            >
                                <History size={24} className={paymentSource === 'sobres' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
                                <span className={`text-[10px] font-bold uppercase ${paymentSource === 'sobres' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}`}>Retiro</span>
                            </button>
                        </div>
                    </div>

                    {paymentSource === 'sobres' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Seleccionar Sobre (Saldo Disponible)</label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                                {envelopes.filter(e => e.status !== 'deposited' && e.balance > 0).map(env => (
                                    <button
                                        key={env.id}
                                        type="button"
                                        onClick={() => setSelectedEnvelopeId(env.id)}
                                        className={`p-3 rounded-xl border text-left transition-all ${selectedEnvelopeId === env.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md ring-1 ring-amber-500' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{env.name}</span>
                                            <span className="font-black text-amber-600 dark:text-amber-400">${env.balance.toLocaleString('es-AR')}</span>
                                        </div>
                                    </button>
                                ))}
                                {envelopes.filter(e => e.status !== 'deposited' && e.balance > 0).length === 0 && (
                                    <div className="text-center p-4 text-slate-400 text-xs text-balance">
                                        No hay sobres con saldo disponible.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="w-full py-4 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-100 dark:shadow-none uppercase">Confirmar Pago</button>
                </form>
            </div>
        </div>
    );
}

// --- SUB-VIEW: ENVELOPES ---
function EnvelopesView({ envelopes, markAsDeposited }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewingHistory, setViewingHistory] = useState(null);

    const activeEnvelopes = envelopes
        .filter(e => e.status !== 'deposited')
        .sort((a, b) => {
            const dateA = new Date(a.history?.[0]?.date || a.createdAt || 0);
            const dateB = new Date(b.history?.[0]?.date || b.createdAt || 0);
            return dateA - dateB;
        });
    const totalInEnvelopes = activeEnvelopes.reduce((sum, e) => sum + e.balance, 0);

    const toggleSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleDeposit = () => {
        if (selectedIds.length === 0) return;
        const pass = prompt('🔐 Ingrese clave para DEPOSITAR sobres:');
        if (pass === '1145') {
            if (window.confirm(`¿Marcar ${selectedIds.length} sobres como DEPOSITADOS? Salen de la lista activa.`)) {
                markAsDeposited(selectedIds);
                setSelectedIds([]);
            }
        } else if (pass !== null) {
            alert('❌ Clave incorrecta.');
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total en Sobres Activos</div>
                        <div className="text-3xl font-black text-slate-900">${totalInEnvelopes.toLocaleString('es-AR')}</div>
                    </div>
                    <div className="p-4 bg-brand-50 rounded-2xl text-brand-500">
                        <Mailbox size={32} />
                    </div>
                </div>

                <div className="col-span-2 bg-slate-900 p-6 rounded-2xl flex items-center justify-between text-white">
                    <div>
                        <h4 className="font-bold text-lg">Control de Depósitos</h4>
                        <p className="text-slate-400 text-sm">Selecciona los sobres que ya depositaste para darlos de baja</p>
                    </div>
                    <button
                        disabled={selectedIds.length === 0}
                        onClick={handleDeposit}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle2 size={20} /> DEPOSITAR SELECCIONADOS ({selectedIds.length})
                    </button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase sticky top-0">
                            <tr>
                                <th className="px-6 py-4 w-10"></th>
                                <th className="px-6 py-4">Nombre del Sobre</th>
                                <th className="px-6 py-4">Saldo Actual</th>
                                <th className="px-6 py-4">Último Movimiento</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeEnvelopes.length === 0 ? (
                                <tr><td colSpan="5" className="py-20 text-center text-slate-300 italic">No hay sobres activos</td></tr>
                            ) : (
                                activeEnvelopes.map(env => (
                                    <tr key={env.id} className={`${selectedIds.includes(env.id) ? 'bg-brand-50' : 'hover:bg-slate-50'} transition-colors cursor-pointer`} onClick={() => toggleSelection(env.id)}>
                                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                                checked={selectedIds.includes(env.id)}
                                                onChange={() => toggleSelection(env.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{env.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Iniciado: {new Date(env.history[0]?.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-lg text-slate-900">${env.balance.toLocaleString('es-AR')}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-medium text-slate-600">{env.history[env.history.length - 1]?.description}</div>
                                            <div className="text-[10px] text-slate-400 font-bold">{new Date(env.history[env.history.length - 1]?.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setViewingHistory(env)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 inline-flex"
                                            >
                                                <History size={14} /> HISTORIAL
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History Modal */}
            {viewingHistory && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">Movimientos: {viewingHistory.name}</h3>
                                <div className="text-brand-300 font-bold text-xs uppercase">Saldo Disponible: ${viewingHistory.balance.toLocaleString('es-AR')}</div>
                            </div>
                            <button onClick={() => setViewingHistory(null)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase sticky top-0 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3">Fecha y Hora</th>
                                        <th className="px-6 py-3">Concepto</th>
                                        <th className="px-6 py-3">Usuario</th>
                                        <th className="px-6 py-3 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {viewingHistory.history.slice().reverse().map(h => (
                                        <tr key={h.id} className="text-sm">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-700">{new Date(h.date).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-slate-400">{new Date(h.date).toLocaleTimeString('es-AR', { hour12: false })}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium italic">{h.description}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{h.user}</span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${h.type === 'entry' ? 'text-green-600' : 'text-red-500'}`}>
                                                {h.type === 'entry' ? '+' : '-'}${h.amount.toLocaleString('es-AR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                            <button onClick={() => setViewingHistory(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold uppercase text-xs">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB-VIEW: AUDITORIA ---
function AuditoríaView({ auditLog }) {
    return (
        <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-sm tracking-widest">
                    <ShieldCheck size={18} className="text-green-600" />
                    Auditoría de Movimientos
                </h3>
                <div className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
                    Últimos 1000 registros
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3">Fecha y Hora</th>
                            <th className="px-6 py-3">Usuario / Responsable</th>
                            <th className="px-6 py-3">Acción</th>
                            <th className="px-6 py-3">Detalles del Movimiento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {auditLog.length === 0 ? (
                            <tr><td colSpan="4" className="py-20 text-center text-slate-300 italic">No hay registros de auditoría</td></tr>
                        ) : (
                            auditLog.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs font-bold text-slate-700">{new Date(entry.timestamp).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleTimeString('es-AR', { hour12: false })}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase">{entry.user}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${entry.action.includes('DELETED') ? 'bg-red-100 text-red-600' :
                                            entry.action.includes('CREATED') ? 'bg-blue-100 text-blue-600' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                            {entry.action.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 italic">
                                        {entry.details}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- MODAL: DEBT HISTORY ---
function DebtHistoryModal({ debt, onClose }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Historial de Pagos</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{debt.provider}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {debt.payments.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500 italic">No hay pagos registrados aún</div>
                    ) : (
                        <div className="space-y-3">
                            {debt.payments.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">${Number(p.amount).toLocaleString('es-AR')}</div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black">{new Date(p.date).toLocaleString('es-AR', { hour12: false })}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Cobrado por</div>
                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 italic">{p.cashier}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400">Total abonado:</div>
                    <div className="text-xl font-black text-green-600 dark:text-green-400">${debt.payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('es-AR')}</div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-VIEW: STAFF ---
function StaffView({ employees, addEmployee, addEmployeeRecord, deleteEmployee, updateEmployee, activeSession, envelopes, resetEmployeeLedger }) {
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [newEmployeeName, setNewEmployeeName] = useState('');

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    const handleAddEmployee = (e) => {
        e.preventDefault();
        if (!newEmployeeName.trim()) return;
        addEmployee(newEmployeeName.trim());
        setNewEmployeeName('');
        setShowAddEmployee(false);
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                {/* Employee List Sidebar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase">Lista de Personal</h3>
                        <button onClick={() => setShowAddEmployee(true)} className="text-brand-600 hover:bg-brand-50 p-1.5 rounded-lg transition-colors"><Plus size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {employees.length === 0 ? (
                            <div className="py-10 text-center text-slate-300 italic text-sm">No hay empleados</div>
                        ) : (
                            employees.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => setSelectedEmployeeId(e.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all mb-1 flex items-center justify-between group ${selectedEmployeeId === e.id ? 'bg-brand-500 text-white shadow-md' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedEmployeeId === e.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                                            {e.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold truncate text-sm">{e.name}</span>
                                            {selectedEmployeeId === e.id && <span className="text-[9px] font-black uppercase opacity-60 flex items-center gap-1"><ShieldCheck size={10} /> Ver Datos</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedEmployeeId === e.id && (
                                            <div className="p-1.5 bg-white/20 rounded-lg">
                                                <Notebook size={14} />
                                            </div>
                                        )}
                                        <ArrowRight size={16} className={`${selectedEmployeeId === e.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Employee Ledger Detail */}
                <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    {selectedEmployee ? (
                        <EmployeeDetail
                            employee={selectedEmployee}
                            addRecord={addEmployeeRecord}
                            updateEmployee={updateEmployee}
                            onDelete={() => {
                                const pass = prompt('⚠️ Ingrese clave para ELIMINAR empleado:');
                                if (pass === '1145') {
                                    deleteEmployee(selectedEmployee.id);
                                    setSelectedEmployeeId(null);
                                }
                            }}
                            onReset={() => {
                                const pass = prompt('🔐 Ingrese clave para CERRAR CUENTA de este mes:');
                                if (pass === '1145') {
                                    if (window.confirm('¿Deseas cerrar la cuenta de este mes? Se borrará el historial y el saldo quedará registrado en Auditoría.')) {
                                        resetEmployeeLedger(selectedEmployee.id, activeSession?.cashier);
                                    }
                                } else if (pass !== null) {
                                    alert('❌ Clave incorrecta.');
                                }
                            }}
                            activeSession={activeSession}
                            envelopes={envelopes}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <Users size={64} className="opacity-10" />
                            <p className="font-medium italic">Selecciona un empleado para ver su cuenta corriente</p>
                        </div>
                    )}
                </div>
            </div>

            {showAddEmployee && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Agregar Personal</h3>
                            <button onClick={() => setShowAddEmployee(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 text-lg"
                                value={newEmployeeName}
                                onChange={e => setNewEmployeeName(e.target.value)}
                                placeholder="Nombre completo..."
                                autoFocus
                            />
                            <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg">CARGAR EMPLEADO</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmployeeDetail({ employee, addRecord, updateEmployee, onDelete, onReset, activeSession, envelopes }) {
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    const balance = employee.records.reduce((sum, r) => {
        if (r.type === 'adelanto' || r.type === 'retiro') return sum + Number(r.amount);
        if (r.type === 'sueldo') return sum - Number(r.amount);
        return sum;
    }, 0);

    const handleOpenProfile = () => {
        setShowPinModal(true);
    };

    const handlePinSuccess = () => {
        setShowPinModal(false);
        setShowProfileModal(true);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleOpenProfile}
                        className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-xl border-2 border-white dark:border-slate-700 shadow-sm hover:scale-110 transition-transform"
                        title="Ver Ficha Técnica"
                    >
                        {employee.name.substring(0, 1).toUpperCase()}
                    </button>
                    <div className="cursor-pointer group" onClick={handleOpenProfile}>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-brand-500 flex items-center gap-2 transition-colors">
                            {employee.name}
                            <Notebook size={16} className="text-brand-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cuenta Corriente Personal</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleOpenProfile}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
                        title="Ficha Técnica"
                    >
                        <Notebook size={20} />
                    </button>
                    <div className="text-right ml-2 mr-4">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Deuda Acumulada</div>
                        <div className={`text-2xl font-black ${balance > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{balance > 0 ? `$${balance.toLocaleString('es-AR')}` : '$0'}</div>
                    </div>
                    <button
                        onClick={() => setShowRecordModal(true)}
                        className="bg-brand-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-600 transition-colors shadow-lg shadow-brand-100 dark:shadow-none"
                    >
                        <Plus size={18} /> CARGAR MOVIMIENTO
                    </button>
                </div>
            </div>

            <div className="border-b border-slate-100 dark:border-slate-800 p-2 flex bg-slate-100/30">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
                >
                    <History size={14} /> CERRAR CUENTA / NUEVO MES
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                <table className="w-full text-left">
                    <thead className="text-[10px] uppercase font-bold text-slate-400">
                        <tr>
                            <th className="py-2">Fecha</th>
                            <th className="py-2">Concepto</th>
                            <th className="py-2">Tipo</th>
                            <th className="py-2">Cajero</th>
                            <th className="py-2 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {employee.records.length === 0 ? (
                            <tr><td colSpan="5" className="py-20 text-center text-slate-300 dark:text-slate-700 italic">Sin movimientos registrados</td></tr>
                        ) : (
                            employee.records.slice().reverse().map(r => (
                                <tr key={r.id}>
                                    <td className="py-3 text-[9px] font-medium text-slate-400">
                                        {new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="py-3 text-[10px] font-bold text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={r.description}>
                                        {r.description}
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${r.type === 'adelanto' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            r.type === 'retiro' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                            {r.type}
                                        </span>
                                    </td>
                                    <td className="py-3 text-[9px] font-bold text-slate-500 dark:text-slate-500 italic uppercase">
                                        {r.cashier || 'Sistema'}
                                    </td>
                                    <td className={`py-3 text-right text-[11px] font-black ${r.type === 'sueldo' ? 'text-green-600' : 'text-red-500'}`}>
                                        {r.type === 'sueldo' ? '-' : '+'}${Number(r.amount).toLocaleString('es-AR')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 flex justify-end shrink-0">
                <button
                    onClick={() => window.confirm('¿Eliminar registro de ' + employee.name + '?') && onDelete()}
                    className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                    <Trash2 size={14} /> ELIMINAR EMPLEADO
                </button>
            </div>

            {showRecordModal && (
                <StaffRecordModal employee={employee} onClose={() => setShowRecordModal(false)} addRecord={addRecord} activeSession={activeSession} envelopes={envelopes} />
            )}

            {showProfileModal && (
                <EmployeeProfileModal
                    employee={employee}
                    onClose={() => setShowProfileModal(false)}
                    onUpdate={(updates) => updateEmployee(employee.id, { profile: updates })}
                />
            )}

            {showPinModal && (
                <PinModal
                    onSuccess={handlePinSuccess}
                    onClose={() => setShowPinModal(false)}
                    targetKey="1145"
                    title="Acceso a Ficha Técnica"
                />
            )}
        </div>
    );
}

function PinModal({ onSuccess, onClose, targetKey = '1145', title = 'Acceso Restringido' }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pin === targetKey) {
            onSuccess();
        } else {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 1000);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className={`bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border-2 transition-all ${error ? 'border-red-500 animate-shake' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-6">Ingrese Clave de Seguridad</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            required
                            autoFocus
                            className="w-full text-center text-4xl font-black py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-500/20 text-slate-800 dark:text-white tracking-[1em]"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            maxLength={4}
                            placeholder="****"
                        />
                        {error && <p className="text-red-500 font-bold text-xs uppercase animate-bounce">Clave Incorrecta</p>}

                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="submit"
                                className="py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 shadow-lg shadow-brand-200 dark:shadow-none transition-colors"
                            >
                                ENTRAR
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function EmployeeProfileModal({ employee, onClose, onUpdate }) {
    const [profile, setProfile] = useState({
        fullName: employee.name || '',
        address: '',
        phone: '',
        cuil: '',
        alias: '',
        birthDate: '',
        contact: '',
        social: '',
        startDate: '',
        salary: '',
        detail: '',
        ...employee.profile
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(profile);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-3xl animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
                <div className="p-8 bg-gradient-to-r from-brand-600 to-brand-400 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <UserCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tight">Ficha Técnica</h3>
                                <p className="text-brand-100 font-bold uppercase text-xs tracking-widest">{employee.name}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-900/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Notebook size={14} className="text-brand-500" /> Información Principal
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Nombre y Apellido</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white"
                                            value={profile.fullName}
                                            onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                                            placeholder="Nombre completo"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Dirección</label>
                                    <div className="relative">
                                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white"
                                            value={profile.address}
                                            onChange={e => setProfile({ ...profile, address: e.target.value })}
                                            placeholder="Calle, altura, localidad"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Teléfono</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white"
                                            value={profile.phone}
                                            onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="Celular / Fijo / WhatsApp"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">CUIL</label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white"
                                            value={profile.cuil}
                                            onChange={e => setProfile({ ...profile, cuil: e.target.value })}
                                            placeholder="xx-xxxxxxxx-x"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Fecha de Nacimiento</label>
                                    <div className="relative">
                                        <Cake className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white"
                                            value={profile.birthDate}
                                            onChange={e => setProfile({ ...profile, birthDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra Details Section */}
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase size={14} className="text-brand-500" /> Detalles de Actividad
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Inicio de Actividad</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white"
                                            value={profile.startDate}
                                            onChange={e => setProfile({ ...profile, startDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Redes / Contacto Emergencia</label>
                                    <div className="relative">
                                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white"
                                            value={profile.social}
                                            onChange={e => setProfile({ ...profile, social: e.target.value })}
                                            placeholder="@instagram o Nombre Contacto"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Alias / CBU</label>
                                        <div className="relative">
                                            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white text-sm"
                                                value={profile.alias}
                                                onChange={e => setProfile({ ...profile, alias: e.target.value })}
                                                placeholder="Alias Bancario"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Sueldo Mensual</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white text-sm"
                                                value={profile.salary}
                                                onChange={e => setProfile({ ...profile, salary: formatCurrency(e.target.value) })}
                                                placeholder="$ 0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Observaciones / Resumen</label>
                                    <textarea
                                        rows="4"
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all text-slate-800 dark:text-white text-sm"
                                        value={profile.detail}
                                        onChange={e => setProfile({ ...profile, detail: e.target.value })}
                                        placeholder="Características, comportamiento, notas adicionales..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-5 bg-brand-600 text-white font-black rounded-3xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-100 dark:shadow-none uppercase tracking-widest text-lg"
                        >
                            Guardar Ficha
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StaffRecordModal({ employee, onClose, addRecord, activeSession, envelopes = [] }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('adelanto'); // adelanto, retiro, sueldo
    const [paymentSource, setPaymentSource] = useState('caja'); // caja, sobres, transferencia
    const [selectedEnvelopeId, setSelectedEnvelopeId] = useState('');
    const [fromRegister, setFromRegister] = useState(true);

    useEffect(() => {
        if (paymentSource !== 'caja') setFromRegister(false);
        else setFromRegister(true);
    }, [paymentSource]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !description) return;
        addRecord(employee.id, {
            amount: parseCurrency(amount),
            description,
            type,
            fromRegister,
            paymentSource,
            envelopeId: selectedEnvelopeId,
            cashier: activeSession?.cashier || 'Sistema'
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[95vh]">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold">Nuevo Movimiento</h3>
                        <p className="text-slate-400 text-sm">{employee.name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                            <button type="button" onClick={() => setType('adelanto')} className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase transition-all ${type === 'adelanto' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500'}`}>Adelanto $</button>
                            <button type="button" onClick={() => setType('retiro')} className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase transition-all ${type === 'retiro' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500'}`}>Retiro Merc.</button>
                            <button type="button" onClick={() => setType('sueldo')} className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase transition-all ${type === 'sueldo' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500'}`}>Sueldo</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Monto $</label>
                                <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xl font-bold outline-none focus:ring-2 focus:ring-brand-500" value={amount} onChange={e => setAmount(formatCurrency(e.target.value))} placeholder="$ 0" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Detalle</label>
                                <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Pago quincena" />
                            </div>
                        </div>

                        {type !== 'retiro' && (
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Origen del Dinero</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentSource('caja')}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentSource === 'caja' ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <Banknote size={20} className={paymentSource === 'caja' ? 'text-brand-600' : 'text-slate-400'} />
                                        <span className={`text-[10px] font-bold uppercase ${paymentSource === 'caja' ? 'text-brand-700' : 'text-slate-500'}`}>Caja</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentSource('transferencia')}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentSource === 'transferencia' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <CreditCard size={20} className={paymentSource === 'transferencia' ? 'text-blue-600' : 'text-slate-400'} />
                                        <span className={`text-[10px] font-bold uppercase ${paymentSource === 'transferencia' ? 'text-blue-700' : 'text-slate-500'}`}>Transf.</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentSource('sobres')}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentSource === 'sobres' ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <History size={20} className={paymentSource === 'sobres' ? 'text-amber-600' : 'text-slate-400'} />
                                        <span className={`text-[10px] font-bold uppercase ${paymentSource === 'sobres' ? 'text-amber-700' : 'text-slate-500'}`}>Sobres</span>
                                    </button>
                                </div>

                                {paymentSource === 'sobres' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <select
                                            required
                                            className="w-full px-4 py-2 rounded-xl border-2 border-amber-200 bg-white text-sm font-bold outline-none focus:border-amber-500"
                                            value={selectedEnvelopeId}
                                            onChange={e => setSelectedEnvelopeId(e.target.value)}
                                        >
                                            <option value="">-- Seleccionar Sobre --</option>
                                            {envelopes.filter(env => env.status !== 'deposited' && env.balance > 0).map(env => (
                                                <option key={env.id} value={env.id}>
                                                    {env.name} (${env.balance.toLocaleString('es-AR')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {paymentSource === 'caja' && (
                                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                            checked={fromRegister}
                                            onChange={e => setFromRegister(e.target.checked)}
                                            disabled={!activeSession}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-700">Retirar de la caja</div>
                                            <div className="text-[10px] text-slate-500 uppercase">Se registrará como un gasto en el turno</div>
                                        </div>
                                        {!activeSession && (
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">CAJA CERRADA</span>
                                        )}
                                    </label>
                                )}
                            </div>
                        )}

                        <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl uppercase">Confirmar Registro</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// --- SUB-VIEW: FIXED EXPENSES ---
function FixedExpensesView({ recurringExpenses, addRecurringExpense, deleteRecurringExpense }) {
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !amount) return;
        addRecurringExpense({ name, amount: Number(amount), dueDate });
        setName(''); setAmount(''); setDueDate('');
        setShowAdd(false);
    };

    return (
        <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={18} className="text-brand-500" />
                    Gastos Fijos Programados
                </h3>
                <button onClick={() => setShowAdd(true)} className="bg-brand-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-brand-600 transition-colors shadow-sm">
                    <Plus size={16} /> NUEVO GASTO
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recurringExpenses.length === 0 && (
                        <div className="col-span-3 py-20 text-center text-slate-300 italic">No hay gastos fijos configurados</div>
                    )}
                    {recurringExpenses.map(ex => (
                        <div key={ex.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow relative group">
                            <button
                                onClick={() => deleteRecurringExpense(ex.id)}
                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X size={20} />
                            </button>
                            <div className="text-[10px] text-brand-600 font-black uppercase mb-1">Gasto Fijo</div>
                            <h4 className="text-xl font-bold text-slate-800 mb-4">{ex.name}</h4>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Monto Estimado</div>
                                    <div className="text-2xl font-black text-slate-900">${ex.amount.toLocaleString('es-AR')}</div>
                                </div>
                                {ex.dueDate && (
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Vencimiento</div>
                                        <div className="text-sm font-bold text-slate-700">{ex.dueDate}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 tracking-tight">Nuevo Gasto Fijo</h3>
                            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Gasto</label>
                                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Luz, Alquiler, AFIP" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto Estimado $</label>
                                <input required type="number" className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimiento (Día del mes)</label>
                                <input type="number" min="1" max="31" className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500" value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="Ej: 10" />
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg mt-2">GUARDAR GASTO</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

