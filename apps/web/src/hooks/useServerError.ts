import { useEffect, useState } from 'react';

interface ServerError {
    status: number;
    message: string;
}

export function useServerError() {
    const [error, setError] = useState<ServerError | null>(null);

    useEffect(() => {
        const handleServerError = (event: Event) => {
            const customEvent = event as CustomEvent<ServerError>;
            setError(customEvent.detail);
        };

        window.addEventListener('server-error', handleServerError);

        return () => {
            window.removeEventListener('server-error', handleServerError);
        };
    }, []);

    const clearError = () => setError(null);

    return { error, clearError };
}
