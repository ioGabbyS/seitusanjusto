import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export default function AIChatbot() {
    const { theme } = useStore();
    const branch = 'sanjusto';

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `¡Hola! 🎉 Soy Tucito 🐲✨ de **San Justo**. ¡Mayo es nuestro mes patrio! 🇦🇷 ¿En qué puedo ayudarte hoy?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userInput = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userInput }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/tucito-ia?v=6.0', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: userInput }],
                    branch: 'sanjusto'
                })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Hipo técnico de Tucito. 🐲" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-32 right-6 w-16 h-16 bg-cyan-500 rounded-full shadow-2xl z-[9999] hover:scale-110 active:scale-95 transition-all duration-300 group overflow-hidden border-4 border-white"
            >
                <div className="relative w-full h-full">
                    <img
                        src="https://seitucastillo.com.ar/tucito.png"
                        alt="Tucito"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                </div>
            </button>

            {isOpen && (
                <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] h-[100dvh] sm:h-[600px] bg-white sm:rounded-3xl shadow-2xl flex flex-col z-[10000] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 p-6 flex justify-between items-center text-white shrink-0 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14 bg-white rounded-2xl p-1 shadow-inner overflow-hidden">
                                <img
                                    src="https://seitucastillo.com.ar/tucito.png"
                                    alt="Tucito"
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=Tucito' }}
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl tracking-tight leading-none">Tucito</h3>
                                <p className="text-cyan-50 text-xs font-semibold mt-1 uppercase tracking-widest opacity-80">ASISTENTE DRAGÓN</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-tighter">EN LÍNEA</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors active:scale-90"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cyan-50/30 scroll-smooth custom-scrollbar" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user'
                                    ? 'bg-cyan-700 text-white rounded-br-none font-medium'
                                    : 'bg-white text-slate-700 rounded-bl-none border border-cyan-100/50 leading-relaxed'}`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-cyan-100/50 flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-100" />
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-cyan-50 shrink-0">
                        <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Send' || e.key === 'Enter' ? handleSend() : null}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-transparent px-3 py-2 outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="bg-cyan-500 text-white p-3 rounded-xl shadow-lg shadow-cyan-200 hover:bg-cyan-600 active:scale-95 disabled:opacity-50 transition-all"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-center text-[10px] font-black text-cyan-600 mt-4 tracking-tighter opacity-70 uppercase">
                            O PREGUNTAME POR PRECIOS, PROMOS O EL CLUB
                            <br />
                            <span className="flex items-center justify-center gap-1 mt-1 font-bold">
                                <Sparkles className="w-2.5 h-2.5" /> TUCITO AI TECHNOLOGY
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
