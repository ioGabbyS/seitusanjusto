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
    const [showPromo, setShowPromo] = useState(false);
    const { theme, toggleTheme, socialLinks, landingPosts, promoBanner } = useStore();
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

        // Detect if running on localhost for admin access
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setIsLocal(true);
        }

        if (window.location.hash === '#nosotros') {
            setViewNosotros(true);
        }
        if (window.location.hash === '#puntos') {
            setViewPuntos(true);
        }

        const handleHash = () => {
            if (window.location.hash === '#nosotros') setViewNosotros(true);
            if (window.location.hash === '#puntos') setViewPuntos(true);
        };
        window.addEventListener('hashchange', handleHash);

        // Load rewards for banner
        const loadRewards = async () => {
            const { data } = await supabase.from('rewards').select('*').not('image', 'is', null).limit(10);
            if (data) setRewards(data);
        };
        loadRewards();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('hashchange', handleHash);
        };
    }, []);

    useEffect(() => {
        if (promoBanner?.active && promoBanner?.img) {
            const timer = setTimeout(() => setShowPromo(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [promoBanner]);

    useEffect(() => {
        const slider = document.getElementById('rewards-slider');
        if (!slider) return;

        let scrollAmount = 0;
        let isPaused = false;

        const scrollStep = () => {
            if (!isPaused && slider) {
                slider.scrollLeft += 1.5; // Speed
                // Infinite loop reset
                if (slider.scrollLeft >= (slider.scrollWidth / 3) * 2) {
                    slider.scrollLeft = slider.scrollWidth / 3;
                }
            }
            requestAnimationFrame(scrollStep);
        };

        const pause = () => isPaused = true;
        const resume = () => isPaused = false;

        slider.addEventListener('mouseenter', pause);
        slider.addEventListener('mouseleave', resume);
        slider.addEventListener('touchstart', pause);
        slider.addEventListener('touchend', resume);

        const request = requestAnimationFrame(scrollStep);

        return () => {
            cancelAnimationFrame(request);
            slider.removeEventListener('mouseenter', pause);
            slider.removeEventListener('mouseleave', resume);
            slider.removeEventListener('touchstart', pause);
            slider.removeEventListener('touchend', resume);
        };
    }, [rewards]); // Re-run when rewards load

    // SOCIAL SLIDER LOGIC
    useEffect(() => {
        const slider = document.getElementById('social-slider');
        if (!slider) return;

        let scrollAmount = 0;
        let isPaused = false;

        const scrollStep = () => {
            if (!isPaused && slider) {
                slider.scrollLeft += 1.0; // Slightly slower
                if (slider.scrollLeft >= (slider.scrollWidth / 3) * 2) {
                    slider.scrollLeft = slider.scrollWidth / 3;
                }
            }
            requestAnimationFrame(scrollStep);
        };

        const pause = () => isPaused = true;
        const resume = () => isPaused = false;

        slider.addEventListener('mouseenter', pause);
        slider.addEventListener('mouseleave', resume);

        const request = requestAnimationFrame(scrollStep);
        return () => {
            cancelAnimationFrame(request);
            slider.removeEventListener('mouseenter', pause);
            slider.removeEventListener('mouseleave', resume);
        };
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

    const rewardsDisplay = [
        { name: '1 Kg de Helado', points: 1500, icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
        { name: '1/2 Kg de Helado', points: 800, icon: Star, color: 'bg-amber-100 text-amber-600' },
        { name: 'Batido Extra', points: 400, icon: UtensilsCrossed, color: 'bg-sky-100 text-sky-600' },
    ];

    const scroll = (direction) => {
        const container = document.getElementById('flavor-slider');
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 font-sans text-slate-900 selection:bg-brand-100 italic-none">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl py-3 shadow-lg' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src={displayNavLogo} alt={`${tenant.franchiseName} Logo`} className="h-10 w-10 object-contain" />
                        <span className={`font-black text-2xl tracking-tighter ${scrolled ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>{tenant.shortName.toUpperCase()}</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-10">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    if (s.id === 'nosotros') {
                                        setViewNosotros(true);
                                        window.location.hash = '#nosotros';
                                    } else if (s.id === 'puntos') {
                                        setViewPuntos(true);
                                        window.location.hash = '#puntos';
                                    } else {
                                        document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                                        window.location.hash = `#${s.id}`;
                                    }
                                }}
                                className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                            >
                                {s.label}
                            </button>
                        ))}
                        <a
                            href="#/portal"
                            className="bg-brand-500 text-white px-6 py-2.5 rounded-full font-black text-sm tracking-widest hover:bg-brand-600 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-brand-500/20"
                        >
                            ACCESO CLUB
                        </a>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={scrolled ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}
                        >
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
                        <div className="flex flex-col gap-6">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        if (section.id === 'nosotros') {
                                            setViewNosotros(true);
                                            window.location.hash = '#nosotros';
                                        } else if (section.id === 'puntos') {
                                            setViewPuntos(true);
                                            window.location.hash = '#puntos';
                                        } else {
                                            document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                                            window.location.hash = `#${section.id}`;
                                        }
                                    }}
                                    className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-widest uppercase text-left"
                                >
                                    {section.label}
                                </button>
                            ))}
                            <a
                                href="#/portal"
                                onClick={() => setIsMenuOpen(false)}
                                className="bg-brand-500 text-white p-4 rounded-2xl text-center font-black tracking-widest uppercase shadow-xl"
                            >
                                MI CUENTA CLUB
                            </a>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-24 px-6 overflow-hidden bg-gradient-to-b from-brand-50 to-white dark:from-slate-900 dark:to-slate-950">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="animate-in fade-in slide-in-from-left duration-700">
                        <div className="inline-flex items-center gap-2 bg-brand-100/50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-6">
                            <Star size={14} className="fill-current" /> FRANQUICIA OFICIAL SEI TU
                        </div>
                        <h1 className={`${displayTitleSize} font-black text-slate-900 dark:text-white leading-[0.85] mb-8 tracking-tighter`}>
                            El helado <br /> que más <span className="text-brand-500">amás.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-lg font-medium">
                            Disfrutá de la calidad Sei Tu en {tenant.location}. Sabores inolvidables, momentos compartidos y el café que elegís todos los días.
                        </p>
                        <p className="text-lg text-brand-600 dark:text-brand-400 font-bold mb-10 max-w-lg leading-snug">
                            "Creamos un ambiente donde cada visita se convierte en una experiencia agradable, invitando a volver una y otra vez."
                        </p>

                        {/* Cafeteria Branding Section */}
                        <div className="mb-12 p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6 max-w-md animate-in fade-in slide-in-from-bottom-4 delay-300">
                            <div className="h-24 w-24 shrink-0 bg-white rounded-2xl p-2 shadow-sm border border-slate-50">
                                <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shrink-0">
                                    <Coffee size={32} className="text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-brand-500 uppercase tracking-widest mb-1">Cafetería de calidad</h3>
                                <p className="text-xl font-bold text-slate-700 dark:text-slate-200 leading-tight">Acompañá tu helado con el mejor café expresso.</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-8">
                            <div className="flex flex-col gap-4 flex-1">
                                <a href="#/portal" className="px-8 py-5 bg-brand-500 text-white rounded-2xl font-black text-lg hover:bg-brand-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-500/20 hover:-translate-y-1">
                                    <Gift size={20} /> MIEMBROS CLUB
                                </a>
                                <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 space-y-1.5 leading-none">
                                    <p className="flex items-center gap-2"><Star size={10} className="text-brand-400" /> Cada compra suma.</p>
                                    <p className="flex items-center gap-2"><Star size={10} className="text-brand-400" /> Cada punto recompensa.</p>
                                    <p className="flex items-center gap-2"><Star size={10} className="text-brand-400" /> Cada visita cuenta.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 flex-1">
                                <button
                                    onClick={() => { setViewNosotros(true); window.location.hash = '#nosotros'; }}
                                    className="px-8 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
                                >
                                    CONOCÉ MÁS
                                </button>
                                <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 space-y-1.5 leading-none">
                                    <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> SOBRE NOSOTROS</p>
                                    <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> NUESTRA HISTORIA</p>
                                    <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> NUESTRA PASIÓN</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative animate-in fade-in zoom-in duration-1000">
                        <div className="absolute -inset-10 bg-gradient-to-tr from-brand-200/40 to-amber-200/40 dark:from-brand-500/20 dark:to-amber-500/20 rounded-[4rem] blur-3xl opacity-50 -z-10 animate-pulse"></div>
                        <img
                            src={displayMainLogo}
                            alt="Main Logo"
                            className="w-full max-w-md mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-700 pointer-events-none"
                        />
                    </div>
                </div>

                {/* Curve Separator */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16 fill-slate-50 dark:fill-slate-900">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
                    </svg>
                </div>
            </section>

            {/* Horizontal Slider Section */}
            <section id="sabores" className="bg-slate-50 dark:bg-slate-900 py-24 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex justify-between items-end mb-16">
                        <div>
                            <h2 className="text-5xl sm:text-6xl font-black mb-4 tracking-tight leading-none text-slate-800 dark:text-white">
                                Conocé nuestros <span className="text-brand-500">sabores</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs pl-1">Exclusividad en cada cucharada</p>
                        </div>
                        <div className="hidden md:flex gap-3">
                            <button
                                onClick={() => scroll('left')}
                                className="p-4 rounded-full bg-white dark:bg-slate-800 shadow-xl hover:bg-brand-500 dark:hover:bg-brand-500 hover:text-white transition-all scale-90 hover:scale-100"
                            >
                                <X size={24} className="rotate-45" />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                className="p-4 rounded-full bg-slate-900 dark:bg-brand-500 text-white shadow-xl hover:bg-brand-500 dark:hover:bg-brand-600 transition-all scale-90 hover:scale-100"
                            >
                                <ArrowRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Slider Container */}
                <div
                    id="flavor-slider"
                    className="flex overflow-x-auto gap-8 px-[max(1.5rem,calc((100vw-80rem)/2))] pb-12 snap-x snap-mandatory scrollbar-hide no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {allImages.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => setModalImage(item.image)}
                            className="flex-none w-[85vw] sm:w-[500px] h-[600px] rounded-[4.5rem] overflow-hidden cursor-pointer snap-center group relative bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] transition-all duration-700 hover:-translate-y-6"
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex flex-col justify-end p-12 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <div className="bg-white/20 backdrop-blur-2xl border border-white/40 text-white px-8 py-4 rounded-[2rem] font-black text-center tracking-wider shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500">
                                    VER DETALLE
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-4 md:hidden text-slate-400 text-sm font-bold flex items-center justify-center gap-2">
                    <ArrowRight size={16} className="animate-bounce" /> Deslizá para ver más
                </div>
            </section>

            {/* Nosotros Section (MODAL VERSION) */}
            {viewNosotros && (
                <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
                    {/* Header for Modal */}
                    <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 px-6 py-6 transition-colors">
                        <div className="max-w-7xl mx-auto flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <img src={displayNavLogo} alt="Seitu Logo" className="h-8 w-8 object-contain" />
                                <span className="font-black text-xl tracking-tighter dark:text-white">NUESTRA HISTORIA</span>
                            </div>
                            <button
                                onClick={() => { setViewNosotros(false); window.location.hash = '#/'; }}
                                className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="py-20 px-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-[120px]"></div>
                        <div className="max-w-7xl mx-auto relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                                <div className="animate-in fade-in slide-in-from-left duration-1000">
                                    <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-8">
                                        <Heart size={14} className="fill-current" /> CONOCÉ NUESTRA HISTORIA
                                    </div>
                                    <h2 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white leading-[0.9] mb-10 tracking-tighter">
                                        Más que una heladería, una <span className="text-brand-500">experiencia.</span>
                                    </h2>
                                    <div className="space-y-6 text-slate-550 dark:text-slate-400 text-lg leading-relaxed font-medium">
                                        <p>
                                            <span className="text-slate-900 dark:text-white font-black">{tenant.franchiseName}</span> es más que una heladería y cafetería. Es una experiencia creada para disfrutar.
                                        </p>
                                        <p>
                                            Formamos parte de una marca con más de <span className="text-brand-600 dark:text-brand-400 font-black">25 años de trayectoria</span> en Argentina, con más de 450 sucursales, reconocida por su calidad e innovación. Esta base nos permite ofrecer productos elaborados bajo estándares de excelencia, combinando tradición y modernidad.
                                        </p>
                                        <p>
                                            Nuestro espacio nace con el propósito de brindar un lugar donde las personas puedan disfrutar, compartir y vivir momentos especiales. Combinamos heladería y cafetería en un mismo concepto, ofreciendo una amplia variedad de sabores que se adaptan a todos los gustos.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mt-16">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-transform hover:-translate-y-1">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                                <Star className="text-brand-500 fill-current" size={24} />
                                            </div>
                                            <h4 className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest mb-2">Excelencia</h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed">Productos elaborados bajo los más altos estándares internacionales.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-transform hover:-translate-y-1">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                                <Users className="text-sky-500" size={24} />
                                            </div>
                                            <h4 className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest mb-2">Comunidad</h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed">Un punto de encuentro cálido pensado para que quieras volver.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative animate-in fade-in slide-in-from-right duration-1000">
                                    <div className="absolute -inset-10 bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-[100px] -z-10"></div>

                                    <div className="bg-slate-900 dark:bg-slate-800 p-10 sm:p-16 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <UtensilsCrossed size={120} />
                                        </div>

                                        <h3 className="text-3xl sm:text-4xl font-black mb-10 leading-tight italic">
                                            "Nuestro compromiso es simple: ofrecer productos de excelencia en un ambiente moderno y pensado para disfrutar."
                                        </h3>

                                        <div className="space-y-8 relative">
                                            <p className="text-slate-400 text-lg font-medium leading-relaxed theme-text-premium">
                                                En {tenant.franchiseName} cuidamos cada detalle: la calidad, la atención y el ambiente. Creemos que los mejores momentos se construyen a través de pequeñas experiencias que se disfrutan de verdad.
                                            </p>

                                            <div className="pt-8 border-t border-white/10 italic">
                                                <p className="text-2xl font-black mb-2 leading-none">Por eso existimos.</p>
                                                <p className="text-brand-400 text-xl font-bold leading-none">Para crear esos momentos.</p>
                                            </div>

                                            <div className="flex items-center gap-4 mt-12">
                                                <div className="h-14 w-1 flex-col bg-brand-500"></div>
                                                <div>
                                                    <p className="font-black text-xl tracking-tighter uppercase mb-0.5">{tenant.franchiseName}</p>
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Est. {tenant.establishedYear} • {tenant.location}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-bounce-slow flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">25</div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Años de</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Trayectoria</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-20 text-center">
                                <button
                                    onClick={() => { setViewNosotros(false); window.location.hash = '#/'; }}
                                    className="px-12 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-xl hover:scale-105 transition-all shadow-2xl active:scale-95"
                                >
                                    VOLVER AL INICIO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Puntos Section (MODAL VERSION) */}
            {viewPuntos && (
                <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
                    {/* Header for Modal */}
                    <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 px-6 py-6 transition-colors">
                        <div className="max-w-7xl mx-auto flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <img src={displayNavLogo} alt="Seitu Logo" className="h-8 w-8 object-contain" />
                                <span className="font-black text-xl tracking-tighter dark:text-white">SEITU CLUB • PUNTOS</span>
                            </div>
                            <button
                                onClick={() => { setViewPuntos(false); window.location.hash = '#/'; }}
                                className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="py-20 px-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sky-500/5 rounded-full blur-[120px]"></div>

                        <div className="max-w-7xl mx-auto relative z-10 text-center mb-20">
                            <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-8">
                                <Trophy size={14} /> CLUB DE BENEFICIOS
                            </div>
                            <h2 className="text-6xl sm:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] mb-10 tracking-tighter">
                                Canjeá tus <span className="text-sky-600">Puntos</span>
                            </h2>
                            <p className="text-2xl text-slate-550 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-bold mb-6">
                                Tu fidelidad tiene recompensa. En {tenant.systemName} premiamos tu elección.
                            </p>
                            <p className="text-lg text-slate-500 dark:text-slate-500 max-w-xl mx-auto leading-relaxed font-medium capitalize">
                                Cada visita es una oportunidad para sumar beneficios y disfrutar aún más lo que te gusta.
                            </p>
                        </div>

                        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-32">
                            <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-center group hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-2xl">
                                <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center shadow-sm mb-8 mx-auto group-hover:scale-110 transition-transform">
                                    <ShoppingBag className="text-sky-500" size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Comprá en el local</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed">
                                    Cada compra de helados suma puntos automáticamente a tu cuenta.
                                </p>
                            </div>
                            <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-center group hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-2xl">
                                <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center shadow-sm mb-8 mx-auto group-hover:scale-110 transition-transform">
                                    <Users className="text-brand-500" size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Mencioná tu DNI</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed">
                                    O Nombre y Apellido. Nuestro sistema registra tus puntos al instante.
                                </p>
                            </div>
                            <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-center group hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-2xl">
                                <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center shadow-sm mb-8 mx-auto group-hover:scale-110 transition-transform">
                                    <Star className="text-amber-500 fill-current" size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Acumulá y canjeá</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed">
                                    Usalos cuando quieras por premios increíbles en cualquier momento.
                                </p>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto mb-32">
                            <div className="bg-slate-900 dark:bg-slate-800 rounded-[4rem] p-12 sm:p-20 text-white relative overflow-hidden shadow-3xl">
                                <div className="absolute top-0 right-0 p-12 opacity-5">
                                    <Gift size={200} />
                                </div>
                                <h3 className="text-4xl sm:text-5xl font-black mb-12 tracking-tight italic">Premios que podés obtener</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                                    {[
                                        'Helados por kilo',
                                        'Bochas individuales',
                                        'Gelatos familiares',
                                        'Tortas heladas premium',
                                        'Postres exclusivos',
                                        'Productos especiales SeiTu'
                                    ].map((reward, i) => (
                                        <div key={i} className="flex items-center gap-4 py-4 border-b border-white/10 group">
                                            <div className="w-2 h-2 rounded-full bg-brand-500 group-hover:scale-150 transition-transform"></div>
                                            <span className="text-lg font-bold group-hover:text-brand-400 transition-colors">{reward}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-16 pt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-8">
                                    <div>
                                        <p className="text-2xl font-black mb-2 leading-none uppercase tracking-tighter">Registrate y cada compra suma!</p>
                                        <p className="text-slate-400 font-bold">Disfrutar tu helado favorito ahora tiene beneficios.</p>
                                    </div>
                                    <a
                                        href="#/portal"
                                        className="px-12 py-6 bg-brand-500 text-white rounded-3xl font-black text-xl hover:scale-105 transition-all shadow-xl shadow-brand-500/20 active:scale-95 whitespace-nowrap"
                                    >
                                        VER MIS PUNTOS
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => { setViewPuntos(false); window.location.hash = '#/'; }}
                                className="px-12 py-6 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl font-black text-xl border-2 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                            >
                                VOLVER AL INICIO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SEITUCLUB Section */}
            <section id="puntos" className="py-32 px-6 bg-white dark:bg-slate-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[100px]"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="bg-brand-600 dark:bg-slate-900 rounded-[4rem] p-12 sm:p-24 text-white shadow-3xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-8">
                                    💎 BENEFICIOS EXCLUSIVOS
                                </div>
                                <h1 className="text-7xl sm:text-8xl font-black mb-10 tracking-tighter leading-[0.85] uppercase">
                                    SEITU<span className="text-amber-300">CLUB</span>
                                </h1>
                                <h2 className="text-2xl sm:text-3xl font-bold mb-8 leading-tight">
                                    Convertí tus compras en helado gratis
                                </h2>
                                <p className="text-lg text-white/80 font-medium mb-12 max-w-xl leading-relaxed">
                                    Cada vez que elegís {tenant.franchiseName}, ganás puntos que podés canjear por helados, tortas y premios exclusivos. <span className="text-amber-300 font-bold italic">Cuanto más disfrutás, más ganás.</span>
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                    <a href="#/portal" className="px-12 py-6 bg-white text-brand-600 rounded-3xl font-black text-xl hover:bg-amber-50 hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-brand-900/50">
                                        MI CUENTA CLUB
                                    </a>
                                    <button
                                        onClick={() => { setViewPuntos(true); window.location.hash = '#puntos'; }}
                                        className="px-10 py-6 bg-brand-700/50 backdrop-blur-sm border-2 border-white/20 text-white rounded-3xl font-black text-lg hover:bg-brand-700 transition-all"
                                    >
                                        ¿CÓMO FUNCIONA?
                                    </button>
                                </div>
                            </div>

                            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0 animate-bounce-slow">
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl scale-150"></div>
                                <img
                                    src="/tucito.png"
                                    alt="Tucito"
                                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Instagram Feed Section (NEW) */}
            <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden border-t border-slate-50 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div className="animate-in fade-in slide-in-from-left duration-700">
                            <div className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4">
                                <Instagram size={14} /> SOCIAL FEED
                            </div>
                            <h2 className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                Seguinos en <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 font-black">Redes</span>
                            </h2>
                            <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-[10px]">Actualidad, promociones y momentos dulces</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <a
                                href={socialLinks.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-xl font-black text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-pink-500/20 active:scale-95 flex items-center gap-2 uppercase"
                            >
                                <Instagram size={16} /> @{tenant.social?.instagram || "seitucastillo"}
                            </a>
                            <a
                                href={socialLinks.tiktok}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-black text-white rounded-xl font-black text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/20 active:scale-95 flex items-center gap-2 uppercase"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01-.01 2.62-.02 5.24-.04 7.86-.02 2.04-.6 4.12-1.93 5.71-1.4 1.75-3.69 2.58-5.88 2.37-2.31-.22-4.46-1.63-5.55-3.69-1.34-2.48-1.12-5.74.56-8 1.14-1.55 3.01-2.5 4.93-2.5.42 0 .84.05 1.25.13v4.16c-.43-.16-.9-.24-1.36-.21-1.34.07-2.61.94-3.04 2.21-.49 1.4-.1 3.11.97 4.13 1.01 1.01 2.6 1.25 3.86.6 1.04-.54 1.66-1.66 1.76-2.82.04-1.11.02-2.22.02-3.33V.02z" />
                                </svg>
                                TikTok
                            </a>
                        </div>
                    </div>

                    {/* Social Carousel */}
                    <div
                        id="social-slider"
                        className="flex gap-4 sm:gap-6 overflow-hidden select-none cursor-grab active:cursor-grabbing pb-12"
                    >
                        {[...landingPosts, ...landingPosts, ...landingPosts].map((post, idx) => (
                            <button
                                key={`${post.id}-${idx}`}
                                onClick={() => setSocialModal(post)}
                                className="flex-shrink-0 w-[240px] sm:w-[320px] aspect-square group relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-xl hover:-translate-y-2 transition-all duration-500"
                            >
                                <img
                                    src={post.img}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[10%] group-hover:grayscale-0"
                                    alt={post.label}
                                    referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 sm:p-10">
                                    <div className="flex items-center gap-3 text-white">
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                            <Instagram size={18} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">@{tenant.social?.instagram || "seitucastillo"}</span>
                                            <span className="text-sm font-black uppercase tracking-tighter truncate w-32 sm:w-48">{post.label}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 pt-16 border-t border-slate-100 dark:border-slate-900 flex flex-wrap justify-center gap-12 sm:gap-24">
                        {[
                            { label: 'Publicaciones', val: '124' },
                            { label: 'En ' + tenant.shortName, val: '5.8k' },
                            { label: 'Siguiendo', val: '842' }
                        ].map((stat, i) => (
                            <div key={i} className="text-center group cursor-default">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block group-hover:text-pink-500 transition-colors">{stat.label}</span>
                                <span className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{stat.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 dark:bg-slate-950 py-24 px-6 text-slate-400 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 opacity-30"></div>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20 items-start">
                        <div className="col-span-1">
                            <div className="flex items-center gap-3 mb-8 text-white">
                                <img src={displayNavLogo} alt="Logo" className="h-10 w-10 object-contain" />
                                <span className="text-3xl font-black tracking-tighter uppercase">{tenant.shortName.toUpperCase()}</span>
                            </div>
                            <p className="text-sm text-sky-400/80 leading-relaxed max-w-xs font-medium">
                                Llevamos la mejor calidad de helado Sei Tu a {tenant.location}. Calidad, frescura y el café de siempre. ❤️🍦
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-2">
                            <div>
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Ubicación</h4>
                                <p className="text-sm text-sky-400/80 leading-relaxed mb-6">
                                    Carlos Casares 776<br />
                                    {tenant.location}<br />
                                    Buenos Aires, Argentina
                                </p>
                                <button onClick={() => window.open(tenant.social.googleMaps, '_blank')} className="bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700/50 px-6 py-3 rounded-xl flex items-center gap-3 font-black text-[10px] tracking-[0.15em] uppercase transition-all shadow-sm">
                                    <MapPin size={14} className="text-rose-500" /> CÓMO LLEGAR
                                </button>
                            </div>
                            <div>
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Horarios</h4>
                                <p className="text-sm text-sky-400/80 leading-relaxed">
                                    ¡Abierto todos los días del año!<br />
                                    08:00 AM - 24:00 HS
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.1em]">
                        <div className="w-full md:w-1/3 flex justify-center md:justify-start">
                            <a href="#/admin" className="text-slate-600 hover:text-white transition-colors flex items-center gap-2">
                                <LayoutDashboard size={14} /> DASHBOARD
                            </a>
                        </div>
                        
                        <div className="w-full md:w-1/3 flex flex-col items-center gap-4 text-center">
                            <span className="text-slate-500">© 2026 {tenant.systemName.toUpperCase()} — TODOS LOS DERECHOS RESERVADOS</span>
                            <div className="flex justify-center gap-6 sm:gap-8">
                                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">Instagram</a>
                                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TikTok</a>
                                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">Facebook</a>
                                <a href={`https://wa.me/${socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors">WhatsApp</a>
                            </div>
                        </div>

                        <div className="w-full md:w-1/3 hidden md:block"></div> {/* Spacer for centering */}
                    </div>
                </div>
            </footer>

            {/* Modal Lightbox */}
            {modalImage && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-10 animate-in fade-in duration-300"
                    onClick={() => setModalImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-3 bg-white/10 rounded-full z-[110]"
                        onClick={() => setModalImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <div className="w-full h-full flex items-center justify-center relative">
                        <img
                            src={modalImage}
                            alt="Menu Detail"
                            className="max-w-full max-h-full object-contain rounded-xl sm:rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Floating WhatsApp Button */}
            <a
                href={`https://wa.me/${socialLinks.whatsapp}?text=Hola!%20Vengo%20desde%20la%20web%20${tenant.systemName.replace(/ /g, "%20")}%20y%20quería%20hacer%20una%20consulta.`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 sm:bottom-12 sm:right-12 z-[60] bg-[#25D366] text-white p-5 rounded-full shadow-[0_20px_40px_rgba(37,211,102,0.4)] hover:shadow-[0_25px_50px_rgba(37,211,102,0.6)] transition-all hover:-translate-y-3 group animate-in zoom-in duration-500"
                title="Escribinos por WhatsApp"
            >
                <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-25 group-hover:hidden"></div>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </a>

            {/* Social Lightbox Modal */}
            {socialModal && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300"
                    onClick={() => setSocialModal(null)}
                >
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                        <X size={32} />
                    </button>

                    <div
                        className="max-w-5xl w-full h-full flex flex-col md:flex-row bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
                            <img
                                src={socialModal.img}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                alt={socialModal.label}
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <div className="w-full md:w-80 bg-slate-900 p-8 flex flex-col border-l border-slate-800">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500 p-0.5">
                                    <div className="w-full h-full rounded-full bg-slate-900 p-0.5 flex items-center justify-center">
                                        <img src={displayNavLogo} className="w-6 h-6 object-contain" alt="Logo" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white font-black text-sm leading-none">{tenant.social?.instagram || "seitucastillo"}</p>
                                    <p className="text-slate-500 text-[10px] font-bold">{tenant.location}</p>
                                </div>
                            </div>

                            <h3 className="text-white font-black text-xl mb-4 tracking-tighter leading-tight italic">
                                "{socialModal.label}"
                            </h3>

                            <p className="text-slate-400 text-sm leading-relaxed mb-auto font-medium">
                                Descubrí más contenidos y promociones increíbles en nuestras redes oficiales. ¡Te esperamos! ❤️🍦
                            </p>

                            <div className="space-y-3 mt-8">
                                <a
                                    href={socialModal.url || socialLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-2xl font-black text-xs tracking-widest text-center block hover:scale-[1.02] transition-all uppercase"
                                >
                                    Ver en Redes
                                </a>
                                <button
                                    onClick={() => setSocialModal(null)}
                                    className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-xs tracking-widest text-center hover:bg-slate-700 transition-all uppercase"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PROMO */}
            {showPromo && promoBanner?.active && promoBanner?.img && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowPromo(false)}>
                    <div className="relative w-full max-w-lg aspect-[4/5] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowPromo(false)} className="absolute top-4 right-4 z-30 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition-all">
                            <X size={20} />
                        </button>
                        {promoBanner.img.endsWith('.mp4') ? (
                            <video src={promoBanner.img} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                        ) : (
                            <img src={promoBanner.img} alt="Promo" className="w-full h-full object-cover" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
