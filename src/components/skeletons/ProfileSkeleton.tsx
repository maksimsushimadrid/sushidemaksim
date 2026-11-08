export const ProfileSkeleton = () => (
    <div className="min-h-screen bg-transparent flex flex-col overflow-x-hidden">
        {/* Header Section Skeleton - Matching actual padding */}
        <div
            className="bg-orange-600 pb-28 px-2 md:px-4 relative overflow-hidden"
            style={{ paddingTop: 'calc(var(--header-height, 64px) + 40px)' }}
        >
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/20 skeleton border-2 border-white/10 shadow-xl" />

                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                            <div className="h-8 w-48 bg-white/20 skeleton rounded-xl mx-auto md:mx-0" />
                            <div className="h-5 w-24 bg-white/10 skeleton rounded-full mx-auto md:mx-0" />
                        </div>
                        <div className="h-4 w-40 bg-white/20 skeleton rounded-lg mx-auto md:mx-0 opacity-60" />
                        <div className="h-3 w-56 bg-white/10 skeleton rounded-lg mx-auto md:mx-0 opacity-40 md:hidden" />
                    </div>

                    {/* Stats Skeleton - Matching actual grid/flex */}
                    <div className="grid grid-cols-2 md:flex gap-3 md:gap-4 w-full md:w-auto mt-4 md:mt-0">
                        <div className="h-14 w-full md:w-32 bg-white/20 skeleton rounded-xl border border-white/10" />
                        <div className="h-14 w-full md:w-14 bg-white/20 skeleton rounded-xl border border-white/10" />
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content Skeleton */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-2 md:px-4 -mt-16 pb-20 relative z-20">
            {/* Loyalty Program Skeletons - mb-6 */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <div
                        key={i}
                        className="bg-white rounded-2xl p-5 shadow-xl border border-white space-y-5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 skeleton rounded-2xl" />
                            <div className="flex-1 space-y-2.5">
                                <div className="h-4 w-2/3 skeleton rounded-lg" />
                                <div className="h-3 w-1/3 skeleton rounded-lg opacity-50" />
                            </div>
                            <div className="text-right space-y-1.5">
                                <div className="h-5 w-8 bg-gray-100 skeleton rounded ml-auto" />
                                <div className="h-2 w-10 bg-gray-50 skeleton rounded ml-auto opacity-40" />
                            </div>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 skeleton rounded-full" />
                        <div className="flex justify-between items-center opacity-30">
                            <div className="h-2 w-20 bg-gray-200 skeleton rounded" />
                            <div className="h-2 w-24 bg-gray-200 skeleton rounded" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Navigation Sidebar Skeleton - Matching actual p-1.5 and md:rounded-2xl */}
                <aside className="lg:w-80 shrink-0">
                    <div className="bg-white/95 md:bg-white backdrop-blur-xl border-y md:border border-gray-100 md:border-white shadow-sm md:shadow-2xl rounded-none md:rounded-2xl p-1.5 flex md:block overflow-x-auto no-scrollbar gap-2 px-4 md:px-2">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="shrink-0 md:w-full h-12 md:h-14 bg-gray-50/50 skeleton rounded-2xl border border-gray-50/20"
                                style={{ width: window.innerWidth < 768 ? '120px' : 'auto' }}
                            />
                        ))}
                    </div>
                </aside>

                {/* Content Section Skeleton */}
                <div className="flex-1 min-w-0">
                    <div className="bg-transparent md:bg-white/90 md:backdrop-blur-xl md:border md:border-white md:shadow-2xl rounded-2xl overflow-hidden">
                        <div className="p-0 md:p-8 space-y-8">
                            <div className="h-8 w-1/3 bg-gray-100 skeleton rounded-xl mb-8" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="space-y-3">
                                        <div className="h-3 w-20 bg-gray-100 skeleton rounded opacity-40" />
                                        <div className="h-12 w-full bg-gray-50/80 skeleton rounded-2xl border border-gray-50/50" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
);
