import { useState, useEffect } from 'react';
import '../styles/RoomCode.css';

// The room code is the only way anyone else can join, and reading it aloud was the only
// way to share it. Clicking copies it.
export function RoomCode({ roomCode }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const id = window.setTimeout(() => setCopied(false), 1800);
        return () => clearTimeout(id);
    }, [copied]);

    const copy = async () => {
        try {
            // navigator.clipboard needs a secure context; localhost counts, but a plain-http
            // deployment would not, so fall back rather than throwing.
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(roomCode);
            } else {
                const field = document.createElement('textarea');
                field.value = roomCode;
                field.setAttribute('readonly', '');
                field.style.position = 'absolute';
                field.style.left = '-9999px';
                document.body.appendChild(field);
                field.select();
                document.execCommand('copy');
                document.body.removeChild(field);
            }
            setCopied(true);
        } catch (err) {
            console.error('Could not copy room code:', err);
        }
    };

    return (
        <button
            type="button"
            className="room-code"
            onClick={copy}
            title="Copy room code"
            aria-label={`Room ${roomCode}. Click to copy.`}
        >
            <span className="room-code-label">Room</span>
            <span className="room-code-value">{roomCode}</span>
            <span className={`room-code-hint${copied ? ' is-copied' : ''}`} aria-live="polite">
                {copied ? 'copied' : 'copy'}
            </span>
        </button>
    );
}
