import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SafeImage from '../common/SafeImage';
import { getOptimizedImageUrl } from '../../utils/images';

interface CategoryCardProps {
    id: string;
    name: string;
    image: string | null;
    index: number;
}

const CategoryCard = memo(({ id, name, image, index }: CategoryCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group relative h-40 md:h-56 rounded-[2rem] overflow-hidden cursor-pointer bg-gray-100"
        >
            <Link to={`/menu?category=${id}`} className="absolute inset-0 z-10" />

            <SafeImage
                src={image || ''}
                alt={`Sushi de Maksim: Categoría ${name} - Madrid`}
                loading="lazy"
                decoding="async"
                getOptimizedUrl={(url: string) => getOptimizedImageUrl(url, 640)}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                fallbackContent={
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-300 font-bold text-[10px] uppercase">
                            No Image
                        </span>
                    </div>
                }
            />

            {/* Soft gradient overlay for text readability at top */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>

            {/* Title at the TOP - uniform and compact */}
            <div className="absolute top-5 left-5 right-5">
                <h3 className="text-white font-black text-[15px] md:text-[18px] leading-tight drop-shadow-sm tracking-tight">
                    {name}
                </h3>
            </div>
        </motion.div>
    );
});

interface CategoriesGridProps {
    categoryList: Array<{ id: string; name: string; image: string | null }>;
    hasCategories: boolean;
    isLoading?: boolean;
}

export function CategoriesGrid({ categoryList, hasCategories, isLoading }: CategoriesGridProps) {
    return (
        <section className="py-10 md:py-16 px-2 md:px-6 bg-transparent overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-xl text-center md:text-left">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-orange-600 font-black text-xs uppercase tracking-widest mb-4 block"
                        >
                            ¿Qué te apetece hoy?
                        </motion.span>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                            Explora Nuestra <span className="text-orange-600">Carta</span>
                        </h2>
                    </div>
                    <Link
                        to="/menu"
                        className="group flex items-center justify-center md:justify-start gap-3 text-gray-900 font-black text-sm hover:text-orange-600 transition-colors no-underline"
                    >
                        VER TODAS LAS CATEGORÍAS
                        <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                            <ArrowRight size={18} strokeWidth={2} />
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-8">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="h-40 md:h-56 rounded-[2rem] bg-[#1a1a1a] animate-pulse skeleton"
                            />
                        ))
                    ) : (
                        <>
                            {categoryList.map((cat: any, idx: number) => (
                                <CategoryCard
                                    key={cat.id}
                                    id={cat.id}
                                    name={cat.name}
                                    image={cat.image}
                                    index={idx}
                                />
                            ))}
                            {!hasCategories && (
                                <div className="col-span-full text-center text-gray-400 py-12">
                                    No se encontraron categorías.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
