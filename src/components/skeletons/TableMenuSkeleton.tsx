const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-neutral-800/20 rounded-2xl ${className}`} />
);

export const TableProductCardSkeleton = () => (
    <div className="bg-neutral-900/40 rounded-2xl overflow-hidden border border-white/5 flex flex-col h-full">
        {/* Image Placeholder */}
        <div className="aspect-square w-full bg-neutral-800/10 animate-pulse" />

        {/* Info Placeholder */}
        <div className="p-4 flex flex-col flex-1">
            <div className="mb-2">
                <Skeleton className="h-5 w-3/4 mb-1.5" />
                <Skeleton className="h-3 w-1/2 opacity-50" />
            </div>

            <div className="mt-auto flex items-center justify-between gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
        </div>
    </div>
);

export const TableMenuSkeleton = () => {
    return (
        <div className="min-h-screen bg-black pt-40 px-4 pb-32">
            <div className="max-w-2xl mx-auto">
                {/* Promo Banner Skeleton */}
                <div className="mb-8 w-full h-[120px] bg-neutral-900/40 rounded-2xl border border-white/5 p-5 flex items-center justify-between">
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-24 bg-orange-500/20" />
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-3 w-32 opacity-40" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10" />
                </div>

                {/* Section Title Skeleton */}
                <div className="mb-12">
                    <Skeleton className="h-3 w-20 mb-2 bg-orange-500/20" />
                    <Skeleton className="h-12 w-48" />
                    <div className="h-[2px] w-24 bg-gradient-to-r from-orange-500 to-transparent mt-6" />
                </div>

                {/* Products Grid Skeleton */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <TableProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>

            {/* Bottom Bar Skeleton */}
            <div className="fixed bottom-6 left-4 right-4 h-16 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl" />
        </div>
    );
};

export default TableMenuSkeleton;
