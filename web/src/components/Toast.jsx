import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const icons = { success: CheckCircle, error: XCircle, info: Info };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => {
                    const Icon = icons[t.type] || Info;
                    return (
                        <div key={t.id} className={`toast ${t.type}`}>
                            <Icon size={18} />
                            <span>{t.message}</span>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
