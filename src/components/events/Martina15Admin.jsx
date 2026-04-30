import React, { useState, useEffect } from 'react';
import { useStore } from '../../hooks/useStore';
import { Check, X, Image as ImageIcon, CheckCircle, Clock, Trash2, ShieldCheck, Lock, Zap, ZapOff, RefreshCcw, Download } from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';

const Martina15Admin = () => {
    const { eventPostsMartina, updateEventPostMartina, deleteEventPostMartina, autoApproveMartina, setMartinaAutoApprove, clearEventMartinaData, loadData } = useStore();
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('martina_admin_auth') === 'true');
    const [error, setError] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '15marti' || password === '15MARTI') {
            setIsAuthenticated(true);
            localStorage.setItem('martina_admin_auth', 'true');
            setError(false);
        } else {
            setError(true);
            setPassword('');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('martina_admin_auth');
    };

    const manualRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const handleDownloadMemories = () => {
        if (approvedPosts.length === 0) {
            alert("No hay mensajes publicados para descargar todavía.");
            return;
        }

        const data = approvedPosts.map(p => ({
            'Fecha': new Date(p.timestamp).toLocaleString('es-AR'),
            'Autor': p.author,
            'Mensaje': p.comment,
            'Link a Foto': p.img || 'Sin foto'
        }));

        exportToExcel(data, `Recuerdos_15_Martina_${new Date().toISOString().split('T')[0]}`, 'Recuerdos');
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, loadData]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-rose-100 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-rose-200 text-white">
                        <Lock size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-rose-950 mb-2 uppercase tracking-tighter italic">Panel Martina</h1>
                    <p className="text-rose-600 font-bold mb-8 opacity-70">Acceso exclusivo para moderación</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="C L A V E"
                            className={`w-full bg-slate-50 border-2 ${error ? 'border-red-400 animate-shake' : 'border-slate-100 focus:border-rose-400'} p-5 rounded-2xl text-center font-black text-2xl outline-none transition-all tracking-[0.5em] text-rose-950`}
                            autoFocus
                        />
                        {error && <p className="text-red-500 font-black text-xs uppercase tracking-widest">Clave incorrecta</p>}
                        <button
                            type="submit"
                            className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-rose-200 active:scale-95 uppercase tracking-widest"
                        >
                            ENTRAR
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const pendingPosts = eventPostsMartina.filter(p => !p.approved);
    const approvedPosts = eventPostsMartina.filter(p => p.approved);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans overflow-x-hidden">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-rose-500 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-rose-200 text-white relative group cursor-pointer" onClick={manualRefresh}>
                            <ShieldCheck size={32} />
                            <div className={`absolute inset-0 bg-rose-600 rounded-[1.5rem] flex items-center justify-center transition-opacity ${isRefreshing ? 'opacity-100' : 'opacity-0'}`}>
                                <RefreshCcw size={24} className="animate-spin" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Martina 15 <span className="text-rose-500 invisible md:visible">• Panel</span></h1>
                                <button onClick={handleLogout} className="text-xs font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors">Salir</button>
                            </div>
                            <p className="text-slate-500 font-bold text-sm tracking-tight opacity-60 italic">Moderación en tiempo real</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={manualRefresh}
                            className={`px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-rose-300 transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest text-slate-600 ${isRefreshing ? 'opacity-50' : ''}`}
                        >
                            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Refrescar' : 'Refrescar'}
                        </button>

                        <button
                            onClick={() => setMartinaAutoApprove(!autoApproveMartina)}
                            className={`px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest ${autoApproveMartina ? 'bg-green-500 shadow-green-100 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}
                        >
                            {autoApproveMartina ? <Zap size={18} className="fill-current" /> : <ZapOff size={18} />}
                            Auto: {autoApproveMartina ? 'ON' : 'OFF'}
                        </button>

                        <button
                            onClick={clearEventMartinaData}
                            className="px-6 py-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl shadow-sm border border-red-100 transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest"
                        >
                            <Trash2 size={16} />
                            Reiniciar
                        </button>

                        <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            <span className="font-black text-[10px] text-slate-700 uppercase tracking-widest">{pendingPosts.length} PENDIENTES</span>
                        </div>
                        <div className="px-6 py-3 bg-rose-500 rounded-2xl shadow-lg shadow-rose-100 flex items-center gap-3 text-white">
                            <ImageIcon size={14} className="text-white" />
                            <span className="font-black text-[10px] uppercase tracking-widest">{approvedPosts.length} PUBLICADOS</span>
                        </div>

                        <button
                            onClick={handleDownloadMemories}
                            className="px-6 py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-2xl shadow-sm border border-indigo-100 transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest"
                            title="Descargar todos los mensajes y fotos en Excel"
                        >
                            <Download size={16} />
                            Recuerdos
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Clock size={20} className="text-amber-500" />
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Esperando</h2>
                        </div>

                        {pendingPosts.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center text-slate-300">
                                <p className="font-black uppercase tracking-widest text-[10px]">No hay mensajes nuevos</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingPosts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onApprove={() => updateEventPostMartina(post.id, { approved: true })}
                                        onDelete={() => deleteEventPostMartina(post.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle size={20} className="text-rose-500" />
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">En Pantalla</h2>
                        </div>

                        {approvedPosts.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center text-slate-300">
                                <p className="font-black uppercase tracking-widest text-[10px]">Nada en pantalla todavía</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {approvedPosts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onApprove={null}
                                        onDelete={() => deleteEventPostMartina(post.id)}
                                        isApproved
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

const PostCard = ({ post, onApprove, onDelete, isApproved = false }) => (
    <div className={`bg-white rounded-[2rem] border overflow-hidden p-6 flex flex-col sm:flex-row gap-6 transition-all ${isApproved ? 'border-rose-50 shadow-sm opacity-80 sm:scale-95 origin-left' : 'border-amber-100 shadow-md ring-1 ring-amber-50 animate-in fade-in slide-in-from-right-4'}`}>
        {post.img ? (
            <div className="w-full sm:w-28 h-56 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner bg-slate-100 border border-slate-100">
                <img src={post.img} alt="Post" className="w-full h-full object-cover" />
            </div>
        ) : (
            <div className="w-full sm:w-28 h-28 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
                <ImageIcon size={32} />
            </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-rose-500 text-[9px] uppercase tracking-widest truncate max-w-[150px]">DE: {post.author}</span>
                        {isApproved && post.approvedDirectly && (
                            <span className="bg-rose-50 text-rose-400 text-[7px] px-2 py-0.5 rounded-full font-black uppercase border border-rose-100 flex items-center gap-1">
                                <Zap size={8} className="fill-current" /> AUTO
                            </span>
                        )}
                    </div>
                    <span className="text-slate-300 text-[8px] font-bold uppercase">{new Date(post.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-700 font-bold text-base leading-tight line-clamp-2 italic">
                    "{post.comment}"
                </p>
            </div>

            <div className="flex items-center gap-2 pt-4">
                {onApprove && (
                    <button
                        onClick={onApprove}
                        className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Check size={14} /> APROBAR
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="p-2.5 bg-red-50 hover:bg-red-500 text-red-300 hover:text-white rounded-xl transition-all active:scale-90"
                    title="Eliminar"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    </div>
);

export default Martina15Admin;
