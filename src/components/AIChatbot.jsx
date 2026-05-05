import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { tenant } from '../config/tenant';

export default function AIChatbot() {
    const { theme, toggleTheme, socialLinks, landingPosts, promoBanner } = useStore();
    const branch = tenant.location.toLowerCase().includes('justo') ? 'sanjusto' : 'castillo';

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `¡Hola! 🎉 Soy Tucito 🐲✨ de la sucursal ${branch === 'sanjusto' ? 'San Justo' : 'Castillo'}. ¡Nos estamos preparando para las fiestas patrias con todo el color de nuestra bandera! 🇦🇷 ¿En qué puedo ayudarte hoy?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 300);
        }
    }, [isOpen]);

    // Listener para abrir desde afuera (v11.1)
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('openTucito', handleOpen);
        return () => window.removeEventListener('openTucito', handleOpen);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Timer para el cooldown (v11.7)
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/tucito-ia?v=8.0', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branch,
                    messages: [...messages, userMsg].slice(-10)
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
                if (data.text.includes('sin aliento')) {
                    setCooldown(45); // Cooldown de 45 segundos para v12.5
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Ups, tuve un problemita técnico. ¿Podrías intentar de nuevo? 🍦' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, no puedo conectarme en este momento. ¡Seguro estoy batiendo helado! 🍧' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-32 right-6 sm:bottom-36 sm:right-12 z-[9999] font-sans">
            {/* Botón de Burbuja */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative bg-brand-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-brand-500/50 active:scale-95"
                >
                    <div className="absolute inset-0 bg-brand-500 rounded-full animate-ping opacity-20 pointer-events-none"></div>
                    <img src="/tucito.png" alt="Tucito" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest shadow-xl uppercase">
                        ¡Hablá con Tucito!
                    </span>
                </button>
            )}

            {/* Ventana de Chat */}
            {isOpen && (
                <div className="w-[350px] sm:w-[380px] h-[550px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500">

                    {/* Header */}
                    <div className="bg-brand-500 p-6 flex justify-between items-center text-white relative h-32 shrink-0">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-white/30 overflow-hidden shadow-inner">
                                    <img src="/tucito.png" alt="Tucito" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight leading-none">Tucito</h3>
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Asistente Dragón</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">En línea</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors relative z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* Círculos decorativos */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-amber-300 opacity-20 rounded-full blur-2xl"></div>
                    </div>

                    {/* Chat Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
                    >
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium ${m.role === 'user'
                                    ? 'bg-slate-900 text-white rounded-tr-none'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700/50'
                                    } shadow-sm`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl rounded-tl-none border border-slate-100 dark:border-slate-700/50 flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Input */}
                    <form onSubmit={handleSend} className="p-6 pt-2 border-t border-slate-50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={isLoading || cooldown > 0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    inputRef.current?.focus();
                                }}
                                onFocus={(e) => e.target.select()}
                                placeholder={cooldown > 0 ? `Recuperando aliento (${cooldown}s)...` : "Escribe un mensaje..."}
                                className={`w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white font-medium transition-all cursor-text relative z-20 ${(isLoading || cooldown > 0) ? 'opacity-50 cursor-wait' : ''}`}
                                style={{ pointerEvents: 'auto' }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-2 bg-brand-500 text-white p-2.5 rounded-xl hover:bg-brand-600 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <div className="text-center mt-4 flex flex-col items-center gap-1">
                            <a
                                href="#/portal"
                                className="text-[10px] text-brand-500 font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                            >
                                O preguntame por precios, promos o el Club
                            </a>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60 flex items-center justify-center gap-1.5">
                                <Sparkles size={10} className="text-brand-500" /> Tucito AI Technology
                            </p>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
