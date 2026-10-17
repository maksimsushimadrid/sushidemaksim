export const Marquee = () => (
    <div className="relative py-4 md:py-6 overflow-hidden bg-black border-y border-white/5 select-none">
        <div className="flex whitespace-nowrap animate-marquee">
            {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-8 md:gap-12 px-6">
                    <span className="text-white/10 text-3xl md:text-5xl font-black italic tracking-tighter">
                        FRESH SEAFOOD DAILY
                    </span>
                    <span className="text-orange-500/50 text-2xl md:text-4xl">🎃</span>
                    <span className="text-orange-500/80 text-3xl md:text-5xl font-black italic tracking-tighter">
                        HALLOWEEN SPECIAL
                    </span>
                    <span className="text-orange-600/30 text-3xl md:text-5xl font-black">●</span>
                    <span className="text-white/10 text-3xl md:text-5xl font-black italic tracking-tighter">
                        CERVEZA DE CALABAZA 0.33L
                    </span>
                    <span className="text-orange-500/50 text-2xl md:text-4xl">🦇</span>
                    <span className="text-white/10 text-3xl md:text-5xl font-black italic tracking-tighter">
                        CHEF PARA FIESTAS
                    </span>
                    <span className="text-orange-600/30 text-3xl md:text-5xl font-black">●</span>
                </div>
            ))}
        </div>
    </div>
);
