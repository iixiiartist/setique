/**
 * Reusable loading spinner component
 * Provides consistent loading states across the application
 * 
 * @param {Object} props
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Spinner size
 * @param {string} [props.color='text-pink-600'] - Tailwind color class
 * @param {string} [props.text] - Optional loading text
 * @param {boolean} [props.fullScreen=false] - Whether to show full screen overlay
 * @param {string} [props.className] - Additional CSS classes
 */
export function LoadingSpinner({ 
  size = 'md',
  color = 'text-pink-600',
  text,
  fullScreen = false,
  className = ''
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const spinner = (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${color}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl border-4 border-black p-8 flex flex-col items-center gap-4">
          {spinner}
          {text && <p className="font-bold text-lg">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {spinner}
      {text && <p className="font-semibold text-gray-600">{text}</p>}
    </div>
  );
}
