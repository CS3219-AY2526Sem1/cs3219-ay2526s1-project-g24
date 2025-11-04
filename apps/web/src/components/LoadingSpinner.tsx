interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
}

export default function LoadingSpinner({ message = "Loading...", fullScreen = true }: LoadingSpinnerProps) {
    if (fullScreen) {
        return (
            <div className="min-h-screen bg-[#333232] flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>

                {message && (
                    <p className="mt-6 text-white/70 font-montserrat text-sm animate-pulse">
                        {message}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            {message && (
                <p className="mt-4 text-white/70 font-montserrat text-xs animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
}
