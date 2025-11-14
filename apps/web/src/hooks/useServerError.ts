// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated server error management hook:
//   - Custom event listener for server errors
//   - Error state management with React hooks
//   - clearError function for dismissing errors
//   - TypeScript interface for ServerError
// Author review: Code reviewed, tested, and validated by team.

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
