import '../styles/PowerUpSettings.css';

// Only the power-ups the server implements — freeze exists in the data model but has no
// behaviour, so it would be a control that does nothing.
const POWER_UPS = [
    { key: 'swap', label: 'Swap', description: 'Trade places with an opponent' },
    { key: 'scramble', label: 'Scramble', description: 'Fling an opponent to a random article' },
];

const MAX_PER_POWER_UP = 9;

// Laid out inline rather than behind a dropdown: hiding the round's rules behind a toggle
// meant most players never learned power-ups existed, and the floating panel covered the
// lobby underneath it. Host and guest now see the same rows; only the host gets controls.
export function PowerUpSettings({ isHost, powerUps, onPowerUpChange }) {
    const setCount = (key, next) => {
        if (next < 0 || next > MAX_PER_POWER_UP) return;
        onPowerUpChange(key, next);
    };

    return (
        <div className="powerup-settings">
            <h2 className="powerup-settings-heading">power-ups</h2>

            <ul className="powerup-settings-list">
                {POWER_UPS.map(({ key, label, description }) => {
                    const count = powerUps?.[key] ?? 0;

                    return (
                        <li key={key} className={`powerup-settings-row${count > 0 ? ' is-active' : ''}`}>
                            <span className="powerup-settings-text">
                                <span className="powerup-settings-label">{label}</span>
                                <span className="powerup-settings-description">{description}</span>
                            </span>

                            {isHost ? (
                                <span className="powerup-settings-stepper">
                                    <button
                                        type="button"
                                        className="powerup-settings-step"
                                        onClick={() => setCount(key, count - 1)}
                                        disabled={count === 0}
                                        aria-label={`One fewer ${label}`}
                                    >
                                        −
                                    </button>
                                    <span className="powerup-settings-count" aria-live="polite">
                                        {count}
                                    </span>
                                    <button
                                        type="button"
                                        className="powerup-settings-step"
                                        onClick={() => setCount(key, count + 1)}
                                        disabled={count >= MAX_PER_POWER_UP}
                                        aria-label={`One more ${label}`}
                                    >
                                        +
                                    </button>
                                </span>
                            ) : (
                                <span className="powerup-settings-count is-readonly">{count}</span>
                            )}
                        </li>
                    );
                })}
            </ul>

            <p className="powerup-settings-note">
                {isHost
                    ? 'Each racer starts the round with this many of each.'
                    : 'Set by the host. You start the round with this many of each.'}
            </p>
        </div>
    );
}
