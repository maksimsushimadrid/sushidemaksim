export const CategoryHeaderSkeleton = () => (
    <div className="mb-8 scroll-mt-32">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl skeleton opacity-20 border border-gray-100 flex-shrink-0 bg-white shadow-sm" />
            <div className="h-8 md:h-10 w-48 md:w-64 skeleton rounded-xl opacity-40 bg-gray-900" />
            <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-100 to-transparent opacity-50" />
        </div>
        <div className="space-y-2.5 mb-8">
            <div className="h-3.5 w-[90%] max-w-2xl skeleton rounded-lg opacity-10 bg-gray-500" />
        </div>
    </div>
);

// Grid of cards to be used during initial load and category changes
export const MenuItemsSkeleton = ({ showHeader = false }: { showHeader?: boolean }) => (
    <div className="flex flex-col">
        {showHeader && <CategoryHeaderSkeleton />}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 pb-32">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div
                    key={i}
                    className="bg-white rounded-[24px] md:rounded-[32px] overflow-hidden border border-gray-100 flex flex-col h-full relative"
                >
                    {/* Action Buttons Placeholders */}
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl md:rounded-2xl skeleton opacity-10 bg-gray-900" />
                    </div>
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl md:rounded-2xl skeleton opacity-10 bg-gray-900" />
                    </div>

                    {/* Image Container Skeleton */}
                    <div className="aspect-[4/3] md:h-56 skeleton w-full bg-gray-50" />

                    {/* Info Container Skeleton */}
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                        <div className="mb-1 md:mb-2 text-left">
                            <div className="h-5 md:h-7 w-3/4 skeleton rounded-lg md:rounded-xl bg-gray-900 opacity-20 mb-1" />
                            <div className="h-2.5 w-16 skeleton rounded-full bg-gray-400 opacity-10" />
                        </div>

                        <div className="space-y-2 mb-4 mt-2">
                            <div className="h-3 w-full skeleton rounded-lg opacity-10 bg-gray-500" />
                            <div className="h-3 w-5/6 skeleton rounded-lg opacity-10 bg-gray-500" />
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-1">
                            <div className="flex flex-col gap-1">
                                <div className="h-5 md:h-7 w-12 md:w-16 skeleton rounded-lg opacity-20 bg-gray-900" />
                                <div className="h-5 w-10 skeleton rounded-lg opacity-5 bg-gray-500 md:hidden" />
                            </div>
                            <div className="h-8 w-8 md:h-10 md:w-10 xl:h-11 xl:w-[140px] skeleton rounded-lg md:rounded-xl xl:rounded-2xl bg-gray-900 opacity-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Full page skeleton for Suspense fallback
export const MenuSkeleton = () => (
    <div className="min-h-screen bg-transparent px-0 md:px-4 pb-0 pt-0 flex flex-col">
        <div className="max-w-[1440px] mx-auto flex-1 md:flex px-3 md:px-6 w-full">
            {/* Desktop Sidebar Skeleton */}
            <aside className="hidden md:block w-[200px] flex-shrink-0 bg-orange-600 relative">
                <div
                    className="sticky flex flex-col items-stretch pb-10"
                    style={{
                        top: 'var(--header-height, 80px)',
                        height: 'calc(100dvh - var(--header-height, 80px))',
                    }}
                >
                    <div className="flex flex-col py-4 px-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div
                                key={i}
                                className="h-[52px] w-full bg-white/10 skeleton rounded-xl mb-2 flex items-center px-4 gap-3"
                            >
                                <div className="w-5 h-5 rounded-lg bg-white/20 shrink-0" />
                                <div className="h-3 w-24 bg-white/20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            <div className="flex-1 min-w-0 md:pl-8 pt-20 md:pt-4">
                {/* Header Section with Search Skeleton */}
                <div className="mb-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-0 md:mb-0 gap-8">
                        <div className="flex flex-col gap-2">
                            <div className="h-10 md:h-12 w-56 md:w-80 skeleton rounded-2xl opacity-10 bg-gray-900" />
                            <div className="h-4 w-40 md:w-48 skeleton rounded-lg opacity-5 bg-gray-500" />
                        </div>
                        <div className="h-12 md:h-14 w-full md:w-[448px] skeleton rounded-[20px] md:rounded-[24px] opacity-10 bg-gray-900" />
                    </div>
                </div>

                {/* Mobile Categories Scroll Skeleton (Hidden on desktop) */}
                <div className="mb-8 md:hidden fixed left-0 right-0 top-[64px] z-sticky bg-[#FBF7F0] border-b border-gray-200 py-3">
                    <div className="flex gap-2 px-4 overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className="h-10 w-28 bg-white skeleton rounded-2xl flex-shrink-0 border border-gray-100 opacity-60"
                            />
                        ))}
                    </div>
                </div>

                {/* Space for fixed mobile bar */}
                <div className="h-12 md:hidden" />

                {/* Grid Skeleton */}
                <MenuItemsSkeleton showHeader={true} />
            </div>
        </div>
    </div>
);
