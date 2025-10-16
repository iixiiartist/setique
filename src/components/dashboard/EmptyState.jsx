/**
 * Reusable empty state component for displaying when no data is available
 * Provides consistent styling and optional action button
 * 
 * @param {Object} props
 * @param {React.Component} [props.icon] - Optional icon component (lucide-react)
 * @param {string} props.title - Main title text
 * @param {string} [props.description] - Optional description text
 * @param {string} [props.actionLabel] - Optional action button label
 * @param {Function} [props.onAction] - Optional action button click handler
 * @param {string} [props.className] - Additional CSS classes
 */
export function EmptyState({ 
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <Icon className="h-16 w-16 mx-auto text-gray-400 mb-4" strokeWidth={1.5} />
      )}
      <h3 className="text-xl font-bold text-gray-700 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-md mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
