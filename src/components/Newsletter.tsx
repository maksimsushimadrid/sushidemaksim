import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await api.post('/newsletter/subscribe', { email });
            setIsSubscribed(true);
        } catch (err: any) {
            setError(err.message || 'Error al suscribirse. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="pt-8 pb-4 md:py-16 px-2 md:px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                style={{ willChange: 'opacity, transform', backfaceVisibility: 'hidden' }}
                className="max-w-7xl mx-auto bg-black rounded-[2.5rem] md:rounded-[3.5rem] px-5 py-8 md:p-16 text-center relative overflow-hidden shadow-2xl"
            >
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-5" />

                <div className="relative z-10 max-w-2xl mx-auto">
                    {!isSubscribed ? (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className="inline-block text-white text-[10px] md:text-xs font-black uppercase tracking-widest mb-6">
                                    Sushi Club
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tighter">
                                    Únete al Club y recibe <br />
                                    <span className="text-orange-500 italic">
                                        Ofertas Exclusivas
                                    </span>
                                </h2>
                                <p className="text-gray-400 mb-10 text-sm md:text-lg leading-relaxed font-medium">
                                    No te pierdas nuestras promociones secretas, nuevos lanzamientos
                                    y secretos de la cocina japonesa directamente en tu email.
                                </p>
                            </motion.div>

                            <form
                                className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
                                onSubmit={handleSubmit}
                            >
                                <input
                                    type="email"
                                    required
                                    disabled={isLoading}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Tu mejor email..."
                                    className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all placeholder:text-gray-600 disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-orange-600 hover:bg-orange-700 text-white font-black px-10 py-4 rounded-2xl text-xs tracking-widest transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2 uppercase disabled:opacity-50 min-w-[160px]"
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            Suscribirme
                                            <Send size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                            {error && (
                                <p className="text-orange-500 text-xs mt-4 font-bold animate-pulse">
                                    {error}
                                </p>
                            )}
                            <p className="text-[10px] text-gray-600 mt-6 font-medium uppercase tracking-tighter">
                                * Sin spam, solo cosas ricas. Puedes darte de baja cuando quieras.
                            </p>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-10"
                        >
                            <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-green-500/30">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">
                                ¡Bienvenido al Club!
                            </h3>
                            <p className="text-gray-400 text-lg">
                                Gracias por unirte. Revisa tu bandeja de entrada pronto, <br />
                                tenemos una sorpresa para ti. 🍣
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </section>
    );
}
