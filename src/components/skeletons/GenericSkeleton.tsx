export const GenericSkeleton = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="bg-white p-12 md:p-20 rounded-2xl max-w-lg w-full shadow-2xl space-y-8 flex flex-col items-center border border-gray-100 animate-in fade-in duration-500">
            {/* Generic placeholder icon */}
            <div className="w-24 h-24 skeleton rounded-2xl mb-4 shadow-sm" />

            {/* Generic title & content */}
            <div className="space-y-4 w-full text-center">
                <div className="h-8 w-2/3 skeleton rounded-xl mx-auto" />
                <div className="h-4 w-full skeleton rounded-lg opacity-50" />
                <div className="h-4 w-3/4 skeleton rounded-lg opacity-50 mx-auto" />
            </div>

            {/* Generic button */}
            <div className="h-14 w-full skeleton rounded-3xl mt-8" />
        </div>
    </div>
);
