export const PromoSkeleton = () => (
    <div className="flex-1 bg-transparent">
        {/* Hero Header Skeleton */}
        <section className="relative h-72 md:h-80 flex items-center justify-center overflow-hidden pt-12 border-b border-gray-800 bg-black/80">
            <div className="max-w-4xl mx-auto text-center relative z-10 w-full px-4 space-y-4">
                <div className="h-12 w-3/4 skeleton rounded-2xl mx-auto opacity-30" />
                <div className="h-6 w-1/2 skeleton rounded-lg mx-auto opacity-20" />
            </div>
        </section>

        <div className="max-w-7xl mx-auto px-2 md:px-4 -mt-12 md:-mt-20 mb-20 relative z-20 space-y-12 md:space-y-20">
            {/* Dynamic Banner Skeleton 1 */}
            <div className="bg-gray-50/50 rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-20 border border-gray-100 shadow-sm">
                <div className="flex-1 space-y-6 w-full">
                    <div className="h-6 w-32 skeleton rounded-full opacity-40" />
                    <div className="h-16 md:h-24 w-full skeleton rounded-2xl opacity-30" />
                    <div className="h-4 w-3/4 skeleton rounded-lg opacity-20" />
                    <div className="h-12 w-48 skeleton rounded-[2rem] opacity-30" />
                </div>
                <div className="w-full lg:w-[400px] aspect-video lg:aspect-square skeleton rounded-[3rem] opacity-20" />
            </div>

            {/* Dynamic Banner Skeleton 2 */}
            <div className="bg-gray-50/50 rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-20 border border-gray-100 shadow-sm">
                <div className="flex-1 space-y-6 w-full">
                    <div className="h-6 w-32 skeleton rounded-full opacity-40" />
                    <div className="h-16 md:h-24 w-full skeleton rounded-2xl opacity-30" />
                    <div className="h-4 w-3/4 skeleton rounded-lg opacity-20" />
                    <div className="h-12 w-48 skeleton rounded-[2rem] opacity-30" />
                </div>
                <div className="w-full lg:w-[400px] aspect-video lg:aspect-square skeleton rounded-[3rem] opacity-20" />
            </div>

            {/* Promo Menu Items Skeleton */}
            <div className="max-w-6xl mx-auto pt-10">
                <div className="flex flex-col items-center gap-3 mb-12">
                    <div className="h-10 w-64 skeleton rounded-xl opacity-20" />
                    <div className="h-1.5 w-24 bg-gray-200 rounded-full" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col h-[400px] md:h-[520px] border border-gray-50"
                        >
                            <div className="h-40 md:h-64 skeleton rounded-none opacity-20" />
                            <div className="p-4 md:p-10 space-y-4 flex-1 flex flex-col">
                                <div className="h-6 md:h-10 w-3/4 skeleton rounded-xl opacity-30" />
                                <div className="h-4 w-full skeleton rounded-lg opacity-10" />
                                <div className="h-4 w-2/3 skeleton rounded-lg opacity-10" />
                                <div className="mt-auto flex items-center justify-between gap-4">
                                    <div className="h-10 w-24 skeleton rounded-xl opacity-20" />
                                    <div className="h-12 w-12 md:w-32 md:h-14 skeleton rounded-2xl opacity-30" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
