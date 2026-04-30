import React, { useState, useEffect } from 'react';
import { User, Star, Gift, Search, ArrowLeft, History, ShoppingBag, Facebook, Instagram, Sun, Moon } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useStore } from '../hooks/useStore';
import { tenant } from '../config/tenant';

export default function CustomerPortal() {
    const [dni, setDni] = useState('');
    const [customer, setCustomer] = useState(null);
    const [rewards, setRewards] = useState([]);
    const [error, setError] = useState('');
    const [view, setView] = useState('login'); // 'login', 'register', 'dashboard'
    const [loading, setLoading] = useState(false);
    const [showAllRewards, setShowAllRewards] = useState(false);
    const { theme, toggleTheme } = useStore();

    // Registration Form State
    const [regName, setRegName] = useState('');
    const [regDni, setRegDni] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regEmail, setRegEmail] = useState('');

    const loadRewards = async () => {
        const { data } = await supabase.from('rewards').select('*');
        if (data) setRewards(data);
    };

    useEffect(() => {
        loadRewards();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // INTENTAR API SEGURA (Ventanilla Blindada)
            const response = await fetch(`/api/get-customer-points?dni=${dni}`);

            if (response.ok) {
                const data = await response.json();
                setCustomer({
                    dni: dni,
                    name: data.name,
                    points: data.points,
                    history: data.history
                });
                setView('dashboard');
                return;
            }

            // FALLBACK PARA LOCALHOST (Si falla la API, usar Supabase directo)
            console.warn("API falló, usando conexión directa a Supabase (Fallback mode)");
            const { data: customerData, error: dbError } = await supabase
                .from('customers')
                .select('*')
                .eq('dni', dni)
                .single();

            if (customerData) {
                setCustomer({
                    dni: dni,
                    name: customerData.name,
                    points: customerData.points,
                    history: customerData.history || []
                });
                setView('dashboard');
            } else {
                setError('No se encontró ningún cliente con ese DNI.');
            }

        } catch (err) {
            console.error("Error en API y Fallback:", err);
            // Intento final directo por si el fetch tiró excepción (e.g. network error)
            try {
                const { data: customerData, error: dbError } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('dni', dni)
                    .single();

                if (customerData) {
                    setCustomer({
                        dni: dni,
                        name: customerData.name,
                        points: customerData.points,
                        history: customerData.history || []
                    });
                    setView('dashboard');
                } else {
                    setError('Error de conexión y no se encontró cliente localmente.');
                }
            } catch (finalErr) {
                setError('Error crítico. Verifique su internet.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!regName || !regDni || !regPhone || !regEmail) {
            setError('Todos los campos son obligatorios.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/register-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: regName,
                    dni: regDni,
                    phone: regPhone,
                    email: regEmail
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Error al registrar.');
                setLoading(false);
                return;
            }

            // Auto login with the data returned from server
            setCustomer(data);
            setView('dashboard');
            setDni(regDni);

        } catch (err) {
            console.error(err);
            setError('Error de conexión. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    if (view === 'login') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-500">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                    <div className="mb-6 animate-in slide-in-from-top duration-700">
                        <img src={tenant.navLogo} alt="Seitu Logo" className="w-24 h-24 object-contain filter drop-shadow-xl" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tighter">Seitu<span className="text-brand-500">Club</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold tracking-tight">Tu fidelidad tiene premio</p>

                    <form onSubmit={handleSearch} className="w-full space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input
                                required
                                type="text"
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50/50 outline-none transition-all font-bold text-lg"
                                placeholder="Ingresa tu DNI"
                                value={dni}
                                onChange={e => setDni(e.target.value)}
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 italic">
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 dark:bg-brand-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 dark:hover:bg-brand-600 transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                <><Search size={22} /> CONSULTAR PUNTOS</>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('openTucito'))}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <img src="/tucito.png" alt="" className="w-5 h-5 object-contain" />
                            ¿Dudas? Preguntale a Tucito
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50 w-full text-slate-400 text-sm flex flex-col items-center gap-4">
                        <span className="font-medium">¿Todavía no eres miembro?</span>
                        <button
                            onClick={() => {
                                setView('register');
                                setError('');
                            }}
                            className="w-full py-4 rounded-2xl border-2 border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400 font-black tracking-widest hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all uppercase"
                        >
                            ¡REGÍSTRATE AHORA!
                        </button>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="mt-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'register') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-500">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800 flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
                    <button
                        onClick={() => {
                            setView('login');
                            setError('');
                        }}
                        className="self-start text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-sm font-bold mb-4"
                    >
                        <ArrowLeft size={16} /> VOLVER
                    </button>

                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Crear Cuenta</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium text-center">Únete a SeituClub y empieza a sumar puntos</p>

                    <form onSubmit={handleRegister} className="w-full space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 mb-1 block">Nombre Completo *</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50/50 outline-none transition-all font-bold"
                                placeholder="Ej: Juan Pérez"
                                value={regName}
                                onChange={e => setRegName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 mb-1 block">DNI *</label>
                            <input
                                required
                                type="tel"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50/50 outline-none transition-all font-bold"
                                placeholder="Sin puntos ni espacios"
                                value={regDni}
                                onChange={e => setRegDni(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 mb-1 block">Teléfono *</label>
                            <input
                                required
                                type="tel"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50/50 outline-none transition-all"
                                placeholder="Ej: 11 1234 5678"
                                value={regPhone}
                                onChange={e => setRegPhone(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 mb-1 block">Email *</label>
                            <input
                                required
                                type="email"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50/50 outline-none transition-all"
                                placeholder="ejemplo@email.com"
                                value={regEmail}
                                onChange={e => setRegEmail(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 italic">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-brand-700 transition-all active:scale-95 shadow-xl shadow-brand-200 dark:shadow-none mt-4 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                            ) : (
                                'REGISTRARME'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-500">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* User Header */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10">
                        <Star size={120} className="text-brand-500 fill-brand-500" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center shrink-0">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{customer.name}</h2>
                            <p className="text-slate-400 dark:text-slate-500 font-bold">DNI: {customer.dni}</p>
                        </div>
                    </div>

                    <div className="bg-amber-100 dark:bg-amber-900/20 px-8 py-4 rounded-2xl flex flex-col items-center border border-amber-200 dark:border-amber-900/30 shadow-inner">
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Puntos Acumulados</span>
                        <div className="flex items-center gap-2 text-4xl font-black text-amber-600 dark:text-amber-500">
                            <Star size={32} className="fill-amber-500" />
                            {customer.points}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent History */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col animate-in slide-in-from-left-4 duration-500">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <History size={20} className="text-brand-500" />
                            Últimos Movimientos
                        </h3>
                        <div className="space-y-4 flex-1">
                            {customer.history && customer.history.length > 0 ? (
                                customer.history.slice(0, 5).map((h, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">{new Date(h.date).toLocaleDateString()}</div>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 clamp-2">
                                                {h.description || (h.pointsEarned > 0 ? 'Compra realizada' : 'Canje de puntos')}
                                            </div>
                                        </div>
                                        <div className={`font-black ${h.pointsEarned > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {h.pointsEarned > 0 ? `+${h.pointsEarned}` : `-${h.pointsRedeemed}`} pts
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 italic text-slate-300 dark:text-slate-700">Sin movimientos registrados</div>
                            )}
                        </div>
                    </div>

                    {/* Rewards Preview */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Gift size={20} className="text-amber-500" />
                            Premios para Ti
                        </h3>
                        <div className="space-y-4">
                            {rewards && rewards.length > 0 ? (
                                (showAllRewards ? rewards : rewards.slice(0, 3)).map((r, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 border-dashed animate-in slide-in-from-right-4 fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100 dark:border-slate-700 shrink-0 overflow-hidden">
                                            {r.image ? (
                                                <img src={r.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ShoppingBag size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200 truncate uppercase">{r.name}</div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className={`h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden`}>
                                                    <div
                                                        className={`h-full ${customer.points >= (r.point_cost || r.pointCost) ? 'bg-brand-500' : 'bg-amber-300 dark:bg-amber-600'} transition-all`}
                                                        style={{ width: `${Math.min((customer.points / (r.point_cost || r.pointCost)) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 shrink-0">{r.point_cost || r.pointCost} pts</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 italic text-slate-300 dark:text-slate-700">Próximamente más premios</div>
                            )}
                        </div>

                        {rewards.length > 3 && (
                            <button
                                onClick={() => setShowAllRewards(!showAllRewards)}
                                className="w-full py-2 mt-2 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-colors"
                            >
                                {showAllRewards ? 'Ver menos' : `Ver todos (${rewards.length})`}
                            </button>
                        )}
                        <button
                            onClick={() => setView('login')}
                            className="mt-8 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2 border-t border-slate-50 dark:border-slate-800 uppercase text-xs tracking-widest"
                        >
                            <ArrowLeft size={14} /> Salir
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.hash = '#/'}
                            className="flex items-center gap-2 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
                        >
                            <ArrowLeft size={18} />
                            VOLVER AL INICIO
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-brand-500 transition-all"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <a href={tenant.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none hover:scale-105 transition-transform">
                            <Facebook size={24} fill="currentColor" />
                        </a>
                        <a href={tenant.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 dark:shadow-none hover:scale-105 transition-transform">
                            <Instagram size={24} />
                        </a>
                    </div>
                </div>

                <div className="text-center text-slate-300 dark:text-slate-700 py-10 pointer-events-none select-none">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] mb-1">{tenant.franchiseName}</p>
                    <p className="text-[10px] font-medium">SISTEMA DE PUNTOS EXCLUSIVO</p>
                </div>
            </div>
        </div>
    );
}
