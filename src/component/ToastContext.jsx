import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);

    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast UI */}
      <div style={styles.container}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              ...styles.toast,
              ...styles[t.type]
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  toast: {
    padding: '12px 16px',
    borderRadius: 8,
    minWidth: 240,
    color: '#fff',
    fontWeight: 500,
    textAlign: 'center'
  },
  success: { background: '#2e7d32' },
  error: { background: '#c62828' },
  info: { background: '#1565c0' }
};
