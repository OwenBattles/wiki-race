import { useEffect, useRef } from 'react';
import '../styles/ConfirmDialog.css';

// One dialog for anything that needs confirming. Native confirm() would be the quick route,
// but it is an OS panel dropped over the page — the same reason the alert() calls went.
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel = 'Stay', onConfirm, onCancel }) {
    const confirmRef = useRef(null);
    const previouslyFocused = useRef(null);

    useEffect(() => {
        if (!open) return;

        // Remember where focus was so it can go back when the dialog closes.
        previouslyFocused.current = document.activeElement;
        confirmRef.current?.focus();

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            previouslyFocused.current?.focus?.();
        };
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="confirm-backdrop" onClick={onCancel}>
            <div
                className="confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                // The backdrop closes on click; without this a click inside would bubble to it.
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="confirm-title" id="confirm-title">{title}</h2>
                {body && <p className="confirm-body">{body}</p>}

                <div className="confirm-actions">
                    <button type="button" className="confirm-button" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="confirm-button is-primary"
                        onClick={onConfirm}
                        ref={confirmRef}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
