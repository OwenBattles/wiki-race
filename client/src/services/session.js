// Where a player's claim on their seat lives between page loads.
//
// sessionStorage rather than localStorage is deliberate: it is scoped per tab, so opening a
// second tab gives you a genuinely separate player instead of hijacking the first one's
// seat, and closing the tab ends the claim.
const SESSION_KEY = 'wiki-race-session';

export const saveSession = (session) => {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
        // Private browsing modes can refuse writes. Reconnect stops working; play does not.
    }
};

export const loadSession = () => {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.roomCode && parsed?.token ? parsed : null;
    } catch {
        return null;
    }
};

export const clearSession = () => {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        // Nothing to do — a stale entry is harmless, the server rejects unknown tokens.
    }
};
