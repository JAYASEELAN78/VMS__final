import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast Provider Component
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onRemove={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

// Individual Toast Item
const ToastItem = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onRemove, 300);
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.duration, onRemove]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
    };

    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />,
    };

    const styles = {
        success: {
            background: 'rgba(16, 185, 129, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            iconBg: 'rgba(255, 255, 255, 0.2)',
        },
        error: {
            background: 'rgba(239, 68, 68, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            iconBg: 'rgba(255, 255, 255, 0.2)',
        },
        warning: {
            background: 'rgba(245, 158, 11, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            iconBg: 'rgba(255, 255, 255, 0.2)',
        },
        info: {
            background: 'rgba(59, 130, 246, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            iconBg: 'rgba(255, 255, 255, 0.2)',
        },
    };

    const style = styles[toast.type];

    return (
        <div
            className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'}`}
            style={{
                background: style.background,
                borderColor: style.borderColor,
            }}
        >
            <div
                className="toast-icon"
                style={{ background: style.iconBg }}
            >
                {icons[toast.type]}
            </div>
            <span className="toast-message">{toast.message}</span>
            <button
                onClick={handleClose}
                className="toast-close"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastProvider;
