import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message, { variant = 'info', duration = 4500 } = {}) => {
    nextId += 1;
    const id = nextId;
    setToasts((current) => [...current.slice(-3), { id, message, variant }]);
    if (duration) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const api = useMemo(() => ({
    show,
    success: (message, options) => show(message, { ...options, variant: 'success' }),
    error: (message, options) => show(message, { duration: 6000, ...options, variant: 'error' }),
    info: (message, options) => show(message, { ...options, variant: 'info' }),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map(({ id, message, variant }) => {
          const Icon = ICONS[variant];
          return (
            <div key={id} className={`toast toast-${variant}`}>
              <Icon className="toast-icon" aria-hidden />
              <p>{message}</p>
              <button type="button" className="icon-button" onClick={() => dismiss(id)} aria-label="Cerrar notificación">
                <X aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
