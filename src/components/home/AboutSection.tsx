import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import SafeImage from '../common/SafeImage';
import { getOptimizedImageUrl } from '../../utils/images';

export function AboutSection() {
    return (
        <section className="py-10 md:py-20 bg-transparent px-4 border-t border-gray-100">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                    style={{ willChange: 'opacity, transform', backfaceVisibility: 'hidden' }}
                    className="relative px-4"
                >
                    <div className="rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl skew-y-1 aspect-[4/3]">
                        <SafeImage
                            src="/blog_post_chef_hands.webp"
                            getOptimizedUrl={(url: string) => getOptimizedImageUrl(url, 800)}
                            alt="Preparación artesanal de sushi — Sushi de Maksim"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Floating Badge */}
                    <div className="absolute -bottom-4 -right-2 md:-bottom-6 md:-right-6 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 max-w-[160px] md:max-w-[200px] animate-float">
                        <div className="flex gap-1 mb-1 md:mb-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star
                                    key={i}
                                    size={10}
                                    strokeWidth={1.5}
                                    className="text-amber-400"
                                />
                            ))}
                        </div>
                        <p className="text-[9px] md:text-[11px] font-bold text-gray-800 italic leading-tight">
                            "El mejor sushi que he probado en todo Madrid."
                        </p>
                        <p className="text-[7px] md:text-[9px] text-gray-400 mt-1 uppercase font-black">
                            Pablo G. - Cliente Verificado
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                    style={{ willChange: 'opacity, transform', backfaceVisibility: 'hidden' }}
                    className="text-center lg:text-left pt-10 lg:pt-0"
                >
                    <span className="text-orange-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 block">
                        Nuestra Historia
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight tracking-tighter">
                        Más que una Cocina, <br className="hidden md:block" />
                        Una{' '}
                        <span className="italic underline decoration-orange-600 decoration-4 underline-offset-8">
                            Pasión
                        </span>
                    </h2>
                    <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                        En Sushi de Maksim, cada corte de pescado es un homenaje a la técnica
                        milenaria. Nos esforzamos por llevarte no solo una cena, sino un momento de
                        placer gastronómico inolvidable.
                    </p>
                    <div className="space-y-4 mb-10">
                        {[
                            'Pescado Fresco del Día',
                            'Arroz Premium de Grano Corto',
                            'Recetas Originales del Chef',
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center">
                                    <ChevronRight
                                        size={12}
                                        strokeWidth={1.5}
                                        className="text-white"
                                    />
                                </div>
                                <span className="font-bold text-gray-800 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                    <Link
                        to="/tablon"
                        className="text-gray-900 font-black text-sm group flex items-center gap-2 hover:text-orange-600 transition-colors"
                    >
                        VER TABLÓN DE LA COMUNIDAD
                        <ArrowRight
                            size={16}
                            strokeWidth={1.5}
                            className="group-hover:translate-x-1 transition-transform"
                        />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
