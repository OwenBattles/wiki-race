const POWER_UP_LABELS = {
    swap: 'Swap',
    scramble: 'Scramble',
    freeze: 'Freeze',
};

export function PowerUpNotificationForVictim({ attackerUsername, powerUpType }) {
    const label = POWER_UP_LABELS[powerUpType] ?? powerUpType;
    return (
        <div className="power-up-notification-victim" role="status" aria-live="polite">
            <p className="power-up-notification-victim__text">
                <span className="power-up-notification-victim__name">{attackerUsername}</span>
                {' used '}
                <span className="power-up-notification-victim__power">{label}</span>
                {' on you.'}
            </p>
        </div>
    );
}
