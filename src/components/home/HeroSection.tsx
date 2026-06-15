import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const REVIEWS = [
    {
        author: 'María García',
        text: 'El mejor sushi que he probado en Madrid. Los rollos fritos son una auténtica locura, ¡volveremos a pedir seguro!',
    },
    {
        author: 'Alejandro Ruiz',
        text: 'Sabor increíble y el pescado súper fresco. El empaquetado es muy cuidado y el pedido llegó en perfecto estado.',
    },
    {
        author: 'Laura Martínez',
        text: 'La calidad-precio es insuperable. Los nigiris de salmón se deshacen en la boca. Muy recomendado para cenar.',
    },
    {
        author: 'Carlos Fernández',
        text: '¡Espectacular! Se nota que cuidan cada detalle. El arroz estaba en su punto perfecto. Entrega rápida.',
    },
    {
        author: 'Ana López',
        text: 'Llevo años probando diferentes sitios de sushi, y Maksim se ha convertido en mi favorito absoluto.',
    },
    {
        author: 'David Gómez',
        text: 'Las porciones son generosas y el sabor te transporta a Japón. Sin duda, 5 estrellas.',
    },
    {
        author: 'Sofía Navarro',
        text: 'Presentación de 10. Fue una cena sorpresa para mi pareja y quedamos encantados con la calidad.',
    },
    {
        author: 'Javier Domínguez',
        text: 'Soy muy exigente con el pescado crudo y aquí es espectacular. Súper fresco y delicioso.',
    },
];

export function HeroSection() {
    const [currentReview, setCurrentReview] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentReview(prev => (prev + 1) % REVIEWS.length);
        }, 5000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    // Dynamically preload hero poster only on the homepage
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = '/hero-poster.jpg';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    const [shouldPlayVideo, setShouldPlayVideo] = useState(true);

    useEffect(() => {
        const checkPerformancePrefs = () => {
            const prefersReducedMotion = window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches;
            let isSlowConnection = false;
            let isDataSaver = false;

            if ('connection' in navigator) {
                const conn = (navigator as any).connection;
                isSlowConnection = ['slow-2g', '2g', '3g'].includes(conn.effectiveType);
                isDataSaver = conn.saveData;
            }

            if (prefersReducedMotion || isSlowConnection || isDataSaver) {
                setShouldPlayVideo(false);
            }
        };

        checkPerformancePrefs();
    }, []);

    return (
        <section className="relative h-screen w-full px-4 md:px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-black">
            {/* Visual context for SEO */}
            <h1 className="sr-only">
                Sushi de Maksim: El mejor sushi artesanal a domicilio en Madrid
            </h1>
            <h2 className="sr-only">Bienvenido a nuestro restaurante japonés premium</h2>

            {/* Background Video with tinted overlay */}
            <div className="absolute inset-0 z-0 bg-[#0d0d0d]">
                <div
                    className="absolute inset-0 z-10"
                    style={{
                        background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.75) 100%)',
                    }}
                />
                {shouldPlayVideo ? (
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        poster="/hero-poster.jpg"
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source src="/hero-video.webm" type="video/webm" />
                        <source src="/hero-video.mp4" type="video/mp4" />
                    </video>
                ) : (
                    <img
                        src="/hero-poster.jpg"
                        alt="Sushi background"
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="eager"
                    />
                )}
            </div>

            <div className="relative z-20 flex flex-col items-center max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="space-y-6"
                >
                    <span className="inline-block text-white text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
                        Artesanía japonesa en tu mesa
                    </span>

                    <h2 className="text-[42px] leading-[0.9] md:text-8xl font-black text-white tracking-tighter">
                        Reseñas de <br />
                        <span className="text-orange-600 italic">Google</span> Maps
                    </h2>

                    <div className="h-[96px] md:h-[110px] w-full max-w-md mx-auto relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentReview}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="absolute inset-0 flex flex-col items-center justify-start"
                            >
                                <div className="flex items-center gap-0.5 mb-2 text-orange-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            fill="currentColor"
                                            strokeWidth={1}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm md:text-lg text-gray-300 leading-relaxed font-medium line-clamp-2 px-2">
                                    "{REVIEWS[currentReview].text}"
                                </p>
                                <span className="text-[10px] md:text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">
                                    — {REVIEWS[currentReview].author}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            to="/menu"
                            className="group relative w-full sm:w-auto px-10 py-5 bg-orange-600 text-white rounded-2xl font-black text-[13px] tracking-widest transition-all duration-300 hover:bg-orange-700 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-2xl shadow-orange-600/20 no-underline"
                        >
                            NUESTRA CARTA
                            <ArrowRight
                                className="transition-transform group-hover:translate-x-1"
                                size={18}
                            />
                        </Link>

                        <button
                            onClick={() =>
                                window.dispatchEvent(new CustomEvent('open:reservation'))
                            }
                            className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[13px] tracking-widest transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-95 flex items-center justify-center no-underline cursor-pointer backdrop-blur-sm"
                        >
                            RESERVAR MESA
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Down Indicator — CSS-only for perf (avoid FM infinite loop) */}
            <div className="absolute bottom-10 inset-x-0 flex flex-col items-center justify-center gap-1.5 text-white/40 pointer-events-none animate-pulse">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-center ml-[0.3em]">
                    Scrollea
                </span>
                <ArrowRight className="rotate-90" size={16} />
            </div>
        </section>
    );
}
