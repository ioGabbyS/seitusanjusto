import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useStore();

    // El usuario pidió que sea vertical (como un interruptor de pared o similar)
    return (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 rotate-90 mb-4 origin-left">MODO</span>

            <button
                onClick={toggleTheme}
                className={`relative w-12 h-20 rounded-full transition-all duration-500 shadow-2xl flex flex-col items-center justify-between p-1.5 border-2 ${theme === 'light'
                        ? 'bg-slate-100 border-slate-200'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                title={theme === 'light' ? 'Activar Modo Noche' : 'Activar Modo Día'}
            >
                {/* Indicadores fijos */}
                <Sun size={14} className={`${theme === 'light' ? 'text-amber-500 opacity-100' : 'text-slate-700 opacity-20'} transition-all`} />
                <Moon size={14} className={`${theme === 'dark' ? 'text-indigo-400 opacity-100' : 'text-slate-300 opacity-20'} transition-all`} />

                {/* Switch dinámico (el círculo que se mueve) */}
                <div
                    className={`absolute w-9 h-9 rounded-full bg-white shadow-lg transition-all duration-500 flex items-center justify-center transform ${theme === 'light' ? 'translate-y-0' : 'translate-y-8'
                        }`}
                    style={{ top: '6px' }}
                >
                    {theme === 'light' ? (
                        <Sun size={18} className="text-amber-500 animate-spin-slow" />
                    ) : (
                        <Moon size={18} className="text-indigo-600" />
                    )}
                </div>
            </button>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}
