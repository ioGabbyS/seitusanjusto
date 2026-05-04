import React, { useState, useEffect } from 'react';
import { Star, Gift, ShoppingBag, ArrowRight, X, Trophy, Heart, Users, MapPin, Clock, Coffee, Instagram, Facebook, Menu, Moon, Sun, Plus } from 'lucide-react';
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
        { id: 1, title: 'Cremas', image: '/cremas_1.jpg' },
        { id: 2, title: 'Chocolates', image: '/chocolates.jpg' },
        { id: 3, title: 'Dulces', image: '/dulces_de_leche.jpg' },
        { id: 4, title: 'Aguas', image: '/aguas.jpg' }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 transition-colors duration-500">
            {/* NAV BAR */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={isSanJusto ? "/logosanjusto.png" : "/logofinal.png"} alt="Logo" className="h-10 w-10 object-contain" />
                        <span className="font-black text-2xl tracking-tighter dark:text-white uppercase leading-none">{isSanJusto ? "SAN JUSTO" : "CASTILLO"}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {['inicio', 'sabores', 'puntos', 'nosotros'].map(item => (
                            <button key={item} onClick={() => scrollTo(item)} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-400 transition-colors">{item}</button>
                        ))}
                        <a href="#/portal" className="bg-brand-400 text-white px-8 py-3 rounded-full font-black text-[10px] tracking-widest hover:bg-brand-500 shadow-xl shadow-brand-400/20 transition-all uppercase">Acceso Club</a>
                    </div>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden dark:text-white"><Menu /></button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section id="inicio" className="relative pt-40 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <Star className="text-brand-400 fill-brand-400" size={14} />
                            <span className="text-brand-400 font-black text-[10px] tracking-[0.3em] uppercase">Franquicia Oficial Sei Tu</span>
                        </div>
                        <h1 className="text-[5.5rem] md:text-[8.5rem] font-black leading-[0.8] tracking-tighter text-slate-900 dark:text-white mb-10">
                            El helado <br /> que más <br /> <span className="text-brand-400">amás.</span>
                        </h1>
                        <p className="text-xl text-slate-400 dark:text-slate-400 mb-10 max-w-lg font-medium leading-relaxed italic">
                            Disfrutá de la calidad Sei Tu en {isSanJusto ? "San Justo" : "Rafael Castillo"}. Sabores inolvidables, momentos compartidos y el café que elegís todos los días.
                        </p>

                        <p className="text-brand-400 font-black italic text-lg leading-snug mb-10 max-w-md">
                            "Creamos un ambiente donde cada visita se convierte en una experiencia agradable, invitando a volver una y otra vez."
                        </p>

                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-6 max-w-md mb-12">
                            <img src="/5hispanos.png" className="w-16 h-16 object-contain shrink-0" />
                            <div>
                                <span className="text-brand-400 font-black text-[9px] tracking-widest uppercase">Cafetería Premium</span>
                                <h4 className="text-slate-800 dark:text-white font-black text-lg leading-tight">Desde 1962, el Café más elegido de Argentina.</h4>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-8 items-start">
                            <div>
                                <a href="#/portal" className="px-10 py-5 bg-brand-400 text-white rounded-2xl font-black text-lg shadow-2xl shadow-brand-400/30 flex items-center gap-3 active:scale-95 transition-transform"><Gift size={22} /> MIEMBROS CLUB</a>
                                <div className="mt-4 space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Star size={10} className="text-brand-400" /> Cada compra suma.</div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Star size={10} className="text-brand-400" /> Cada punto recompensa.</div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Star size={10} className="text-brand-400" /> Cada visita cuenta.</div>
                                </div>
                            </div>
                            <div>
                                <button onClick={() => scrollTo('nosotros')} className="px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl font-black text-lg shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors">CONOCÉ MÁS</button>
                                <div className="mt-4 space-y-1 ml-6">
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">• Sobre Nosotros</div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">• Nuestra Historia</div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">• Nuestra Pasión</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative lg:scale-110 lg:translate-x-10">
                        <div className="absolute inset-0 bg-brand-400 rounded-full blur-[150px] opacity-20"></div>
                        <img src={isSanJusto ? "/sanjusto2.png" : "/logofinal.png"} alt="Hero" className="relative w-full max-w-2xl mx-auto drop-shadow-2xl animate-float" />
                    </div>
                </div>
            </section>

            {/* CONOCÉ NUESTROS SABORES */}
            <section id="sabores" className="py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row justify-between items-end gap-12">
                    <div>
                        <h2 className="text-6xl md:text-8xl font-black tracking-tighter dark:text-white">Conocé nuestros <span className="text-brand-400">sabores</span></h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Exclusividad en cada cucharada</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-900 dark:text-white shadow-xl border border-slate-100 dark:border-slate-800"><Plus size={24} /></button>
                        <button className="w-14 h-14 bg-slate-900 dark:bg-slate-800 rounded-full flex items-center justify-center text-white shadow-xl"><ArrowRight size={24} /></button>
                    </div>
                </div>
                <div className="flex overflow-x-auto gap-8 px-6 pb-12 no-scrollbar">
                    {allImages.map(img => (
                        <div key={img.id} onClick={() => setModalImage(img.image)} className="flex-none w-[320px] md:w-[450px] aspect-[4/3] rounded-[4rem] overflow-hidden group relative cursor-pointer shadow-2xl">
                            <img src={img.image} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12 opacity-0 group-hover:opacity-100 transition-opacity">
                                <h4 className="text-white text-3xl font-black uppercase tracking-tighter">{img.title}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SOCIAL FEED */}
            <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6 mb-16">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                        <div>
                            <span className="inline-block bg-pink-50 text-pink-500 px-4 py-2 rounded-xl font-black text-[10px] tracking-widest uppercase mb-6 flex items-center gap-2"><Instagram size={14} /> Social Feed</span>
                            <h2 className="text-6xl md:text-8xl font-black tracking-tighter dark:text-white">Seguinos en <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">Redes</span></h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Actualidad, Promociones y Momentos Dulces</p>
                        </div>
                        <div className="flex gap-4">
                            <a href={socialLinks.instagram} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase flex items-center gap-3 shadow-xl"><Instagram size={18} /> @seitu{isSanJusto ? "sanjusto" : "castillo"}</a>
                            <a href="#" className="px-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] tracking-widest uppercase flex items-center gap-3 shadow-xl"><Users size={18} /> TikTok</a>
                        </div>
                    </div>
                </div>
                <div className="flex overflow-x-auto gap-8 px-6 pb-20 no-scrollbar">
                    {landingPosts.map((post, i) => (
                        <div key={i} className="flex-none w-[300px] h-[300px] rounded-[3.5rem] overflow-hidden group relative cursor-pointer shadow-xl">
                            <img src={post.img} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-8 text-center text-white">
                                <p className="font-black text-xs uppercase tracking-widest leading-relaxed">"{post.label}"</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* STATS */}
                <div className="max-w-4xl mx-auto grid grid-cols-3 gap-12 text-center text-slate-800 dark:text-white uppercase tracking-widest font-black">
                    <div><div className="text-[10px] text-slate-400 mb-2">Publicaciones</div><div className="text-4xl">124</div></div>
                    <div><div className="text-[10px] text-slate-400 mb-2">En {isSanJusto ? "San Justo" : "Castillo"}</div><div className="text-4xl text-brand-400">5.8K</div></div>
                    <div><div className="text-[10px] text-slate-400 mb-2">Siguiendo</div><div className="text-4xl">842</div></div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-950 py-32 px-6 text-white relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-brand-400"></div>
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <img src={isSanJusto ? "/logosanjusto.png" : "/logofinal.png"} className="h-10 w-10 object-contain" />
                            <span className="font-black text-2xl tracking-tighter uppercase leading-none">{isSanJusto ? "SAN JUSTO" : "CASTILLO"}</span>
                        </div>
                        <p className="text-slate-400 font-medium leading-relaxed max-w-xs">
                            Llevamos la mejor calidad de helado Sei Tu a {isSanJusto ? "San Justo" : "Rafael Castillo"}. Calidad, frescura y el café de siempre. ❤️🍦
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-400">Ubicación</h4>
                        <div className="text-slate-400 font-medium italic">
                            {isSanJusto ? "Av. Pte. Illia 2467, San Justo." : "Carlos Casares 776, Rafael Castillo."}<br />Buenos Aires, Argentina
                        </div>
                        <button className="bg-slate-900 border border-slate-800 px-8 py-3 rounded-xl flex items-center gap-3 font-black text-[9px] tracking-widest uppercase"><MapPin size={14} className="text-brand-400" /> Cómo llegar</button>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-400">Horarios</h4>
                        <p className="text-slate-400 font-medium italic">¡Abierto todos los días del año!<br /><span className="text-brand-400 font-black not-italic text-lg">08:00 AM - 24:00 HS</span></p>
                    </div>
                </div>
            </footer>

            {/* BARRA FLOTANTE MODO OSCURO */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-[40]">
                <button onClick={toggleTheme} className="w-10 h-10 bg-white dark:bg-slate-900 shadow-xl rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 transition-all hover:scale-110">
                    {theme === 'dark' ? <Sun size={20} className="text-brand-400" /> : <Moon size={20} className="text-slate-400" />}
                </button>
            </div>

            {/* MODAL PROMO */}
            {showPromo && promoBanner?.active && promoBanner?.img && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowPromo(false)}>
                    <div className="relative w-full max-w-lg aspect-[4/5] bg-white rounded-[4rem] overflow-hidden shadow-2xl flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowPromo(false)} className="absolute top-8 right-8 z-30 bg-black/40 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/60 transition-all"><X /></button>
                        <img src={promoBanner.img} className="w-full h-full object-cover rounded-[3.5rem]" />
                    </div>
                </div>
            )}
        </div>
    );
}
