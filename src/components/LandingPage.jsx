import React, { useState, useEffect } from 'react';
import { Star, Gift, ShoppingBag, ArrowRight, X, ChevronRight, LayoutDashboard, UtensilsCrossed, Facebook, Instagram, Trophy, Sun, Moon, Menu, Clock, Heart, Users, MapPin, Coffee } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useStore } from '../hooks/useStore';
import { tenant } from '../config/tenant';

export default function LandingPage() {
    const [modalImage, setModalImage] = useState(null);
    const [socialModal, setSocialModal] = useState(null);
    const [isLocal, setIsLocal] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [viewNosotros, setViewNosotros] = useState(false);
    const [viewPuntos, setViewPuntos] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { theme, toggleTheme, socialLinks, landingPosts, promoBanner } = useStore();
    const [showPromo, setShowPromo] = useState(false);
    const [rewards, setRewards] = useState([]);

    const isSanJusto = tenant.location.toLowerCase().includes('justo');
    const displayNavLogo = isSanJusto ? '/logosanjusto.png' : '/logofinal.png';
    const displayMainLogo = isSanJusto ? '/sanjusto2.png' : '/logofinal.png';
    const displayTitleSize = isSanJusto ? 'text-[4.5rem] sm:text-[6rem]' : 'text-6xl sm:text-[7.5rem]';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setIsLocal(true);
        }

        if (window.location.hash === '#nosotros') setViewNosotros(true);
        if (window.location.hash === '#puntos') setViewPuntos(true);

        const handleHash = () => {
            if (window.location.hash === '#nosotros') setViewNosotros(true);
            if (window.location.hash === '#puntos') setViewPuntos(true);
        };
        window.addEventListener('hashchange', handleHash);

        const loadRewards = async () => {
            const { data } = await supabase.from('rewards').select('*').not('image', 'is', null).limit(10);
            if (data) setRewards(data);
        };
        loadRewards();

        if (promoBanner?.active && promoBanner?.img) {
            const timer = setTimeout(() => {
                setShowPromo(true);
            }, 1000);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('hashchange', handleHash);
            };
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('hashchange', handleHash);
        };
    }, [promoBanner]);

    useEffect(() => {
        const slider = document.getElementById('rewards-slider');
        if (!slider) return;
        let isPaused = false;
        const scrollStep = () => {
            if (!isPaused && slider) {
                slider.scrollLeft += 1.5;
                if (slider.scrollLeft >= (slider.scrollWidth / 3) * 2) {
                    slider.scrollLeft = slider.scrollWidth / 3;
                }
            }
            requestAnimationFrame(scrollStep);
        };
        slider.addEventListener('mouseenter', () => isPaused = true);
        slider.addEventListener('mouseleave', () => isPaused = false);
        const request = requestAnimationFrame(scrollStep);
        return () => cancelAnimationFrame(request);
    }, [rewards]);

    useEffect(() => {
        const slider = document.getElementById('social-slider');
        if (!slider) return;
        let isPaused = false;
        const scrollStep = () => {
            if (!isPaused && slider) {
                slider.scrollLeft += 1.0;
                if (slider.scrollLeft >= (slider.scrollWidth / 3) * 2) {
                    slider.scrollLeft = slider.scrollWidth / 3;
                }
            }
            requestAnimationFrame(scrollStep);
        };
        const request = requestAnimationFrame(scrollStep);
        return () => cancelAnimationFrame(request);
    }, [landingPosts]);

    const sections = [
        { id: 'inicio', label: 'Inicio' },
        { id: 'sabores', label: 'Sabores' },
        { id: 'puntos', label: 'Puntos' },
        { id: 'nosotros', label: 'Nosotros' },
    ];

    const allImages = [
        { id: 'principal', title: 'Todos los Sabores', image: '/helados_banner.jpg' },
        { id: 'cremas1', title: 'Nuestras Cremas I', image: '/cremas_1.jpg' },
        { id: 'cremas-new', title: 'Nuestras Cremas', image: '/cremas.jpg' },
        { id: 'cremas2', title: 'Nuestras Cremas II', image: '/cremas_2.jpg' },
        { id: 'chocolates', title: 'Nuestros Chocolates', image: '/chocolates.jpg' },
        { id: 'dulces', title: 'Dulces de Leche', image: '/dulces_de_leche.jpg' },
        { id: 'aguas', title: 'Helados de Agua', image: '/aguas.jpg' },
        { id: 'favoritos', title: 'Nuestros Favoritos', image: '/favoritos.jpg' }
    ];

    const scroll = (direction) => {
        const container = document.getElementById('flavor-slider');
        if (!container) return;
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 font-sans text-slate-900 selection:bg-brand-100 italic-none">
            {/* NAVIGATION */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl py-3 shadow-lg' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src="/logosanjusto.png" alt="Logo" className="h-10 w-10 object-contain" />
                        <span className="font-black text-2xl tracking-tighter dark:text-white">SEITU SAN JUSTO</span>
                    </div>
                    <div className="hidden md:flex items-center gap-10">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    if (s.id === 'nosotros') setViewNosotros(true);
                                    else if (s.id === 'puntos') setViewPuntos(true);
                                    else document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-500 transition-colors"
                            >
                                {s.label}
                            </button>
                        ))}
                        <a href="#/portal" className="bg-brand-500 text-white px-6 py-2.5 rounded-full font-black text-sm tracking-widest hover:bg-brand-600 shadow-lg">ACCESO CLUB</a>
                    </div>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-slate-900 dark:text-white">
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 p-6 md:hidden shadow-2xl flex flex-col gap-6">
                        {sections.map(s => (
                            <button key={s.id} onClick={() => { setIsMenuOpen(false); if (s.id === 'nosotros') setViewNosotros(true); else if (s.id === 'puntos') setViewPuntos(true); else document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }} className="text-lg font-black uppercase text-slate-800 dark:text-white">{s.label}</button>
                        ))}
                        <a href="#/portal" className="bg-brand-500 text-white p-4 rounded-xl text-center font-black">MI CUENTA CLUB</a>
                    </div>
                )}
            </nav>

            {/* HERO */}
            <section id="inicio" className="relative pt-40 pb-24 px-6 bg-gradient-to-b from-brand-50 to-white dark:from-slate-900 dark:to-slate-950">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className={`${displayTitleSize} font-black text-slate-900 dark:text-white leading-[0.85] mb-8 tracking-tighter`}>
                            El helado <br /> que más <span className="text-brand-500">amás.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-lg font-medium">Calidad Sei Tu en San Justo. Sabores inolvidables y el mejor café expresso.</p>
                        <div className="flex gap-4">
                            <a href="#/portal" className="px-8 py-5 bg-brand-500 text-white rounded-2xl font-black text-lg shadow-xl hover:-translate-y-1 transition-all">MIEMBROS CLUB</a>
                            <button onClick={() => setViewNosotros(true)} className="px-8 py-5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all">CONOCÉ MÁS</button>
                        </div>
                    </div>
                    <div className="relative">
                        <img src="/sanjusto2.png" alt="Logo" className="w-full max-w-md mx-auto drop-shadow-2xl" />
                    </div>
                </div>
            </section>

            {/* SABORES */}
            <section id="sabores" className="py-24 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
                    <h2 className="text-5xl font-black text-slate-800 dark:text-white">Nuestros <span className="text-brand-500">Sabores</span></h2>
                    <div className="flex gap-2">
                        <button onClick={() => scroll('left')} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg"><ArrowRight className="rotate-180" /></button>
                        <button onClick={() => scroll('right')} className="p-3 bg-slate-900 dark:bg-brand-500 text-white rounded-full shadow-lg"><ArrowRight /></button>
                    </div>
                </div>
                <div id="flavor-slider" className="flex overflow-x-auto gap-8 px-6 pb-12 no-scrollbar">
                    {allImages.map(img => (
                        <div key={img.id} onClick={() => setModalImage(img.image)} className="flex-none w-[300px] sm:w-[450px] h-[500px] rounded-[3rem] overflow-hidden group relative cursor-pointer shadow-xl">
                            <img src={img.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={img.title} />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-black border-2 border-white px-6 py-2 rounded-full">VER DETALLE</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* NOSOTROS MODAL */}
            {viewNosotros && (
                <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto p-6 md:p-20 animate-in fade-in slide-in-from-bottom-10">
                    <button onClick={() => setViewNosotros(false)} className="absolute top-10 right-10 p-4 bg-slate-100 rounded-2xl"><X /></button>
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-6xl font-black mb-10 dark:text-white">Nuestra <span className="text-brand-500">Pasión</span></h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed space-y-6">
                            Formamos parte de una marca con más de 25 años de trayectoria. En San Justo, buscamos que cada visita sea un momento especial.
                        </p>
                        <button onClick={() => setViewNosotros(false)} className="mt-12 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black">CERRAR</button>
                    </div>
                </div>
            )}

            {/* PUNTOS MODAL */}
            {viewPuntos && (
                <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto p-6 md:p-20 animate-in fade-in slide-in-from-bottom-10">
                    <button onClick={() => setViewPuntos(false)} className="absolute top-10 right-10 p-4 bg-slate-100 rounded-2xl"><X /></button>
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-6xl font-black mb-10 dark:text-white">Seitu <span className="text-brand-500">Club</span></h2>
                        <p className="text-xl text-slate-500 mb-12 font-bold">Sumá puntos con cada compra y canjealos por helado gratis.</p>
                        <a href="#/portal" className="px-12 py-6 bg-brand-500 text-white rounded-3xl font-black text-xl shadow-xl">VER MIS PUNTOS</a>
                    </div>
                </div>
            )}

            {/* SOCIAL FEED */}
            <section className="py-24 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-5xl font-black mb-12 dark:text-white">Seguinos en <span className="text-pink-600">Redes</span></h2>
                    <div id="social-slider" className="flex gap-6 overflow-hidden pb-12">
                        {[...landingPosts, ...landingPosts].map((post, i) => (
                            <div key={i} onClick={() => setSocialModal(post)} className="flex-none w-[280px] aspect-square rounded-[2rem] overflow-hidden cursor-pointer hover:-translate-y-2 transition-all shadow-lg">
                                <img src={post.img} className="w-full h-full object-cover" alt="Post" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-900 py-20 px-6 text-slate-400">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <div className="flex items-center gap-3 mb-6 text-white text-3xl font-black uppercase">
                            <img src="/logosanjusto.png" className="h-10 w-10" /> SEITU SAN JUSTO
                        </div>
                        <p className="max-w-xs">La mejor calidad Sei Tu en San Justo. Av. Pte. Illia 2467.</p>
                    </div>
                    <div className="text-right">
                        <h4 className="text-white font-black uppercase text-xs mb-4">Horarios</h4>
                        <p>Todos los días: 08 AM - 24 HS</p>
                    </div>
                </div>
            </footer>

            {/* POPUPS & MODALS */}
            {modalImage && (
                <div className="fixed inset-0 z-[1000] bg-black/90 p-4 flex items-center justify-center animate-in fade-in" onClick={() => setModalImage(null)}>
                    <img src={modalImage} className="max-w-full max-h-full rounded-2xl shadow-2xl" />
                </div>
            )}

            {showPromo && promoBanner?.active && promoBanner?.img && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="relative w-full max-w-lg aspect-[4/5] bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <button onClick={() => setShowPromo(false)} className="absolute top-6 right-6 z-30 bg-black/20 p-3 rounded-full text-white hover:bg-black/50 transition-all"><X /></button>
                        <div className="w-full h-full cursor-pointer" onClick={() => promoBanner.url && window.open(promoBanner.url, '_blank')}>
                            {promoBanner.img.toLowerCase().includes('.mp4') ? <video src={promoBanner.img} autoPlay muted loop className="w-full h-full object-cover" /> : <img src={promoBanner.img} className="w-full h-full object-cover" />}
                        </div>
                    </div>
                </div>
            )}

            {socialModal && (
                <div className="fixed inset-0 z-[1000] bg-black/90 p-4 flex items-center justify-center animate-in fade-in" onClick={() => setSocialModal(null)}>
                    <div className="bg-white max-w-4xl w-full rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="md:w-3/5 bg-slate-100"><img src={socialModal.img} className="w-full h-full object-cover" /></div>
                        <div className="md:w-2/5 p-10 flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-black mb-4">"{socialModal.label}"</h3>
                                <p className="text-slate-500">Vení a visitarnos hoy mismo!</p>
                            </div>
                            <button onClick={() => window.open(socialModal.url || socialLinks.instagram, '_blank')} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-black">VER EN INSTAGRAM</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
