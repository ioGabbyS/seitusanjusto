import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useStore } from '../hooks/useStore';
import { tenant } from '../config/tenant';

export default function Login({ onLoginSuccess }) {
    const { staffUsers } = useStore();
    const [username, setUsername] = useState(tenant.adminEmail);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isSanJusto = tenant.location.toLowerCase().includes('justo');
    const displayNavLogo = isSanJusto ? '/logosanjusto.png' : '/logofinal.png';
    const displayTitleMarkup = isSanJusto ? (
        <h1 className="text-4xl font-black text-slate-900 mb-2">
            SEI TU <span className="text-brand-500">SAN JUSTO</span>
        </h1>
    ) : (
        <h1 className="text-4xl font-black text-slate-900 mb-2">
            {tenant.shortName.toUpperCase()} <span className="text-brand-500">{tenant.location.split(' ').pop().toUpperCase()}</span>
        </h1>
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // LOGIN PERSONAL LOCAL (Bypass dinámico)
            const staff = staffUsers.find(u => u.password === password);
            // Bypass para helados2026 (Personal) y Ccasares776/sanjusto2467 (Admin)
            if (password === 'helados2026' || password === 'Ccasares776' || password === 'sanjusto2467' || staff) {
                const name = (password === 'Ccasares776' || password === 'sanjusto2467') ? 'Admin Master' : (staff ? staff.name : 'Personal Local');
                const role = (password === 'Ccasares776' || password === 'sanjusto2467') ? 'admin' : 'stock';

                localStorage.setItem('seitu_auth', 'true');
                localStorage.setItem('seitu_user', name);
                localStorage.setItem('seitu_role', role);
                onLoginSuccess(role);
                return;
            }

            // LOGIN REAL con Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: username,
                password: password,
            });

            if (error) throw error;

            if (data.user) {
                localStorage.setItem('seitu_auth', 'true');
                localStorage.setItem('seitu_user', data.user.email);
                localStorage.setItem('seitu_role', 'admin');
                onLoginSuccess('admin');
            }
        } catch (err) {
            console.error(err);
            if (err.message === 'Invalid login credentials') {
                setError('Email o contraseña incorrectos.');
            } else {
                setError('Error al iniciar sesión: ' + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 flex items-center justify-center p-4">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-200 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img
                            src={displayNavLogo}
                            alt={`${tenant.franchiseName} Logo`}
                            className="h-32 w-32 object-contain border-2 border-slate-100 rounded-2xl p-2 bg-white"
                        />
                    </div>
                    {displayTitleMarkup}
                    <p className="text-slate-500 font-medium">Panel de Administración</p>
                </div>

                {/* Card de Login */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo de Usuario (editable con trampa) */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={20} className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={tenant.adminEmail}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-medium"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Campo de Contraseña */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={20} className="text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingrese su contraseña"
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-medium"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Mensaje de Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-in fade-in slide-in-from-top duration-300">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Botón de Ingresar */}
                        <button
                            type="submit"
                            disabled={!username || !password || isLoading}
                            className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <LogIn size={22} />
                                    Ingresar
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-slate-500">
                    <p>Sistema de Gestión {tenant.systemName}</p>
                </div>
            </div>
        </div>
    );
}
