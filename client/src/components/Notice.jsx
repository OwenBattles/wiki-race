import '../styles/Notice.css';

// A native alert() is the one thing guaranteed to look nothing like the rest of the app —
// an OS dialog dropped over the page. This is the in-app replacement.
export function Notice({ children, tone = 'error', floating = false }) {
    if (!children) return null;

    return (
        <div
            className={`notice notice--${tone}${floating ? ' notice--floating' : ''}`}
            role="status"
            aria-live="polite"
        >
            {children}
        </div>
    );
}
