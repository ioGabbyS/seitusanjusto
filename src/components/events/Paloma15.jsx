import React, { useState, useRef, useEffect } from 'react';
import { Camera, Send, CheckCircle, RefreshCw, Heart, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { useStore } from '../../hooks/useStore';

const Paloma15 = () => {
    const { addEventPostPaloma, uploadImage, loadData } = useStore();
    const [comment, setComment] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [author, setAuthor] = useState('');
    const fileInputRef = useRef(null);

    // Cargar datos (incluyendo Modo Automático) al entrar
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment && !image) return;

        setIsUploading(true);
        try {
            let imageUrl = '';
            if (image) {
                imageUrl = await uploadImage(image);
            }

            await addEventPostPaloma({
                comment,
                img: imageUrl,
                author: author || 'Invitado/a'
            });

            setIsSent(true);
            setComment('');
            setImage(null);
            setImagePreview(null);
            setAuthor('');
        } catch (err) {
            console.error(err);
            alert('Error al enviar. Intentá de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    if (isSent) {
        return (
            <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white/70 backdrop-blur-2xl p-12 rounded-[3.5rem] shadow-2xl border border-white">
                    <div className="w-24 h-24 bg-sky-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-sky-200">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-sky-950 mb-4 tracking-tighter">¡GRACIAS!</h1>
                    <p className="text-sky-800 font-medium text-lg leading-relaxed mb-10">
                        Tu mensaje y foto se enviaron correctamente. En unos minutos aparecerán en la pantalla gigante.
                    </p>
                    <button
                        onClick={() => setIsSent(false)}
                        className="w-full py-5 bg-sky-500 hover:bg-sky-600 text-white rounded-3xl font-black text-lg transition-all shadow-xl shadow-sky-200 active:scale-95"
                    >
                        ENVIAR OTRO
                    </button>
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <button
                            onClick={() => window.location.hash = '#/15-show'}
                            className="w-full py-4 bg-white border-2 border-sky-500 text-sky-500 rounded-3xl font-black text-sm transition-all hover:bg-sky-50 uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} /> Ver Show en Vivo
                        </button>
                        <div className="flex items-center gap-2 text-sky-300">
                            <Heart size={16} fill="currentColor" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Paloma 15</span>
                            <Heart size={16} fill="currentColor" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-400 via-sky-300 to-indigo-300 p-4 sm:p-8 flex flex-col items-center">
            {/* Header decorativo */}
            <div className="w-full max-w-xl text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black tracking-[0.2em] uppercase mb-6 border border-white/20">
                    <Sparkles size={12} className="text-yellow-200" />
                    MIS 15 AÑOS • PALOMA
                </div>
                <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter leading-[0.8] mb-4 drop-shadow-2xl">
                    PALOMA<br /><span className="text-sky-100 italic">15</span>
                </h1>
                <p className="text-white/90 font-bold text-lg max-w-sm mx-auto drop-shadow-md">
                    ¡Dejale un mensaje y compartí tus fotos de la fiesta! 📸✨
                </p>
            </div>

            {/* Formulario Estilo Glass */}
            <div className="w-full max-w-xl bg-white/40 backdrop-blur-3xl rounded-[3rem] p-8 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/50">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Input Autor */}
                    <div className="space-y-3">
                        <label className="block text-sky-950 font-black text-xs uppercase tracking-widest ml-1">Tu Nombre</label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Ej: La tía María"
                            className="w-full bg-white/60 border-2 border-transparent focus:border-sky-400 focus:bg-white p-5 rounded-3xl outline-none transition-all font-bold text-sky-950 shadow-inner"
                        />
                    </div>

                    {/* Input Mensaje */}
                    <div className="space-y-3">
                        <label className="block text-sky-950 font-black text-xs uppercase tracking-widest ml-1">Mensaje para Paloma</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="¡Felices 15 Paloma! Te queremos..."
                            rows={4}
                            className="w-full bg-white/60 border-2 border-transparent focus:border-sky-400 focus:bg-white p-6 rounded-3xl outline-none transition-all font-bold text-sky-950 shadow-inner resize-none"
                        />
                    </div>

                    {/* Botón de Foto */}
                    <div className="space-y-4">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                        />

                        {imagePreview ? (
                            <div className="relative rounded-3xl overflow-hidden group shadow-2xl border-4 border-white/80 aspect-video">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setImage(null); setImagePreview(null); }}
                                    className="absolute top-4 right-4 p-3 bg-red-50 hover:bg-red-600 text-white rounded-full transition-all shadow-xl active:scale-95"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                                <div className="absolute inset-0 bg-sky-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <Camera size={40} className="text-white" />
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="w-full py-10 border-4 border-dashed border-white/60 hover:border-white hover:bg-white/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 transition-all text-white group"
                            >
                                <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                    <Camera size={32} />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest">Subir Foto</span>
                            </button>
                        )}
                    </div>

                    {/* Botón Enviar */}
                    <button
                        type="submit"
                        disabled={isUploading || (!comment && !image)}
                        className={`w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl ${isUploading || (!comment && !image)
                            ? 'bg-sky-200 text-sky-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:scale-105 active:scale-95 shadow-sky-300'
                            }`}
                    >
                        {isUploading ? (
                            <>
                                <RefreshCw className="animate-spin mr-2" size={20} />
                                ENVIANDO...
                            </>
                        ) : (
                            <>
                                <Send size={24} />
                                ENVIAR A LA PANTALLA
                            </>
                        )}
                    </button>

                    <p className="text-center text-sky-800/60 font-black text-[10px] uppercase tracking-widest">
                        Tu mensaje será revisado antes de aparecer
                    </p>
                </form>
            </div>

            {/* Footer */}
            <footer className="mt-12 text-white/60 font-bold text-sm text-center pb-8 flex flex-col items-center gap-4">
                <p>© 2026 SeiTu Castillo • Event Mode</p>
            </footer>
        </div>
    );
};

export default Paloma15;
