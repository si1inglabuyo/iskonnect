export default function Avatar({ username, email, size = 'md', src }) {
  
  // Use username first, fallback to email
  const identifier = username || email || '';
  const initial = identifier.charAt(0).toUpperCase() || '?';

  // Generate gradient based on first char (default avatar color)
  const getColorClass = () => {
    const colors = [
      'from-indigo-400 to-purple-500',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-rose-400 to-pink-400',
      'from-orange-400 to-yellow-400',
    ];
    const index = identifier.charCodeAt(0) % colors.length;
    return `bg-gradient-to-br ${colors[index]}`;
  };

  const sizeClasses = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-24 h-24 text-2xl'
  };

  const resolvedSizeClass = sizeClasses[size] || sizeClasses.md;

  const hasImage = src && src !== '' && src !== 'null' && src !== 'undefined';

  return (
    <div className={`${resolvedSizeClass} rounded-full flex items-center justify-center text-white font-semibold overflow-hidden ${hasImage ? '' : getColorClass()}`}>
      {hasImage ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}