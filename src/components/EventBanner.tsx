import { motion } from 'framer-motion';
import { Calendar, Clock, Beer, Tv, Info, ArrowRight } from 'lucide-react';

export default function EventBanner() {
    const handleReserve = () => {
        window.dispatchEvent(new CustomEvent('open:reservation'));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative mt-0 mb-16 flex flex-col group border border-white/10"
            style={{
                backgroundImage:
                    'linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.65) 50%, rgba(0, 0, 0, 0.85) 100%), linear-gradient(to bottom, #ad1519 0%, #ad1519 25%, #fabd00 25%, #fabd00 75%, #ad1519 75%, #ad1519 100%)',
            }}
        >
            {/* Content Section */}
            <div className="relative z-10 p-8 md:p-16 w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
                <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/20 text-red-500 text-xs font-black rounded-full border border-red-500/30 uppercase tracking-widest">
                            <Calendar size={12} strokeWidth={2.5} />
                            Lunes, 15 de Junio
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-black rounded-full border border-yellow-500/30 uppercase tracking-widest animate-pulse">
                            ¡España vs. Croacia!
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight uppercase tracking-tight">
                        Apoya a la <span className="text-red-500 drop-shadow-sm">Roja</span> <br />
                        en el <span className="text-yellow-500 drop-shadow-sm">Mundial</span>
                    </h2>

                    <p className="text-gray-300 text-sm md:text-base mb-8 font-medium leading-relaxed drop-shadow-md">
                        ¡Este lunes ven a vivir la emoción del gran debut de la selección española
                        en pantalla gigante! Te invitamos a ver el partido con nosotros en un
                        ambiente inmejorable, disfrutando de nuestra exclusiva carta de sushi
                        premium. ¡Animemos a la selección juntos!
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button
                            onClick={handleReserve}
                            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-500 hover:to-yellow-500 text-white px-8 py-4 rounded-xl font-black tracking-tight transition-all duration-300 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-xs"
                        >
                            RESERVAR MESA
                            <ArrowRight size={18} strokeWidth={2.5} />
                        </button>
                        <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold tracking-widest max-w-[200px] text-center sm:text-left leading-tight">
                            <Info size={14} className="shrink-0" />
                            Plazas muy limitadas
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:max-w-md shrink-0">
                    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-red-400 mb-1">
                            <Tv size={16} strokeWidth={2.5} />
                            <h4 className="text-xs font-black uppercase tracking-wider">
                                Pantalla Gigante
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <Clock size={16} className="text-gray-400" />
                            <span className="font-bold text-sm">Desde las 20:30h</span>
                        </div>
                        <p className="text-gray-400 text-[11px] font-medium mt-1">
                            Salón climatizado y sonido envolvente para el partido.
                        </p>
                    </div>

                    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-yellow-500 mb-1">
                            <Beer size={16} strokeWidth={2.5} />
                            <h4 className="text-xs font-black uppercase tracking-wider">
                                Cerveza Especial
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <span className="font-bold text-sm">Botella a 2€ (0.33l)</span>
                        </div>
                        <p className="text-gray-400 text-[11px] font-medium mt-1">
                            Disfruta de cerveza bien fría a precio especial durante el partido.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
