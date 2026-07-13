export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm glass-floating rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined ${danger ? 'text-error' : 'text-primary'}`}>
            {danger ? 'warning' : 'help'}
          </span>
          <h2 className="font-label text-headline-md text-on-surface">{title}</h2>
        </div>
        <p className="font-body text-body-md text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-3 mt-2">
          <button className="btn-ghost" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            className={
              danger
                ? 'bg-error text-on-error font-label font-semibold rounded-full px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50'
                : 'btn-primary'
            }
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
