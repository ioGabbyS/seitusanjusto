
import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, TrendingUp, BookOpen, DollarSign, Menu, X, BarChart3, Settings, Wallet, Users, Gift, LogOut, Sun, Moon, Truck, ClipboardList, Instagram } from 'lucide-react';
import Metrics from './Metrics';
import { useStore } from '../hooks/useStore';

export default function Layout({ children, activeTab, onTabChange, onLogout, userRole = 'admin' }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, toggleTheme, isSyncing, socialLinks, syncError } = useStore();

    const navItems = [
        { id: 'sales', label: 'Crear Pedido', icon: TrendingUp },
        { id: 'cash', label: 'Caja', icon: DollarSign },
        { id: 'customers', label: 'Clientes', icon: Users },
        { id: 'points-catalog', label: 'Tienda Puntos', icon: Gift },
        { id: 'metrics', label: 'Métricas', icon: BarChart3 },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ice-cream-stock', label: 'Control de Baldes', icon: BarChart3 },
        { id: 'ice-cream-unit-control', label: 'Control de Helados', icon: ClipboardList },
        { id: 'finances', label: 'Finanzas', icon: Wallet },
        { id: 'inventory', label: 'Stock', icon: Package },
        { id: 'catalog', label: 'Catálogo', icon: BookOpen },
        { id: 'purchases', label: 'Compras', icon: ShoppingCart },
        { id: 'settings', label: 'Config', icon: Settings },
    ].filter(item => {
        if (userRole === 'stock') {
            return item.id === 'ice-cream-stock' || item.id === 'ice-cream-unit-control';
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-20 bg-slate-900 border-r border-slate-800 text-white min-h-screen shadow-xl z-20 items-center">
                <div className="p-4 border-b border-slate-800 flex flex-col items-center gap-3">
                    <img src="/logosanjusto.png" alt="Logo" className="w-12 h-12 object-contain" title="Sei Tu San Justo" />

                    {/* Botón de Sincronización Manual */}
                    <button
                        onClick={() => window.location.reload()}
                        className={`group p-2 rounded-full transition-all duration-500 ${isSyncing ? 'bg-brand-500/20 rotate-180' : syncError ? 'bg-red-500/20' : 'bg-slate-800 hover:bg-brand-600'}`}
                        title={syncError ? `Error: ${syncError}` : "Sincronizar ahora (F5)"}
                    >
                        <Truck size={16} className={`${isSyncing ? 'text-brand-500 animate-bounce' : syncError ? 'text-red-500' : 'text-slate-400 group-hover:text-white'}`} />
                    </button>

                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500' : syncError ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className={`text-[7px] font-black uppercase tracking-widest leading-none ${syncError ? 'text-red-500' : 'text-slate-500'}`}>
                            {isSyncing ? 'Sync' : syncError ? 'Error' : 'Cloud'}
                        </span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`w-full flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    } `}
                                title={item.label}
                            >
                                <Icon size={24} className={activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                                <span className="text-[10px] font-medium hidden md:block text-center leading-tight">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-800 space-y-4">
                    <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 hover:text-white group"
                        title="Ver Instagram"
                    >
                        <Instagram size={24} className="text-slate-500 group-hover:text-white" />
                        <span className="text-[10px] font-medium">Insta</span>
                    </a>
                    <a
                        href={socialLinks.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-black hover:text-white group"
                        title="Ver TikTok"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-slate-500 group-hover:text-white">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01-.01 2.62-.02 5.24-.04 7.86-.02 2.04-.6 4.12-1.93 5.71-1.4 1.75-3.69 2.58-5.88 2.37-2.31-.22-4.46-1.63-5.55-3.69-1.34-2.48-1.12-5.74.56-8 1.14-1.55 3.01-2.5 4.93-2.5.42 0 .84.05 1.25.13v4.16c-.43-.16-.9-.24-1.36-.21-1.34.07-2.61.94-3.04 2.21-.49 1.4-.1 3.11.97 4.13 1.01 1.01 2.6 1.25 3.86.6 1.04-.54 1.66-1.66 1.76-2.82.04-1.11.02-2.22.02-3.33V.02z" />
                        </svg>
                        <span className="text-[10px] font-medium">TikTok</span>
                    </a>
                    <button
                        onClick={onLogout}
                        className="w-full flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-red-600 hover:text-white group"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={24} className="text-slate-500 group-hover:text-white" />
                        <span className="text-[10px] font-medium">Salir</span>
                    </button>
                </div>
                <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                    v5.8.0 &copy; 2026
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">Seitu Manager</span>
                    {isSyncing && (
                        <div className="flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                            <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-ping"></div>
                        </div>
                    )}
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 z-40 p-4 shadow-xl">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === item.id ? 'bg-brand-600 text-white' : 'text-slate-400'
                                    } `}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <button
                        onClick={() => {
                            onLogout();
                            setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition-all"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
