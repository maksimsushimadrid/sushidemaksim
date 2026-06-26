import { motion } from 'framer-motion';

export function PressSection() {
    return (
        <section className="bg-[#fd6e2b]/5 py-10 md:py-20 overflow-hidden border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24"
                >
                    <div className="flex-1 text-center lg:text-left">
                        <span className="inline-block text-orange-600 text-[10px] font-black uppercase mb-6 tracking-widest">
                            Aliados y Prensa Premium
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-6">
                            Reconocidos por los <br />
                            <span className="text-orange-600 italic">Mejores de la Industria</span>
                        </h2>
                        <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Orgullosos de ser destacados por plataformas líderes y críticos
                            gastronómicos como el referente del sushi artesanal en Madrid.
                        </p>
                    </div>

                    <div className="flex-[1.5] grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                        {/* Sushify Card */}
                        <a
                            href="https://sushify.es/sushi/sushi-de-maksim/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block"
                        >
                            <div className="absolute -inset-4 bg-orange-600/5 rounded-[2.5rem] blur-2xl group-hover:bg-orange-600/10 transition-all duration-500"></div>
                            <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl shadow-orange-600/5 border border-gray-50 flex flex-col items-center gap-4 group-hover:scale-[1.02] transition-transform duration-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                        <span className="text-white font-black text-lg italic">
                                            S
                                        </span>
                                    </div>
                                    <span className="text-xl font-black text-gray-900 tracking-tighter">
                                        SUSHIFY<span className="text-orange-600">.ES</span>
                                    </span>
                                </div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-orange-600 transition-colors">
                                    Ver Reseña
                                </div>
                            </div>
                        </a>

                        {/* Groupon Card */}
                        <a
                            href="https://www.groupon.es/deals/sushi-de-maksim-1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block"
                        >
                            <div className="absolute -inset-4 bg-[#53a318]/5 rounded-[2.5rem] blur-2xl group-hover:bg-[#53a318]/10 transition-all duration-500"></div>
                            <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl shadow-[#53a318]/5 border border-gray-50 flex flex-col items-center gap-4 group-hover:scale-[1.02] transition-transform duration-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#53a318] rounded-lg flex items-center justify-center">
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-5 h-5 fill-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-black text-[#53a318] tracking-tighter uppercase">
                                        Groupon
                                    </span>
                                </div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-[#53a318] transition-colors">
                                    Ver Ofertas
                                </div>
                            </div>
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
