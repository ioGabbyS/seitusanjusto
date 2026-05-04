import React, { useState, useEffect } from 'react';
import { Star, Gift, ShoppingBag, ArrowRight, X, Trophy, Heart, Users, MapPin, Clock, Coffee, Instagram, Facebook, Menu } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useStore } from '../hooks/useStore';
import { tenant } from '../config/tenant';

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPromo, setShowPromo] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const { theme, toggleTheme, socialLinks, landingPosts, promoBanner } = useStore();
    const [rewards, setRewards] = useState([]);

    const isSanJusto = tenant.location.toLowerCase().includes('justo');
    const displayTitle = isSanJusto ? "El helado que más amás en San Justo." : "El helado que más amás.";

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        const loadRewards = async () => {
            const { data } = await supabase.from('rewards').select('*').limit(12);
            if (data) setRewards(data);
        };
        loadRewards();

        if (promoBanner?.active && promoBanner?.img) {
            const timer = setTimeout(() => setShowPromo(true), 1500);
            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [promoBanner]);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    const allImages = [
        { id: 1, title: 'Nuestros Sabores', image: '/helados_banner.jpg' },
        { id: 2, title: 'Cremas Premium', image: '/cremas_1.jpg' },
        { id: 3, title: 'Chocolates', image: '/chocolates.jpg' },
        { id: 4, title: 'Dulce de Leche', image: '/dulces_de_leche.jpg' }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 transition-colors duration-500">
            {/* NAV */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={isSanJusto ? "/logosanjusto.png" : "/logofinal.png"} alt="Logo" className="h-10 w-10 object-contain" />
                        <span className="font-black text-xl tracking-tighter dark:text-white uppercase">{tenant.name}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {['sabores', 'premios', 'contacto'].map(item => (
                            <button key={item} onClick={() => scrollTo(item)} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-brand-500 transition-colors">{item}</button>
                        ))}
                        <a href="#/portal" className="bg-brand-500 text-white px-6 py-2.5 rounded-full font-black text-sm hover:bg-brand-600 transition-transform active:scale-95 shadow-lg shadow-brand-500/20">ACCESO CLUB</a>
                    </div>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden dark:text-white"><Menu /></button>
                </div>
            </nav>

            {/* HERO */}
            <section className="relative pt-48 pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="relative z-10">
                        <span className="inline-block bg-brand-50 text-brand-600 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6 animate-bounce">¡Bienvenido!</span>
                        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-slate-900 dark:text-white mb-8">
                            {displayTitle.split(' ').map((word, i) => (
                                <span key={i} className={word.toLowerCase() === 'amás.' ? 'text-brand-500' : ''}>{word} </span>
                            ))}
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-lg font-medium leading-relaxed">Disfrutá del mejor helado artesanal con la calidad que ya conocés. Vení a vivir un momento único.</p>
                        <div className="flex flex-wrap gap-4">
                            <a href="#/portal" className="px-8 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-lg hover:-translate-y-1 transition-all shadow-xl">MIEMBROS CLUB</a>
                            <button onClick={() => scrollTo('sabores')} className="px-8 py-5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all dark:text-white">VER SABORES</button>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-brand-500 rounded-full blur-[120px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <img src={isSanJusto ? "/sanjusto2.png" : "/logofinal.png"} alt="Hero" className="relative w-full max-w-lg mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)] animate-float" />
                    </div>
                </div>
            </section>

            {/* SABORES SLIDER */}
            <section id="sabores" className="py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6 mb-16">
                    <h2 className="text-5xl font-black tracking-tighter dark:text-white">Nuestras <span className="text-brand-500">Tentaciones</span></h2>
                </div>
                <div className="flex overflow-x-auto gap-8 px-6 pb-12 no-scrollbar scroll-smooth">
                    {allImages.map(img => (
                        <div key={img.id} onClick={() => setModalImage(img.image)} className="flex-none w-[320px] md:w-[400px] aspect-[4/5] rounded-[3rem] overflow-hidden group relative cursor-pointer shadow-2xl">
                            <img src={img.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={img.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-10">
                                <h4 className="text-white text-3xl font-black">{img.title}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* PREMIOS */}
            <section id="premios" className="py-24">
                <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                    <h2 className="text-5xl font-black tracking-tighter dark:text-white uppercase">Seitu <span className="text-brand-500">Club</span></h2>
                    <p className="text-slate-500 mt-4 font-bold text-lg">Tus puntos valen helado. ¡Canjealos hoy!</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {rewards.map(reward => (
                        <div key={reward.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-50 dark:border-slate-800 hover:-translate-y-2 transition-all">
                            <div className="w-full aspect-square rounded-3xl overflow-hidden mb-6 bg-slate-100">
                                <img src={reward.image} className="w-full h-full object-cover" alt={reward.name} />
                            </div>
                            <h3 className="font-black text-xl mb-2 dark:text-white uppercase leading-none">{reward.name}</h3>
                            <p className="text-brand-500 font-black italic flex items-center gap-2"><Trophy size={18} /> {reward.pointCost} Puntos</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* BENEFICIOS */}
            <section className="py-32 bg-brand-500">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-white">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8 mx-auto"><Users size={32} /></div>
                        <h3 className="text-2xl font-black mb-4">Familia Seitu</h3>
                        <p className="text-white/80 font-medium leading-relaxed">Más de 25 años compartiendo momentos dulces con vos.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8 mx-auto"><Trophy size={32} /></div>
                        <h3 className="text-2xl font-black mb-4">Mejor Calidad</h3>
                        <p className="text-white/80 font-medium leading-relaxed">Materia prima seleccionada para un sabor artesanal único.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8 mx-auto"><Coffee size={32} /></div>
                        <h3 className="text-2xl font-black mb-4">Mucho más que helado</h3>
                        <p className="text-white/80 font-medium leading-relaxed">Cafetería de especialidad y la mejor atención en el local.</p>
                    </div>
                </div>
            </section>

            {/* CONTACTO */}
            <section id="contacto" className="py-24 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-5xl font-black mb-12 dark:text-white">Ubicación y <span className="text-brand-500">Horarios</span></h2>
                        <div className="space-y-10">
                            <div className="flex gap-6 items-start">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-brand-500 shrink-0"><MapPin size={28} /></div>
                                <div>
                                    <h4 className="font-black text-xl mb-1 dark:text-white uppercase tracking-tighter">Donde estamos</h4>
                                    <p className="text-slate-500 font-medium text-lg italic">{isSanJusto ? "Av. Pte. Illia 2467, San Justo." : "Carlos Casares 776, Castillo."}</p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-start">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-brand-500 shrink-0"><Clock size={28} /></div>
                                <div>
                                    <h4 className="font-black text-xl mb-1 dark:text-white uppercase tracking-tighter">Abierto Siempre</h4>
                                    <p className="text-slate-500 font-medium text-lg italic">Lunes a Domingo: 08:00 - 24:00 HS</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-[450px] rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-slate-50 dark:border-slate-900">
                        <iframe
                            src={isSanJusto ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3280.9701768407986!2d-58.5615707242566!3d-34.67885757292723!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc795908b9c1d%3A0xe2b49c0d9c490a2!2sAv.%20Pte.%20Illia%202467%2C%20B1754%20San%20Justo%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses!2sar!4v1700000000000!5m2!1ses!2sar" : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3279.790515152504!2d-58.6256!3d-34.7081!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDQyJzI5LjIiUyA1OMKwMzcnMzIuMiJX!5e0!3m2!1ses!2sar!4v1700000000000!5m2!1ses!2sar"}
                            width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-900 py-24 px-6 text-slate-500">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                    <div className="flex items-center gap-4">
                        <img src={isSanJusto ? "/logosanjusto.png" : "/logofinal.png"} className="h-12 w-12" alt="Logo" />
                        <div>
                            <h3 className="text-white text-2xl font-black uppercase tracking-tighter leading-none">Seitu</h3>
                            <p className="text-brand-500 font-black tracking-widest text-[10px] uppercase">{isSanJusto ? "San Justo" : "Castillo"}</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <a href={socialLinks.instagram} className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-brand-500 transition-all"><Instagram /></a>
                        <a href={socialLinks.facebook} className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-brand-500 transition-all"><Facebook /></a>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">© {new Date().getFullYear()} {tenant.name}</p>
                </div>
            </footer>

            {/* MODALS */}
            {modalImage && (
                <div className="fixed inset-0 z-[1000] bg-black/95 p-6 flex items-center justify-center" onClick={() => setModalImage(null)}>
                    <img src={modalImage} className="max-w-full max-h-full rounded-3xl shadow-2xl" />
                </div>
            )}

            {showPromo && promoBanner?.active && promoBanner?.img && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="relative w-full max-w-lg aspect-[4/5] bg-white rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <button onClick={() => setShowPromo(false)} className="absolute top-8 right-8 z-30 bg-black/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/50 transition-all"><X /></button>
                        <div className="w-full h-full cursor-pointer" onClick={() => promoBanner.url && window.open(promoBanner.url, '_blank')}>
                            <img src={promoBanner.img} className="w-full h-full object-cover" alt="Promo" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
