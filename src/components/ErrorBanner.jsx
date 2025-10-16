import { X, AlertCircle } from 'lucide-react';

/**
 * ErrorBanner component for displaying dismissible error messages
 * Shows at the top of the page with consistent SETIQUE styling
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onDismiss - Callback when dismiss button clicked
 * @param {'error'|'warning'|'info'} [props.variant='error'] - Banner style variant
 * @param {string} [props.className] - Additional CSS classes
 */
export function ErrorBanner({ 
  message,
  onDismiss,
  variant = 'error',
  className = ''
}) {
  if (!message) return null;

  const variantClasses = {
    error: 'bg-red-100 border-red-600 text-red-900',
    warning: 'bg-yellow-100 border-yellow-600 text-yellow-900',
    info: 'bg-blue-100 border-blue-600 text-blue-900'
  };

  return (
    <div 
      className={`
        ${variantClasses[variant]}
        border-4 rounded-lg p-4 mb-6 
        flex items-start gap-4
        shadow-[4px_4px_0_#000]
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
      <p className="font-semibold flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-black rounded"
        aria-label="Dismiss error"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
