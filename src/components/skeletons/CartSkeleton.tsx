export const CartSkeleton = () => (
    <div className="min-h-screen bg-transparent flex flex-col">
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-4 sm:py-8">
            {/* Header Title Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="h-10 w-48 skeleton rounded-2xl" />
                <div className="h-4 w-24 skeleton rounded" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items List Skeleton */}
                <div className="lg:col-span-2">
                    <div className="bg-white md:rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] p-0 md:p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-4 md:mb-6 px-4 md:px-0 pt-4 md:pt-0">
                            <div className="h-6 w-38 skeleton rounded-lg" />
                        </div>

                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 bg-white border-b border-gray-50 last:border-none"
                                >
                                    <div className="w-16 h-16 sm:w-16 sm:h-16 rounded-xl skeleton shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/2 skeleton rounded" />
                                        <div className="h-3 w-1/3 skeleton rounded" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="h-4 w-12 skeleton rounded" />
                                        <div className="h-8 w-8 md:h-11 md:w-24 skeleton rounded-lg md:rounded-2xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Skeleton */}
                <div className="flex flex-col gap-8">
                    {/* Suggestions placeholder */}
                    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-xl shadow-gray-900/5 p-4 md:p-6 border border-white/50">
                        <div className="h-6 w-32 skeleton rounded-lg mb-4" />
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded-xl skeleton shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-3/4 skeleton rounded" />
                                        <div className="h-3 w-1/4 skeleton rounded" />
                                    </div>
                                    <div className="w-8 h-8 rounded-full skeleton shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals card */}
                    <div className="bg-white md:rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] p-5 md:p-6 space-y-6 rounded-t-2xl md:border-none border-t border-gray-100">
                        <div className="h-6 w-24 skeleton rounded-lg" />
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between">
                                <div className="h-4 w-32 skeleton rounded" />
                                <div className="h-4 w-16 skeleton rounded" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 w-20 skeleton rounded" />
                                <div className="h-4 w-16 skeleton rounded" />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-100 flex justify-between">
                            <div className="h-8 w-20 skeleton rounded-lg" />
                            <div className="h-8 w-24 skeleton rounded-lg" />
                        </div>
                        <div className="h-16 w-full skeleton rounded-2xl mt-6 shadow-sm hidden md:block" />{' '}
                        {/* Desktop Button */}
                    </div>

                    {/* Mobile Sticky Button Skeleton */}
                    <div className="md:hidden sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-2 pb-6 z-50">
                        <div className="h-14 w-full skeleton rounded-2xl" />
                    </div>
                </div>
            </div>
        </main>
    </div>
);
