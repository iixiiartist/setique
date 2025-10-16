/**
 * Reusable stat card component for displaying key metrics
 * Used across dashboards for consistent styling
 * 
 * @param {Object} props
 * @param {string} props.label - The label/title of the stat
 * @param {string|number} props.value - The main value to display
 * @param {React.Component} [props.icon] - Optional icon component (lucide-react)
 * @param {string} [props.iconColor='text-pink-600'] - Tailwind color class for icon
 * @param {string} [props.trend] - Optional trend text to display below value
 * @param {Function} [props.onClick] - Optional click handler (makes card clickable)
 * @param {string} [props.className] - Additional CSS classes
 */
export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = 'text-pink-600',
  trend,
  onClick,
  className = ''
}) {
  return (
    <div 
      className={`
        bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6
        ${onClick ? 'cursor-pointer hover:shadow-[8px_8px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm font-bold uppercase tracking-wide">{label}</span>
        {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
      </div>
      <div className="text-3xl font-extrabold text-black">
        {value}
      </div>
      {trend && (
        <div className="text-sm text-gray-500 mt-2 font-semibold">{trend}</div>
      )}
    </div>
  );
}
