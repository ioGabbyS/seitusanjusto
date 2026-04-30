import React, { useState, useEffect } from 'react';
import { useStore } from '../../hooks/useStore';
import { Heart, Sparkles, Music, Star } from 'lucide-react';

const Paloma15Show = () => {
    const { eventPostsPaloma, loadData } = useStore();
    const approvedPosts = eventPostsPaloma.filter(p => p.approved);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Polling: Actualizar datos de Supabase cada 30 segundos (Suficiente para el Show)
    useEffect(() => {
        const syncInterval = setInterval(() => {
            loadData();
        }, 30000);
        return () => clearInterval(syncInterval);
    }, [loadData]);

    // Rotar posts cada 8 segundos
    useEffect(() => {
        if (approvedPosts.length <= 1) {
            setCurrentIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % approvedPosts.length);
                setIsVisible(true);
            }, 1000);
        }, 8000);

        return () => clearInterval(interval);
    }, [approvedPosts.length]);

    // Si no hay posts aprobados, mostrar placeholder elegante
    if (approvedPosts.length === 0) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-12 text-center text-white overflow-hidden">
                <div className="absolute inset-0 opacity-50">
                    <img src="/paloma.png" alt="Paloma" className="w-full h-full object-cover blur-sm scale-110" />
                    <div className="absolute inset-0 bg-sky-950/40"></div>
                </div>
                <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-1000">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-8 shadow-2xl border border-white/30">
                        <Heart size={48} className="text-white fill-white" />
                    </div>
                    <h1 className="text-[8vw] font-black tracking-widest leading-none mb-4 drop-shadow-2xl uppercase">
                        PALOMA
                    </h1>
                    <div className="h-1.5 w-32 bg-sky-400 rounded-full mb-8 shadow-lg shadow-sky-500/50"></div>
                    <p className="text-3xl font-bold tracking-tight text-white drop-shadow-lg max-w-2xl italic">
                        "Escaneá el código QR y compartí tus mensajes y fotos"
                    </p>
                </div>
            </div>
        );
    }

    const effectiveIndex = currentIndex >= approvedPosts.length ? 0 : currentIndex;
    const currentPost = approvedPosts[effectiveIndex];

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col md:flex-row overflow-hidden font-sans">
            <BackgroundDecorations />

            {/* Panel Izquierdo: FOTO (Mejorado para no cortar) */}
            <div className="flex-1 relative overflow-hidden min-h-0 bg-black flex items-center justify-center">
                {/* Fondo borroso para rellenar huecos (usar foto del post o la de Paloma por defecto) */}
                <div className="absolute inset-0 opacity-40 blur-3xl scale-110">
                    <img src={currentPost.img || '/paloma.png'} alt="Blur" className="w-full h-full object-cover" />
                </div>

                <div className={`relative z-10 w-full h-full p-4 flex items-center justify-center transition-all duration-1000 ease-in-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                    <img
                        src={currentPost.img || '/paloma.png'}
                        alt="Momento Paloma"
                        className="max-w-full max-h-full object-contain rounded-[1.5rem] md:rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-2 border-white/20"
                    />
                </div>

                {/* Branding superpuesto */}
                <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20 flex items-center gap-2 md:gap-4 bg-black/30 backdrop-blur-md p-2 md:p-4 rounded-2xl md:rounded-3xl border border-white/10">
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-sky-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg text-white">
                        <span className="text-xl md:text-3xl font-black italic">15</span>
                    </div>
                    <div className="pr-2 md:pr-4">
                        <h3 className="text-xl md:text-3xl font-black text-white tracking-widest uppercase leading-none">PALOMA</h3>
                        <div className="flex items-center gap-1 md:gap-2 text-sky-300 font-bold tracking-widest text-[8px] md:text-[10px] uppercase italic">
                            <Sparkles size={10} className="md:size-[12px]" /> EL EVENTO DEL AÑO
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel Derecho: MENSAJE (Ajustado responsivo) */}
            <div className="w-full md:w-[40vw] lg:w-[35vw] bg-white h-[40vh] md:h-full relative z-30 flex flex-col justify-center p-8 md:p-12 lg:p-20 overflow-hidden border-t md:border-t-0 md:border-l border-sky-100 shadow-2xl">
                <div className={`transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : 'md:translate-x-full md:translate-y-0 translate-y-full opacity-0'}`}>

                    {/* Comillas decorativas */}
                    <div className="absolute top-4 left-4 md:top-8 md:left-8 opacity-5 text-sky-900 pointer-events-none">
                        <svg className="w-10 h-10 md:w-20 md:h-20" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V5C14.017 3.34315 15.3601 2 17.017 2H19.017C20.6738 2 22.017 3.34315 22.017 5V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM2.01697 21L2.01697 18C2.01697 16.8954 2.9124 16 4.01697 16H7.01697C7.56925 16 8.01697 15.5523 8.01697 15V9C8.01697 8.44772 7.56925 8 7.01697 8H4.01697C2.9124 8 2.01697 7.10457 2.01697 6V5C2.01697 3.34315 3.36012 2 5.01697 2H7.01697C8.67382 2 10.017 3.34315 10.017 5V15C10.017 18.3137 7.33068 21 4.01697 21H2.01697Z" /></svg>
                    </div>

                    <div className="space-y-4 md:space-y-8">
                        {/* Autor */}
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-1 h-8 md:h-12 bg-sky-500 rounded-full"></div>
                            <div>
                                <span className="block text-sky-400 font-black text-[8px] md:text-[10px] tracking-[0.3em] uppercase mb-0.5">DEDICATORIA DE</span>
                                <h4 className="text-xl md:text-3xl font-black text-sky-950 tracking-tighter uppercase line-clamp-1">{currentPost.author}</h4>
                            </div>
                        </div>

                        {/* Comentario Ajustado Font Size */}
                        <p className="text-lg md:text-4xl lg:text-5xl font-black text-sky-900 leading-[1.2] md:leading-[1.1] tracking-tight whitespace-pre-wrap line-clamp-[5] md:line-clamp-[8] italic">
                            "{currentPost.comment}"
                        </p>

                        <div className="flex items-center gap-2 md:gap-4 pt-2 md:pt-6">
                            <Heart size={20} className="md:size-[24px] text-sky-500 fill-sky-500" />
                            <div className="h-px flex-1 bg-sky-100"></div>
                            <Sparkles size={20} className="md:size-[24px] text-sky-300" />
                        </div>
                    </div>
                </div>

                {/* Footer del Show */}
                <div className="absolute bottom-4 left-8 right-8 md:bottom-8 md:left-12 md:right-12 flex justify-center items-center border-t border-sky-50 pt-4 md:pt-6">
                    <div className="flex items-center gap-2">
                        <Music size={12} className="md:size-[14px] text-sky-200" />
                        <span className="font-black text-[8px] md:text-[10px] uppercase tracking-widest text-sky-900">#MIS15PALOMA</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BackgroundDecorations = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-400/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
    </div>
);

export default Paloma15Show;
