import { Link } from 'react-router-dom';
import { ArrowRight, Star, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/queries/useSettings';

const REVIEWS = [
    {
        author: 'Claudia M.',
        date: 'hace 2 días',
        text: 'Increíble descubrimiento en Adelfas. Las piezas son enormes, el salmón se deshace en la boca y el trato de Maksim es de diez. ¡Ya tenemos sitio fijo en Madrid!',
    },
    {
        author: 'Gonzalo Pardo',
        date: 'hace 5 días',
        text: 'Hicimos pedido para recoger y estaba listo al minuto. El rollo frito crujiente por fuera y templado por dentro es una auténtica maravilla.',
    },
    {
        author: 'Natalia V.',
        date: 'hace 1 semana',
        text: 'Pedimos cena para cuatro y todos alucinamos con la presentación y el tamaño de los rolls. Pescado fresquísimo y nada de arroz apelmazado.',
    },
    {
        author: 'Marcos Serrano',
        date: 'hace 2 semanas',
        text: 'El Dragón Roll y el atún Balfegó son de otro planeta. Se nota el mimo artesanal que le pone el chef en cada corte. 100% recomendable.',
    },
    {
        author: 'Irene Carrasco',
        date: 'hace 3 semanas',
        text: 'Llevo años viviendo en Madrid probando japoneses, y la relación calidad-precio de Maksim es imbatible. El packaging impecable y las piezas generosas.',
    },
    {
        author: 'Víctor H.',
        date: 'hace 1 mes',
        text: 'Trato súper cercano y profesional. Los nigiris de anguila y vieira tienen un sabor brutal. Se ha convertido en nuestro capricho favorito de los viernes.',
    },
    {
        author: 'Beatriz Morales',
        date: 'hace 1 mes',
        text: 'Comida de restaurante de alta cocina pero con la comodidad de pedir a casa. Todo llegó perfecto, a buena temperatura y con un sabor auténtico.',
    },
    {
        author: 'Rubén D.',
        date: 'hace 1 mes',
        text: 'Los mejores rollos especiales que he probado. El equilibrio de salsas y el toque crujiente están perfectamente medidos. Cinco estrellas muy merecidas.',
    },
    {
        author: 'Silvia Benítez',
        date: 'hace 2 meses',
        text: 'Cena sorpresa de aniversario y quedamos encantadísimos. Todo súper fresco, limpio y con una atención al detalle exquisita por parte de Maksim.',
    },
    {
        author: 'Adrián R.',
        date: 'hace 2 meses',
        text: 'Se nota cuando alguien ama su oficio. El arroz en su punto exacto de cocción y vinagre, y raciones contundentes que no te dejan con hambre.',
    },
    {
        author: 'María García',
        date: 'hace 3 meses',
        text: 'El mejor sushi que he probado en Madrid. Los rollos fritos son una auténtica locura, el pedido llegó rápido y perfectamente empaquetado.',
    },
    {
        author: 'Alejandro Ruiz',
        date: 'hace 3 meses',
        text: 'Sabor increíble y el pescado súper fresco. El empaquetado es muy cuidado y el pedido llegó en perfecto estado. Calidad premium garantizada.',
    },
    {
        author: 'Elena B.',
        date: 'hace 4 meses',
        text: 'Sencillamente espectacular. Las piezas son generosas y el sabor es auténtico. Se nota el cariño en la preparación. 10/10 en cada bocado.',
    },
    {
        author: 'Carlos Fernández',
        date: 'hace 4 meses',
        text: '¡Espectacular! Se nota que cuidan cada detalle. El arroz estaba en su punto perfecto, el pescado brillante y fresco. Entrega rápida y puntual.',
    },
    {
        author: 'Ana López',
        date: 'hace 5 meses',
        text: 'Llevo años probando diferentes sitios de sushi, y Maksim se ha convertido en mi favorito absoluto. La calidad siempre es constante.',
    },
    {
        author: 'David Gómez',
        date: 'hace 5 meses',
        text: 'Las porciones son generosas y el sabor te transporta a Japón. El salmón flambeado y los makis de autor son insuperables. Sin duda, 5 estrellas.',
    },
    {
        author: 'Sofía Navarro',
        date: 'hace 6 meses',
        text: 'Presentación de 10. Fue una cena sorpresa para mi pareja y quedamos encantados con la calidad y frescura de los ingredientes.',
    },
    {
        author: 'Javier Domínguez',
        date: 'hace 6 meses',
        text: 'Soy muy exigente con el pescado crudo y aquí es espectacular. Súper fresco, cortes limpios y un sabor delicioso.',
    },
    {
        author: 'Lucía Ramos',
        date: 'hace 7 meses',
        text: 'El rollo de pez mantequilla con trufa es una experiencia obligatoria. Pedido a través de la web facilísimo y recogida puntual en Barrilero.',
    },
    {
        author: 'Pablo Castillo',
        date: 'hace 8 meses',
        text: 'Calidad japonesa real en la calle Barrilero. Piezas grandes que de verdad llenan y una atención al cliente de primer nivel. ¡Un 10!',
    },
];

export function HeroSection() {
    const { data: settings } = useSettings();
    const googleReviewsUrl =
        settings?.contactGoogleMapsUrl ||
        'https://www.google.com/maps/search/?api=1&query=' +
            encodeURIComponent('Sushi de Maksim, C. de Barrilero, 20, 28007 Madrid');

    const [currentReview, setCurrentReview] = useState(0);
    const [isReviewPaused, setIsReviewPaused] = useState(false);

    useEffect(() => {
        if (isReviewPaused) return;

        const timer = setInterval(() => {
            setCurrentReview(prev => (prev + 1) % REVIEWS.length);
        }, 5000);

        return () => {
            clearInterval(timer);
        };
    }, [isReviewPaused]);

    const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const checkPerformancePrefs = () => {
            const isMobile = window.innerWidth < 768;
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

            if (!isMobile && !prefersReducedMotion && !isSlowConnection && !isDataSaver) {
                // Defer loading of heavy background video by 2 seconds to optimize LCP.
                // The lightweight preloaded poster image will render first and serve as the LCP element.
                timer = setTimeout(() => {
                    setShouldPlayVideo(true);
                }, 2000);
            }
        };

        checkPerformancePrefs();
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, []);

    return (
        <section className="relative h-[100svh] md:h-screen w-full px-4 md:px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-black">
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
                {/* Background Image is ALWAYS mounted to serve as the stable LCP element */}
                <img
                    src="/hero-poster.webp"
                    srcSet="/hero-poster-mobile.webp 768w, /hero-poster.webp 1920w"
                    sizes="(max-width: 768px) 768px, 1920px"
                    alt="Sushi background"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    {...({ fetchpriority: 'high' } as any)}
                />

                {/* Video loads on top and fades in smoothly once playing to avoid flash */}
                {shouldPlayVideo && (
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        onPlay={e => {
                            const video = e.currentTarget;
                            video.style.opacity = '1';
                        }}
                        style={{ opacity: 0, transition: 'opacity 1s ease-in-out' }}
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source src="/hero-video.webm" type="video/webm" />
                        <source src="/hero-video.mp4" type="video/mp4" />
                    </video>
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

                    <a
                        href={googleReviewsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/title block no-underline cursor-pointer"
                        title="Ver perfil y reseñas en Google Maps"
                    >
                        <h2 className="text-[42px] leading-[0.9] md:text-8xl font-black text-white tracking-tighter group-hover/title:scale-[1.01] transition-transform">
                            Reseñas de <br />
                            <span className="text-orange-600 italic">Google</span> Maps
                        </h2>
                    </a>

                    <div className="h-[105px] md:h-[120px] w-full max-w-md mx-auto relative">
                        <AnimatePresence mode="wait">
                            <motion.a
                                key={currentReview}
                                href={googleReviewsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir reseña en Google Maps"
                                aria-label={`Ver reseña de ${REVIEWS[currentReview].author} en Google Maps`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="absolute inset-0 flex flex-col items-center justify-start group/review no-underline cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
                                onMouseEnter={() => setIsReviewPaused(true)}
                                onMouseLeave={() => setIsReviewPaused(false)}
                                onFocus={() => setIsReviewPaused(true)}
                                onBlur={() => setIsReviewPaused(false)}
                            >
                                <div className="flex items-center gap-0.5 mb-2 text-orange-500 group-hover/review:text-orange-400 transition-colors">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            fill="currentColor"
                                            strokeWidth={1}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm md:text-lg text-gray-200 group-hover/review:text-white leading-relaxed font-medium line-clamp-2 px-2 drop-shadow-sm transition-colors">
                                    "{REVIEWS[currentReview].text}"
                                </p>
                                <span className="text-xs md:text-sm text-zinc-100 group-hover/review:text-orange-300 font-black uppercase tracking-wider mt-2 flex items-center justify-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] transition-colors">
                                    <span className="text-orange-400 font-extrabold">—</span>
                                    <span>{REVIEWS[currentReview].author}</span>
                                    {REVIEWS[currentReview].date && (
                                        <span className="text-[10px] md:text-xs text-zinc-300 font-medium normal-case tracking-normal">
                                            · {REVIEWS[currentReview].date}
                                        </span>
                                    )}
                                    <ExternalLink
                                        size={12}
                                        className="opacity-0 group-hover/review:opacity-100 transition-opacity text-orange-400 ml-0.5"
                                    />
                                </span>
                            </motion.a>
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
