export const ProfileSkeleton = () => (
    <div className="min-h-screen bg-transparent flex flex-col overflow-x-hidden">
        {/* Full-Screen Dark Hero Skeleton - Matching ProfilePage */}
        <div
            className="relative w-full min-h-[100svh] md:min-h-[82vh] flex flex-col justify-end overflow-hidden pb-10 sm:pb-14 px-4 sm:px-6 md:px-8 bg-zinc-950"
            style={{ paddingTop: 'calc(var(--header-height, 64px) + 50px)' }}
        >
            {/* Subtle ambient shimmer background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black animate-pulse" />
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/85 via-black/35 to-transparent z-[1] pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/80 via-45% to-transparent z-[3] pointer-events-none" />

            {/* Overlaid Identity, Stats & Actions */}
            <div className="max-w-7xl mx-auto w-full relative z-10 pt-16 sm:pt-24 md:pt-32">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    {/* User Identity Skeleton */}
                    <div className="flex-1 w-full">
                        <div className="h-9 sm:h-11 md:h-12 w-52 sm:w-64 bg-white/15 rounded-2xl animate-pulse" />
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
                            <div className="h-4 w-44 bg-white/10 rounded-lg animate-pulse" />
                            <div className="h-5 w-32 bg-white/10 rounded-lg border border-white/10 animate-pulse" />
                        </div>
                    </div>

                    {/* Unboxed Stats & Action Buttons Skeleton */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 w-full md:w-auto mt-2 md:mt-0">
                        <div className="flex items-center gap-6 sm:gap-8 py-1">
                            <div className="flex flex-col gap-2">
                                <div className="h-8 sm:h-9 w-12 bg-white/15 rounded-xl animate-pulse" />
                                <div className="h-3 w-14 bg-white/10 rounded animate-pulse" />
                            </div>

                            <div className="h-8 w-px bg-white/20" />

                            <div className="flex flex-col gap-2">
                                <div className="h-8 sm:h-9 w-16 bg-amber-400/20 rounded-xl animate-pulse" />
                                <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <div className="flex-1 sm:flex-none h-10 sm:w-24 bg-white/15 rounded-xl border border-white/20 animate-pulse" />
                            <div className="flex-1 sm:flex-none h-10 sm:w-36 bg-white/15 rounded-xl border border-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content Skeleton */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 pt-6 pb-20 relative z-20">
            {/* Unified Loyalty Program Card Skeleton */}
            <div className="mb-5 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="space-y-2">
                        <div className="h-4 w-40 skeleton rounded-lg" />
                        <div className="h-3 w-64 skeleton rounded-lg opacity-50" />
                    </div>
                    <div className="h-4 w-16 skeleton rounded-lg opacity-60" />
                </div>

                <div className="space-y-5">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-2.5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="w-4 h-4 skeleton rounded shrink-0" />
                                    <div className="space-y-1.5 flex-1">
                                        <div className="h-3.5 w-40 skeleton rounded-lg" />
                                        <div className="h-2.5 w-56 max-w-full skeleton rounded-lg opacity-40" />
                                    </div>
                                </div>
                                <div className="text-right space-y-1 shrink-0">
                                    <div className="h-3.5 w-16 skeleton rounded ml-auto" />
                                    <div className="h-2.5 w-14 skeleton rounded ml-auto opacity-40" />
                                </div>
                            </div>
                            <div className="h-2 w-full bg-gray-100 skeleton rounded-full" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
                {/* Navigation Sidebar Skeleton */}
                <aside className="lg:w-72 shrink-0">
                    <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-sm rounded-2xl p-1.5 grid grid-cols-4 lg:flex lg:flex-col gap-1.5">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="w-full h-11 lg:h-12 bg-gray-100/70 skeleton rounded-xl"
                            />
                        ))}
                    </div>
                </aside>

                {/* Content Section Skeleton */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-5 sm:p-6 md:p-8 space-y-8">
                        <div className="h-7 w-44 bg-gray-100 skeleton rounded-xl" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="space-y-2.5">
                                    <div className="h-3 w-24 bg-gray-100 skeleton rounded opacity-50" />
                                    <div className="h-12 w-full bg-gray-50 skeleton rounded-2xl border border-gray-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
);
