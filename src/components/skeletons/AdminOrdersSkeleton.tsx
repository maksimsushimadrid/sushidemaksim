export const AdminOrderCardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-b-2 border-b-gray-100 animate-pulse">
        {/* Header Skeleton */}
        <div className="px-4 py-3 md:px-5 md:py-2.5 border-b border-gray-100 bg-gray-50/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 rounded-xl w-9 h-9" />
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-24 bg-gray-200/80 rounded-md" />
                        <div className="h-4 w-20 bg-gray-100 rounded-lg" />
                    </div>
                    <div className="h-3 w-28 bg-gray-100 rounded-md" />
                </div>
            </div>
        </div>

        {/* Body Skeleton - Compact 3-column desktop layout */}
        <div className="p-4 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Client Column */}
            <div className="lg:col-span-4 space-y-3">
                <div className="h-3 w-28 bg-gray-100 rounded" />
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-3/4 bg-gray-200/80 rounded" />
                        <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-6 w-20 bg-gray-100 rounded-lg" />
                    <div className="h-6 w-16 bg-gray-100 rounded-lg" />
                </div>
            </div>

            {/* Items + Total Column */}
            <div className="lg:col-span-5 space-y-2.5">
                <div className="h-3 w-24 bg-gray-100 rounded" />
                <div className="bg-gray-50/60 rounded-xl p-3 space-y-2 border border-gray-100">
                    <div className="h-7 w-full bg-white rounded-lg" />
                    <div className="h-7 w-full bg-white rounded-lg" />
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div className="h-3 w-14 bg-gray-200/70 rounded" />
                        <div className="h-5 w-20 bg-gray-200/80 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Actions Column */}
            <div className="lg:col-span-3 space-y-2">
                <div className="h-3 w-24 bg-gray-100 rounded" />
                <div className="h-9 w-full bg-gray-200/70 rounded-xl" />
                <div className="h-8 w-full bg-gray-100 rounded-xl" />
                <div className="h-8 w-full bg-gray-50 rounded-xl" />
            </div>
        </div>
    </div>
);

export const AdminOrdersSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="grid gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <AdminOrderCardSkeleton key={i} />
        ))}
    </div>
);
