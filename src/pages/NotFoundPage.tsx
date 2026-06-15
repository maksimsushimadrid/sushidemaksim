import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Utensils, ArrowLeft, Search } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#FBF7F0]">
            <SEO
                title="404 - Página no encontrada | Sushi de Maksim"
                description="La página que buscas no existe. Vuelve a la carta de Sushi de Maksim para disfrutar de la mejor gastronomía japonesa."
                robots="noindex, nofollow"
            />

            {/* Background elements */}
            <div className="absolute top-1/4 -left-20 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-orange-100/20 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center max-w-lg text-center gap-8">
                {/* Visual Part */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                    className="relative"
                >
                    <h1 className="text-[120px] md:text-[180px] font-black leading-none text-gray-900/5 select-none tracking-tighter">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center rotate-12 relative overflow-hidden border border-gray-100">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-50" />
                            <Search
                                size={48}
                                className="text-orange-600 animate-pulse relative z-10"
                                strokeWidth={1.5}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Text Content */}
                <div className="space-y-4">
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight"
                    >
                        ¡Ups! Parece que te has perdido
                    </motion.h2>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-500 font-medium text-lg max-w-sm mx-auto leading-relaxed"
                    >
                        La página que buscas ha sido devorada o nunca existió. ¿Qué tal si volvemos
                        a lo importante?
                    </motion.p>
                </div>

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 w-full"
                >
                    <button
                        onClick={() => navigate('/menu')}
                        className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-900/10"
                    >
                        <Utensils size={20} /> Ver la Carta
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 px-8 py-4 bg-white text-gray-900 border border-gray-100 rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95 shadow-lg shadow-gray-200/20"
                    >
                        <Home size={20} /> Ir al Inicio
                    </button>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={() => navigate(-1)}
                    className="text-gray-400 font-bold flex items-center gap-2 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Volver atrás
                </motion.button>
            </div>

            {/* Floating Sushi Decoration (Decorative) */}
            <motion.div
                animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="absolute top-20 right-10 opacity-10 hidden lg:block"
            >
                <Utensils size={100} className="text-orange-500" />
            </motion.div>
        </div>
    );
}
