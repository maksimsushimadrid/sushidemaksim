import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_URL } from '../constants/config';

const REVIEWS = [
    {
        name: 'Claudia M.',
        date: '2026-11-07',
        text: 'Increíble descubrimiento en Adelfas. Las piezas son enormes, el salmón se deshace en la boca y el trato de Maksim es de diez. ¡Ya tenemos sitio fijo en Madrid!',
        rating: 5,
        location: 'Adelfas, Retiro',
    },
    {
        name: 'Gonzalo Pardo',
        date: '2026-11-04',
        text: 'Hicimos pedido para recoger y estaba listo al minuto. El rollo frito crujiente por fuera y templado por dentro es una auténtica maravilla.',
        rating: 5,
        location: 'Pacífico',
    },
    {
        name: 'Natalia V.',
        date: '2026-11-02',
        text: 'Pedimos cena para cuatro y todos alucinamos con la presentación y el tamaño de los rolls. Pescado fresquísimo y nada de arroz apelmazado.',
        rating: 5,
        location: 'Retiro',
    },
    {
        name: 'Marcos Serrano',
        date: '2026-10-26',
        text: 'El Dragón Roll y el atún Balfegó son de otro planeta. Se nota el mimo artesanal que le pone el chef en cada corte. 100% recomendable.',
        rating: 5,
        location: 'Salamanca',
    },
    {
        name: 'Irene Carrasco',
        date: '2026-10-19',
        text: 'Llevo años viviendo en Madrid probando japoneses, y la relación calidad-precio de Maksim es imbatible. El packaging impecable y las piezas generosas.',
        rating: 5,
        location: 'Chamberí',
    },
    {
        name: 'Víctor H.',
        date: '2026-10-09',
        text: 'Trato súper cercano y profesional. Los nigiris de anguila y vieira tienen un sabor brutal. Se ha convertido en nuestro capricho favorito de los viernes.',
        rating: 5,
        location: 'Centro',
    },
    {
        name: 'Beatriz Morales',
        date: '2026-10-02',
        text: 'Comida de restaurante de alta cocina pero con la comodidad de pedir a casa. Todo llegó perfecto, a buena temperatura y con un sabor auténtico.',
        rating: 5,
        location: 'Arganzuela',
    },
    {
        name: 'Rubén D.',
        date: '2026-09-24',
        text: 'Los mejores rollos especiales que he probado. El equilibrio de salsas y el toque crujiente están perfectamente medidos. Cinco estrellas muy merecidas.',
        rating: 5,
        location: 'Moncloa',
    },
    {
        name: 'Silvia Benítez',
        date: '2026-09-12',
        text: 'Cena sorpresa de aniversario y quedamos encantadísimos. Todo súper fresco, limpio y con una atención al detalle exquisita por parte de Maksim.',
        rating: 5,
        location: 'Chamartín',
    },
    {
        name: 'Adrián R.',
        date: '2026-08-30',
        text: 'Se nota cuando alguien ama su oficio. El arroz en su punto exacto de cocción y vinagre, y raciones contundentes que no te dejan con hambre.',
        rating: 5,
        location: 'Tetuán',
    },
    {
        name: 'María García',
        date: '2026-08-15',
        text: 'El mejor sushi que he probado en Madrid. Los rollos fritos son una auténtica locura, el pedido llegó rápido y perfectamente empaquetado.',
        rating: 5,
        location: 'Retiro',
    },
    {
        name: 'Alejandro Ruiz',
        date: '2026-08-01',
        text: 'Sabor increíble y el pescado súper fresco. El empaquetado es muy cuidado y el pedido llegó en perfecto estado. Calidad premium garantizada.',
        rating: 5,
        location: 'Salamanca',
    },
    {
        name: 'Elena B.',
        date: '2026-07-20',
        text: 'Sencillamente espectacular. Las piezas son generosas y el sabor es auténtico. Se nota el cariño en la preparación. 10/10 en cada bocado.',
        rating: 5,
        location: 'Chamberí',
    },
    {
        name: 'Carlos Fernández',
        date: '2026-07-05',
        text: '¡Espectacular! Se nota que cuidan cada detalle. El arroz estaba en su punto perfecto, el pescado brillante y fresco. Entrega rápida y puntual.',
        rating: 5,
        location: 'Adelfas',
    },
    {
        name: 'Ana López',
        date: '2026-06-22',
        text: 'Llevo años probando diferentes sitios de sushi, y Maksim se ha convertido en mi favorito absoluto. La calidad siempre es constante.',
        rating: 5,
        location: 'Argüelles',
    },
    {
        name: 'David Gómez',
        date: '2026-06-10',
        text: 'Las porciones son generosas y el sabor te transporta a Japón. El salmón flambeado y los makis de autor son insuperables. Sin duda, 5 estrellas.',
        rating: 5,
        location: 'Pacífico',
    },
    {
        name: 'Sofía Navarro',
        date: '2026-05-28',
        text: 'Presentación de 10. Fue una cena sorpresa para mi pareja y quedamos encantados con la calidad y frescura de los ingredientes.',
        rating: 5,
        location: 'Malasaña',
    },
    {
        name: 'Javier Domínguez',
        date: '2026-05-15',
        text: 'Soy muy exigente con el pescado crudo y aquí es espectacular. Súper fresco, cortes limpios y un sabor delicioso.',
        rating: 5,
        location: 'La Latina',
    },
    {
        name: 'Lucía Ramos',
        date: '2026-04-30',
        text: 'El rollo de pez mantequilla con trufa es una experiencia obligatoria. Pedido a través de la web facilísimo y recogida puntual en Barrilero.',
        rating: 5,
        location: 'Castellana',
    },
    {
        name: 'Pablo Castillo',
        date: '2026-04-12',
        text: 'Calidad japonesa real en la calle Barrilero. Piezas grandes que de verdad llenan y una atención al cliente de primer nivel. ¡Un 10!',
        rating: 5,
        location: 'Retiro',
    },
];

