import { Star } from 'lucide-react';
import { motion, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useSettings } from '../hooks/queries/useSettings';

const CountUp = ({
    value,
    duration = 1.5,
    decimals = 1,
}: {
    value: number;
    duration?: number;
    decimals?: number;
}) => {
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        const controls = animate(0, value, {
            duration,
            onUpdate(value) {
                node.textContent = value.toFixed(decimals).replace('.', ',');
            },
        });

        return () => controls.stop();
    }, [value, duration, decimals]);

    return <span ref={nodeRef}>0</span>;
};

const RatingIndicator = ({
    percentage,
    delay,
    color,
}: {
    percentage: number;
    delay: number;
    color: string;
}) => (
    <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden relative">
        <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${percentage}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay, ease: [0.34, 1.56, 0.64, 1] }}
            className={`absolute inset-0 rounded-full ${color}`}
        />
    </div>
);

const RatingsBanner = () => {
    const { data: settings } = useSettings();

    // Default values if settings not loaded yet
    const ratingGoogle = settings?.ratingGoogle || 4.8;
    const ratingTheFork = settings?.ratingTheFork || 9.1;
    const reviewsCount = settings?.ratingReviewsCount || 543;

    return (
        <section className="bg-white py-4 md:py-6 border-y border-gray-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-px items-stretch md:bg-gray-100/50 rounded-3xl overflow-hidden p-1 md:p-0">
                    {/* Google Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 bg-white p-5 flex items-center gap-6"
                    >
                        <div className="shrink-0 text-center">
                            <div className="text-4xl font-black text-gray-900 leading-none tracking-tighter mb-1.5">
                                <CountUp value={ratingGoogle} />
                            </div>
                            <div className="flex justify-center gap-0.5 mb-1.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} size={11} fill="#FBBC04" stroke="#FBBC04" />
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                                    Google
                                </span>
                                <span className="text-gray-400 text-[8px] font-bold">
                                    {reviewsCount} reseñas
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5">
                            {[
                                { label: '5', p: 92, d: 0.1 },
                                { label: '4', p: 8, d: 0.2 },
                                { label: '3', p: 2, d: 0.3 },
                                { label: '2', p: 1, d: 0.4 },
                                { label: '1', p: 4, d: 0.5 },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <span className="text-gray-300 font-bold text-[9px] w-2">
                                        {item.label}
                                    </span>
                                    <RatingIndicator
                                        percentage={item.p}
                                        delay={item.d}
                                        color="bg-[#FBBC04]"
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* The Fork Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 bg-white p-5 flex items-center gap-6"
                    >
                        <div className="shrink-0 flex flex-col items-center">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        fill="none"
                                        stroke="#f3f4f6"
                                        strokeWidth="3"
                                    />
                                    <motion.circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        fill="none"
                                        stroke="#006450"
                                        strokeWidth="3"
                                        strokeDasharray="175.9"
                                        initial={{ strokeDashoffset: 175.9 }}
                                        whileInView={{
                                            strokeDashoffset: 175.9 * (1 - ratingTheFork / 10),
                                        }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-gray-900 leading-none">
                                        <CountUp value={ratingTheFork} />
                                    </span>
                                    <span className="text-[7px] text-gray-400 font-bold uppercase">
                                        de 10
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 px-2 py-0.5 bg-[#e6f4f2] text-[#006450] text-[8px] font-black rounded-lg uppercase tracking-wider">
                                {ratingTheFork >= 9 ? 'Excelente' : 'Muy bueno'}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2.5">
                            <div className="text-[9px] font-black text-[#006450] uppercase tracking-[0.15em] mb-1 flex items-center gap-1.5 opacity-70">
                                <span className="w-1.5 h-1.5 bg-[#006450] rounded-full"></span>
                                The Fork
                            </div>
                            {[
                                { label: 'Ambiente', s: ratingTheFork - 0.2, d: 0.3 },
                                { label: 'Comida', s: ratingTheFork, d: 0.4 },
                                { label: 'Servicio', s: ratingTheFork + 0.2, d: 0.5 },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <span className="text-gray-400 font-bold text-[8px] w-14 uppercase tracking-tighter">
                                        {item.label}
                                    </span>
                                    <RatingIndicator
                                        percentage={(item.s / 10) * 100}
                                        delay={item.d}
                                        color="bg-[#006450]"
                                    />
                                    <span className="text-gray-900 font-black text-[9px] w-4 text-right">
                                        {item.s.toFixed(1)}
                                    </span>
                                </div>
                            ))}
                            <a
                                href="https://www.thefork.es/restaurante/sushi-de-maksim-r753228"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-black text-[#006450] hover:text-black transition-colors uppercase tracking-[0.2em] mt-3 block"
                            >
                                Reservar en The Fork
                            </a>
                        </div>
                    </motion.div>

                    {/* TripAdvisor Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 bg-white p-5 flex items-center gap-6"
                    >
                        <div className="shrink-0 text-center">
                            <div className="text-4xl font-black text-[#34E0A1] leading-none tracking-tighter mb-1.5">
                                <CountUp value={5.0} decimals={1} />
                            </div>
                            <div className="flex justify-center gap-1.5 mb-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div
                                        key={i}
                                        className="w-3 h-3 rounded-full bg-[#34E0A1]"
                                        style={{ border: '2px solid #34E0A1' }}
                                    ></div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                                    TripAdvisor
                                </span>
                                <span className="text-[#34E0A1] text-[8px] font-bold">
                                    🏆 #1 Premium Sushi
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-2.5">
                            <div className="text-[10px] font-black text-gray-900 uppercase tracking-tighter mb-1">
                                <span className="text-[#34E0A1] italic">Excelente</span> Selección
                            </div>
                            <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic">
                                "Una joya escondida en Madrid. Selección de pescado insuperable y
                                servicio de primer nivel."
                            </p>
                            <a
                                href="https://www.tripadvisor.es/Restaurant_Review-g187514-d25562668-Reviews-Sushi_de_Maksim-Madrid.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-black text-[#34E0A1] hover:text-black transition-colors uppercase tracking-[0.2em] mt-1"
                            >
                                Leer Opiniones
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default RatingsBanner;
