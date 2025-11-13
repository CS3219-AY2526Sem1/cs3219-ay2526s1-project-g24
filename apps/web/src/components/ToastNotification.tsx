// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated toast notification component:
//   - Toast notifications with multiple types (error, warning, success, info)
//   - Auto-dismiss with configurable duration
//   - Manual dismiss functionality
//   - Animated slide-in transitions
//   - Stacked toast management
//   - Icon rendering for each toast type
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced visual design with glassmorphism
//   - Added accessibility for screen readers
//   - Optimized animation performance

import { useEffect } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
  duration?: number;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

/**
 * Toast notification component
 */
export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  useEffect(() => {
    // Auto-dismiss toasts after duration
    const timers = toasts.map((toast) => {
      const duration = toast.duration || 5000;
      return setTimeout(() => {
        onDismiss(toast.id);
      }, duration);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md'>
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            className={`
                        rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in
                        ${toast.type === 'error' ? 'bg-red-900/90 border border-red-700' : ''}
                        ${toast.type === 'warning' ? 'bg-yellow-900/90 border border-yellow-700' : ''}
                        ${toast.type === 'success' ? 'bg-[#F1FCAC]/95 border border-[#F1FCAC]' : ''}
                        ${toast.type === 'info' ? 'bg-blue-900/90 border border-blue-700' : ''}
                    `}
          >
            {/* Icon */}
            <div className={`flex-shrink-0 mt-0.5 ${isSuccess ? 'text-[#1e1e1e]' : ''}`}>
              {toast.type === 'error' && (
                <svg className='w-5 h-5 text-red-400' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className='w-5 h-5 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
              {toast.type === 'success' && (
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className='w-5 h-5 text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </div>

            {/* Message */}
            <div className='flex-1'>
              <p className={`text-sm font-medium ${isSuccess ? 'text-[#1e1e1e]' : 'text-white'}`}>{toast.message}</p>
            </div>

            {/* Close button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className={`flex-shrink-0 transition-colors ${isSuccess ? 'text-[#1e1e1e]/60 hover:text-[#1e1e1e]' : 'text-white/60 hover:text-white'
                }`}
              aria-label='Dismiss'
            >
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
