/**
 * Reusable section header component for consistent section titles
 * Used throughout dashboards for organizing content
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Header text content
 * @param {React.ReactNode} [props.action] - Optional action button or element to show on the right
 * @param {string} [props.className] - Additional CSS classes
 * @param {'h2'|'h3'|'h4'} [props.level='h3'] - Heading level
 */
export function SectionHeader({ 
  children,
  action,
  className = '',
  level = 'h3'
}) {
  const HeadingTag = level;
  
  const sizeClasses = {
    h2: 'text-3xl',
    h3: 'text-2xl',
    h4: 'text-xl'
  };

  if (action) {
    return (
      <div className={`flex items-center justify-between mb-6 ${className}`}>
        <HeadingTag className={`${sizeClasses[level]} font-extrabold`}>
          {children}
        </HeadingTag>
        <div>
          {action}
        </div>
      </div>
    );
  }

  return (
    <HeadingTag className={`${sizeClasses[level]} font-extrabold mb-6 ${className}`}>
      {children}
    </HeadingTag>
  );
}
