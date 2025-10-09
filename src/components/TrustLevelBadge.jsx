export default function TrustLevelBadge({ level, showLabel = true, size = 'md' }) {
  const levels = {
    0: {
      name: 'New User',
      color: 'bg-gray-100 text-gray-800 border-gray-800',
      emoji: '🆕',
      description: 'First uploads need review'
    },
    1: {
      name: 'Verified',
      color: 'bg-blue-100 text-blue-800 border-blue-800',
      emoji: '✓',
      description: 'Auto-approve uploads'
    },
    2: {
      name: 'Trusted',
      color: 'bg-green-100 text-green-800 border-green-800',
      emoji: '⭐',
      description: 'Skip all checks'
    },
    3: {
      name: 'Moderator',
      color: 'bg-purple-100 text-purple-800 border-purple-800',
      emoji: '🚩',
      description: 'Full moderation access'
    }
  };

  const currentLevel = levels[level] || levels[0];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-bold border-2 ${currentLevel.color} ${sizeClasses[size]}`}
      title={currentLevel.description}
    >
      <span>{currentLevel.emoji}</span>
      {showLabel && <span>{currentLevel.name}</span>}
    </span>
  );
}
