import { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Info, ShieldAlert, ArrowLeft, Search, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ALLERGEN_LIST_DETAILS } from '../utils/allergens';

export default function AllergensPage() {
    const [search, setSearch] = useState('');

    const filteredAllergens = ALLERGEN_LIST_DETAILS.filter(item => {
        const query = search.toLowerCase().trim();
        if (!query) return true;
        return (
            item.nameEs.toLowerCase().includes(query) ||
            item.nameRu.toLowerCase().includes(query) ||
            item.descriptionEs.toLowerCase().includes(query) ||
            item.descriptionRu.toLowerCase().includes(query) ||
            item.examplesEs.some(ex => ex.toLowerCase().includes(query)) ||
            item.examplesRu.some(ex => ex.toLowerCase().includes(query))
        );
    });

    return (
        <>
            <Helmet>
                <title>Guía de Alérgenos y Lista de Ingredientes | Sushi de Maksim</title>
                <meta
                    name="description"
                    content="Consulta la guía completa y desglosada de alérgenos de nuestro menú en Sushi de Maksim Madrid. Cumplimiento con el Reglamento (UE) Nº 1169/2011."
                />
            </Helmet>

            <div className="min-h-screen bg-[#FBF7F0] py-10 md:py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Navigation */}
                    <div className="mb-6">
                        <Link
                            to="/menu"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl text-xs font-black text-gray-700 hover:text-orange-600 border border-gray-100 shadow-sm transition-all active:scale-95 no-underline"
                        >
                            <ArrowLeft size={16} />
                            <span>Volver al Menú</span>
                        </Link>
                    </div>

                    {/* Main Header Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-orange-900/5 border border-orange-100 mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-xs font-black uppercase tracking-wider">
                                    <Info size={14} />
                                    <span>Reglamento (UE) Nº 1169/2011</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight leading-none">
                                    Guía de <span className="text-orange-600">Alérgenos</span>
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl leading-relaxed">
                                    Расшифровка всех иконок и ингредиентов нашего меню. Мы заботимся
                                    о вашей безопасности и предоставляем полную информацию об
                                    аллергенах в соответствии с нормами ЕС.
                                </p>
                            </div>

                            {/* Search Filter */}
                            <div className="relative w-full md:w-80 shrink-0">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Buscar alérgano o plato..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Allergens Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12">
                        {filteredAllergens.map((allergen, idx) => (
                            <motion.div
                                key={allergen.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-14 h-14 rounded-2xl ${allergen.bg} ${allergen.border} border flex items-center justify-center text-2xl shrink-0 shadow-sm`}
                                            >
                                                {allergen.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 leading-tight">
                                                    {allergen.nameEs}
                                                </h3>
                                                <span className="text-xs font-bold text-gray-400 block mt-0.5">
                                                    {allergen.nameRu}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mb-4">
                                        {allergen.descriptionEs}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                                        Presente en / Присутствует в:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allergen.examplesEs.map((ex, i) => (
                                            <span
                                                key={i}
                                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${allergen.bg} ${allergen.text} ${allergen.border}`}
                                            >
                                                {ex}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Safety Notice & Cross Contamination Banner */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-lg bg-gradient-to-br from-amber-50/40 to-white">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <ShieldAlert size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-gray-900">
                                        Aviso Importante sobre Contaminación Cruzada
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl leading-relaxed">
                                        В нашей кухне используются свежие морепродукты, соя и
                                        глютен. Хотя мы соблюдаем строгое разделение при
                                        приготовлении, на кухне возможен контакт с аллергенами. Если
                                        у вас сильная аллергия, пожалуйста, укажите это в
                                        комментариях к заказу.
                                    </p>
                                </div>
                            </div>

                            <a
                                href="https://wa.me/34624682795"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0 no-underline"
                            >
                                <PhoneCall size={16} />
                                <span>Consultar por WhatsApp</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
