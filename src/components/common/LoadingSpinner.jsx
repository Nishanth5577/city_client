export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-surface-200 dark:border-surface-700" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin" />
      </div>
      {fullScreen && <p className="text-sm text-surface-500 animate-pulse">Loading...</p>}
    </div>
  );
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }
  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}
