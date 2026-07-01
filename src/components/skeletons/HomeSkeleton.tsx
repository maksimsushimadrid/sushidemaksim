export const HomeSkeleton = () => (
    <div className="overflow-hidden">
        <div className="bg-black">
            {/* Hero Section */}
            <section className="relative h-[100svh] w-full px-4 md:px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0 bg-gray-900 border-none animate-pulse" />

                <div className="relative z-20 flex flex-col items-center max-w-4xl mx-auto space-y-6 w-full">
                    {/* Badge */}
                    <div className="h-[25px] md:h-[28px] w-56 bg-white/10 rounded-full animate-pulse backdrop-blur-sm" />

                    {/* Title */}
                    <div className="space-y-3 md:space-y-4 w-full flex flex-col items-center">
                        <div className="h-[38px] md:h-[86px] w-[90%] md:w-[70%] bg-white/10 rounded-2xl animate-pulse" />
                        <div className="h-[38px] md:h-[86px] w-[80%] md:w-[60%] bg-white/10 rounded-2xl animate-pulse" />
                    </div>

                    {/* Description */}
                    <div className="space-y-2 w-full flex flex-col items-center">
                        <div className="h-[18px] md:h-[24px] w-[90%] md:w-[60%] bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-[18px] md:h-[24px] w-[80%] md:w-[50%] bg-white/10 rounded-lg animate-pulse" />
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto">
                        <div className="h-[55px] md:h-[60px] w-full sm:w-[200px] bg-orange-600/50 rounded-2xl animate-pulse" />
                        <div className="h-[55px] md:h-[60px] w-full sm:w-[200px] bg-white/10 rounded-2xl animate-pulse border border-white/10" />
                    </div>
                </div>

                {/* Scroll Down Indicator */}
                <div className="absolute bottom-6 inset-x-0 flex flex-col items-center justify-center gap-1.5 opacity-20 pointer-events-none">
                    <div className="h-[10px] w-12 bg-white/20 rounded-full" />
                    <div className="h-[16px] w-[16px] bg-white/20 rounded-full mt-1" />
                </div>
            </section>

            {/* Marquee Banner */}
            <div className="relative py-4 md:py-6 overflow-hidden bg-black border-y border-white/5 h-[68px] md:h-[92px]">
                <div className="w-full h-full bg-white/5 animate-pulse" />
            </div>
        </div>

        {/* Ratings Banner */}
        <section className="bg-white py-4 md:py-6 border-y border-gray-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-px items-stretch md:bg-gray-100/50 rounded-3xl overflow-hidden p-1 md:p-0">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1 bg-white p-5 flex items-center gap-6">
                            <div className="shrink-0 w-16 space-y-2">
                                <div className="h-10 w-12 bg-gray-100 rounded-lg animate-pulse mx-auto" />
                                <div className="h-2 w-14 bg-gray-100 rounded-full animate-pulse mx-auto" />
                                <div className="h-2 w-10 bg-gray-50 rounded-full animate-pulse mx-auto" />
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                                {[1, 2, 3, 4, 5].map(j => (
                                    <div key={j} className="flex items-center gap-2">
                                        <div className="h-1 flex-1 bg-gray-50 rounded-full animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Press & Partnerships Section */}
        <section className="bg-[#fd6e2b]/5 py-10 md:py-20 overflow-hidden border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                    <div className="flex-1 text-center lg:text-left space-y-6 w-full">
                        <div className="h-[22px] w-48 bg-orange-200/50 rounded-full mx-auto lg:mx-0 animate-pulse" />
                        <div className="space-y-3 w-full">
                            <div className="h-[36px] md:h-[48px] w-3/4 mx-auto lg:mx-0 bg-gray-200 rounded-2xl animate-pulse" />
                            <div className="h-[36px] md:h-[48px] w-1/2 mx-auto lg:mx-0 bg-gray-200 rounded-2xl animate-pulse" />
                        </div>
                        <div className="h-[20px] w-full max-w-xl mx-auto lg:mx-0 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-[20px] w-[90%] max-w-xl mx-auto lg:mx-0 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="flex-[1.5] grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                        {[1, 2].map(i => (
                            <div
                                key={i}
                                className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col items-center gap-4 h-[100px]"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
                                    <div className="h-6 w-24 bg-gray-200 rounded-lg animate-pulse" />
                                </div>
                                <div className="h-3 w-16 bg-gray-100 rounded-full animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Categories Section */}
        <section className="py-10 md:py-16 px-2 md:px-6 bg-transparent overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-xl text-center md:text-left space-y-4 w-full">
                        <div className="h-[16px] w-48 bg-gray-200 rounded-full mx-auto md:mx-0 animate-pulse" />
                        <div className="h-[36px] md:h-[48px] w-3/4 mx-auto md:mx-0 bg-gray-200 rounded-2xl animate-pulse" />
                    </div>
                    <div className="hidden md:block h-[40px] w-48 bg-gray-100 rounded-full animate-pulse" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div
                            key={i}
                            className="h-40 md:h-56 bg-gray-100 rounded-[2rem] animate-pulse relative overflow-hidden"
                        >
                            <div className="absolute top-5 left-5 h-[20px] md:h-[24px] w-2/3 bg-gray-200 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Promo Banner Section */}
        <section className="px-4 py-6 md:py-12">
            <div className="max-w-7xl mx-auto">
                <div className="h-[280px] md:h-[224px] rounded-[2.5rem] bg-gray-100 animate-pulse" />
            </div>
        </section>

        {/* Popular Items Section Skeleton */}
        <section className="py-10 md:py-24 px-0 md:px-6 bg-gray-50/50 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-xl text-center md:text-left space-y-4 w-full">
                        <div className="h-[16px] w-48 bg-gray-200 rounded-full mx-auto md:mx-0 animate-pulse" />
                        <div className="h-[36px] md:h-[48px] w-3/4 mx-auto md:mx-0 bg-gray-200 rounded-2xl animate-pulse" />
                    </div>
                    <div className="hidden md:block h-[40px] w-48 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="relative -mx-4 px-4 overflow-hidden pb-10">
                    <div className="flex gap-2.5 md:gap-8 flex-nowrap w-max min-w-full">
                        {[1, 2, 3, 4].map(idx => (
                            <div
                                key={idx}
                                className="w-[260px] md:w-[320px] h-[380px] bg-gray-100 animate-pulse rounded-3xl shrink-0"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Reviews Section Skeleton */}
        <section className="py-8 md:py-20 bg-transparent overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
                <div className="h-[16px] w-48 bg-gray-200 rounded-full animate-pulse mb-4" />
                <div className="h-[36px] md:h-[48px] w-2/3 bg-gray-200 rounded-2xl animate-pulse mb-8" />
                <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse mb-6" />
                <div className="h-[100px] w-full max-w-2xl bg-gray-100 rounded-2xl animate-pulse mb-6" />
                <div className="w-14 h-14 bg-gray-200 rounded-3xl animate-pulse mb-4" />
                <div className="h-[20px] w-32 bg-gray-200 rounded-full animate-pulse" />
            </div>
        </section>

        {/* Reservation Section (AboutSection fallback) */}
        <section className="py-10 md:py-20 px-4 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="h-[300px] md:h-[500px] rounded-[3rem] bg-gray-100 animate-pulse order-last lg:order-first" />
                <div className="text-center lg:text-left space-y-6 w-full">
                    <div className="h-[16px] w-48 bg-gray-200 rounded-full mx-auto lg:mx-0 animate-pulse mb-4" />
                    <div className="h-[40px] md:h-[60px] w-3/4 mx-auto lg:mx-0 bg-gray-200 rounded-2xl animate-pulse mb-6" />
                    <div className="h-[20px] w-full bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-[20px] w-[90%] mx-auto lg:mx-0 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-[20px] w-[80%] mx-auto lg:mx-0 bg-gray-100 rounded-lg animate-pulse mb-10" />
                    <div className="h-[65px] w-full sm:w-[220px] bg-gray-200 rounded-2xl animate-pulse mx-auto lg:mx-0 mt-10" />
                </div>
            </div>
        </section>

        {/* Newsletter Section Skeleton */}
        <section className="py-12 md:py-20 px-4 bg-orange-600/10 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="h-[36px] md:h-[48px] w-3/4 bg-gray-200 rounded-2xl animate-pulse mx-auto" />
                <div className="h-[20px] w-1/2 bg-gray-100 rounded-lg animate-pulse mx-auto" />
                <div className="h-[60px] w-full max-w-md bg-gray-100 rounded-2xl animate-pulse mx-auto" />
            </div>
        </section>
    </div>
);