export default function ReviewsSEO() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const nextReview = useCallback(() => {
        setDirection(1);
        setCurrentIndex(prev => (prev + 1) % REVIEWS.length);
    }, []);

    const prevReview = useCallback(() => {
        setDirection(-1);
        setCurrentIndex(prev => (prev - 1 + REVIEWS.length) % REVIEWS.length);
    }, []);

    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(nextReview, 8000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, nextReview]);

    const schema = REVIEWS.map(r => ({
        '@context': 'https://schema.org',
        '@type': 'Review',
        author: {
            '@type': 'Person',
            name: r.name,
        },
        datePublished: r.date,
        reviewBody: r.text,
        reviewRating: {
            '@type': 'Rating',
            ratingValue: r.rating,
            bestRating: 5,
        },
        itemReviewed: {
            '@type': 'Restaurant',
            name: 'Sushi de Maksim',
            image: `${SITE_URL}/sushi-hero.webp`,
            telephone: '+34 631 920 312',
            priceRange: '$$',
            servesCuisine: ['Japanese', 'Sushi'],
            address: {
                '@type': 'PostalAddress',
                streetAddress: 'Calle del Barrilero, 20',
                addressLocality: 'Madrid',
                postalCode: '28007',
                addressCountry: 'ES',
            },
        },
    }));

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            filter: 'blur(10px)',
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            filter: 'blur(0px)',
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            filter: 'blur(10px)',
        }),
    };

    return (
        <section className="py-8 md:py-20 bg-transparent overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center text-center mb-10 md:mb-16">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em]">
                            Reseñas Reales
                        </span>
                        <div className="h-px w-8 bg-orange-100 hidden md:block" />
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                            <svg className="w-3 h-3" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="text-[10px] font-bold text-gray-500">Google</span>
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                        Lo que dicen <span className="text-orange-600">de nosotros</span>
                    </h2>
                </div>

                <div className="relative min-h-[320px] md:min-h-[280px]">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 200, damping: 25 },
                                opacity: { duration: 0.8 },
                                filter: { duration: 0.8 },
                            }}
                            className="absolute inset-0 px-2"
                        >
                            <div className="h-full flex flex-col items-center justify-center text-center transition-all duration-700">
                                <div className="flex gap-1 mb-8">
                                    {[...Array(REVIEWS[currentIndex].rating)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={20}
                                            fill="currentColor"
                                            className="text-amber-400"
                                        />
                                    ))}
                                </div>

                                <blockquote className="text-2xl md:text-4xl font-black text-gray-900 italic mb-10 leading-tight md:leading-tight tracking-tighter max-w-4xl">
                                    "{REVIEWS[currentIndex].text}"
                                </blockquote>

                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-14 h-14 bg-orange-600 rounded-3xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-orange-200 transform rotate-3">
                                        {REVIEWS[currentIndex].name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="font-black text-gray-900 text-base uppercase tracking-widest">
                                            {REVIEWS[currentIndex].name}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-[10px] text-orange-500 font-black tracking-[0.2em] uppercase">
                                                Cliente Verificado
                                            </div>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                <MapPin size={10} className="text-orange-400" />
                                                {REVIEWS[currentIndex].location}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8">
                    <button
                        onClick={() => {
                            setIsAutoPlaying(false);
                            prevReview();
                        }}
                        className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all border border-gray-100 shadow-sm"
                        aria-label="Previous review"
                    >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>

                    <div className="flex gap-2">
                        {REVIEWS.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setIsAutoPlaying(false);
                                    setDirection(idx > currentIndex ? 1 : -1);
                                    setCurrentIndex(idx);
                                }}
                                className={`h-1.5 transition-all duration-500 rounded-full ${
                                    idx === currentIndex ? 'w-8 bg-orange-600' : 'w-2 bg-gray-200'
                                }`}
                                aria-label={`Go to review ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            setIsAutoPlaying(false);
                            nextReview();
                        }}
                        className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all border border-gray-100 shadow-sm"
                        aria-label="Next review"
                    >
                        <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Schema.org integration */}
                {schema.map((s, i) => (
                    <script key={i} type="application/ld+json">
                        {JSON.stringify(s)}
                    </script>
                ))}
            </div>
        </section>
    );
}
