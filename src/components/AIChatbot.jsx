import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export default function AIChatbot() {
    const { theme } = useStore();
    const branch = 'sanjusto';

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `¡Hola! 🎉 Soy Tucito 🐲✨ de **San Justo**. ¡Mayo es mes patrio! 🇦🇷 ¿En qué puedo ayudarte hoy?` }
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
            const response = await fetch('/api/tucito-ia?v=8.0', {
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
        <div className="fixed bottom-32 right-6 sm:bottom-36 sm:right-12 z-[9999] font-sans">
            {/* Botón de Burbuja COPIADO DE CASTILLO */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative bg-cyan-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-cyan-500/50 active:scale-95"
                >
                    <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-20 pointer-events-none"></div>
                    <img src="https://seitucastillo.com.ar/tucito.png" alt="Tucito" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest shadow-xl uppercase">
                        ¡Hablá con Tucito!
                    </span>
                </button>
            )}

            {/* Ventana de Chat */}
            {isOpen && (
                <div className="w-[350px] sm:w-[380px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
                    {/* Header */}
                    <div className="bg-cyan-500 p-6 flex justify-between items-center text-white relative h-32 shrink-0">
                        <div className="relative z-10 font-sans">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-white/30 overflow-hidden shadow-inner">
                                    <img src="https://seitucastillo.com.ar/tucito.png" alt="Tucito" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h2 className="font-black text-xl tracking-tight leading-none m-0 p-0" style={{ color: 'white' }}>Tucito</h2>
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Asistente Dragón</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">En línea</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors relative z-10">
                            <X size={20} />
                        </button>
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-amber-300 opacity-20 rounded-full blur-2xl"></div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 scroll-smooth" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'}`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-6 pt-2 border-t border-slate-50 bg-white/50 backdrop-blur-md">
                        <div className="relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' ? handleSend() : null}
                                placeholder="Escribe un mensaje..."
                                className="w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-cyan-500/20 text-slate-900 font-medium transition-all"
                            />
                            <button onClick={handleSend} className="absolute right-2 top-2 bg-cyan-500 text-white p-2.5 rounded-xl hover:bg-cyan-600">
                                <Send size={20} />
                            </button>
                        </div>
                        <p className="text-center mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60 flex items-center justify-center gap-1.5">
                            <Sparkles size={10} className="text-cyan-500" /> Tucito AI Technology
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
