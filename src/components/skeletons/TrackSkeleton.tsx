export const TrackSkeleton = () => (
    <div className="min-h-screen bg-[#FBF7F0] pb-20">
        <div className="max-w-4xl mx-auto px-4 pt-10">
            {/* Back button skeleton */}
            <div className="h-4 w-20 skeleton rounded-lg mb-8" />

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header Skeleton */}
                <div className="bg-orange-600/10 p-5 sm:p-6 md:p-8 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-4">
                            <div className="h-4 w-32 skeleton rounded opacity-40" />
                            <div className="h-10 w-64 skeleton rounded-xl" />
                        </div>
                        <div className="w-48 h-12 skeleton rounded-2xl opacity-40" />
                    </div>
                </div>

                <div className="p-5 sm:p-6 md:p-8 space-y-12">
                    {/* Stepper Skeleton */}
                    <div className="h-20 w-full skeleton rounded-3xl" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Delivery Info Skeleton */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="h-4 w-32 skeleton rounded opacity-40" />
                                <div className="h-20 w-full skeleton rounded-2xl" />
                            </div>
                            <div className="space-y-4">
                                <div className="h-4 w-32 skeleton rounded opacity-40" />
                                <div className="h-20 w-full skeleton rounded-2xl" />
                            </div>
                        </div>

                        {/* Summary Skeleton */}
                        <div className="bg-gray-50 rounded-2xl p-8 border border-white space-y-6">
                            <div className="h-4 w-48 skeleton rounded opacity-40" />
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 w-1/2 skeleton rounded" />
                                        <div className="h-4 w-16 skeleton rounded" />
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 border-t border-gray-200 flex justify-between items-end">
                                <div className="h-4 w-24 skeleton rounded opacity-40" />
                                <div className="h-8 w-24 skeleton rounded-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Footer buttons skeleton */}
                    <div className="mt-16 pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl skeleton shrink-0" />
                            <div className="space-y-2">
                                <div className="h-3 w-32 skeleton rounded opacity-40" />
                                <div className="h-4 w-40 skeleton rounded" />
                            </div>
                        </div>
                        <div className="h-14 w-48 skeleton rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);
