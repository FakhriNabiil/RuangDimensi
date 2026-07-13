import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (message, variant = 'info', duration = 5000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, variant }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const toast = {
    info: (msg, duration) => push(msg, 'info', duration),
    success: (msg, duration) => push(msg, 'success', duration),
    error: (msg, duration) => push(msg, 'error', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={[
              'flex items-start gap-2 rounded-xl border px-4 py-3 shadow-lg font-body text-body-sm glass-floating animate-[fadeIn_0.15s_ease-out]',
              t.variant === 'error' && 'border-error/50! text-error',
              t.variant === 'success' && 'border-primary/50! text-primary',
              t.variant === 'info' && 'text-on-surface',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="material-symbols-outlined text-[18px] mt-0.5">
              {t.variant === 'error' ? 'error' : t.variant === 'success' ? 'check_circle' : 'info'}
            </span>
            <p className="flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-on-surface-variant hover:text-on-surface"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
