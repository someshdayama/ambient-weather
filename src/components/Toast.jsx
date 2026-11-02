import React, { useEffect } from 'react';
import { AlertTriangle, RotateCw, X } from 'lucide-react';

/** Non-blocking status toast. Auto-dismisses after 8s when there is nothing to retry. */
const Toast = ({ message, onRetry, onDismiss }) => {
    useEffect(() => {
        if (onRetry) return undefined;
        const id = setTimeout(onDismiss, 8000);
        return () => clearTimeout(id);
    }, [message, onRetry, onDismiss]);

    return (
        <div className="toast" role="status" aria-live="polite">
            <AlertTriangle size={16} className="toast-icon" aria-hidden="true" />
            <span className="toast-text">{message}</span>
            {onRetry && (
                <button type="button" className="toast-btn" onClick={onRetry}>
                    <RotateCw size={14} aria-hidden="true" /> Retry
                </button>
            )}
            <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss">
                <X size={14} aria-hidden="true" />
            </button>
        </div>
    );
};

export default Toast;
