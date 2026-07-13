export default function LoadingSpinner({ label = 'Loading...', className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant ${className}`}
    >
      <span className="material-symbols-outlined text-[32px] animate-spin text-primary">
        progress_activity
      </span>
      <span className="font-label text-label-sm uppercase tracking-wider">{label}</span>
    </div>
  );
}
