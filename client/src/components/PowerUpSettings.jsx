import { useState } from 'react';
import '../styles/PowerUpSettings.css';

export function PowerUpSettings({ isHost, powerUps, onPowerUpChange }) {
    const [isOpen, setIsOpen] = useState(false);

    console.log("power ups", powerUps);

    const handleIncrement = (powerUpType) => {
        console.log("incrementing", powerUpType);
        onPowerUpChange(powerUpType, powerUps[powerUpType] + 1);
    };

    const handleDecrement = (powerUpType) => {
        if (powerUps[powerUpType] <= 0) return;
        console.log("decrementing", powerUpType);
        onPowerUpChange(powerUpType, powerUps[powerUpType] - 1);
    };

    const totalPowerUps = Object.values(powerUps).reduce((sum, val) => sum + val, 0);

    if (!isHost) {
        return (
            <div className="powerup-settings-container">
                <button 
                    className="powerup-settings-view-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? 'Hide' : 'Show'} Power-Up Settings
                </button>
                {isOpen && (
                    <div className="powerup-settings-view-only">
                        <div className="powerup-settings-view-only-item">
                            Swap: {powerUps.swap}
                        </div>
                        <div className="powerup-settings-view-only-item">
                            Scramble: {powerUps.scramble}
                        </div>
                        <div className="powerup-settings-view-only-item">
                            Freeze: {powerUps.freeze}
                        </div>             
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="powerup-settings-container">
            <button
                className="powerup-settings-toggle"
                onClick={() => setIsOpen(!isOpen)}
            >
                Power-Ups {isOpen ? '▲' : '▼'}
            </button>

            {isOpen && (
                <div className="powerup-settings-panel">
                    <div className="powerup-settings-list">
                        {/* Swap PowerUp */}
                        <div className="powerup-settings-item">
                            <span className="powerup-settings-label">Swap</span>
                            <div className="powerup-settings-controls">
                                <button
                                    className="powerup-settings-button"
                                    onClick={() => handleDecrement('swap')}
                                    disabled={powerUps.swap === 0}
                                >
                                    -
                                </button>
                                <span className="powerup-settings-value">
                                    {powerUps.swap}
                                </span>
                                <button
                                    className="powerup-settings-button increment"
                                    onClick={() => handleIncrement('swap')}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Scramble PowerUp */}
                        <div className="powerup-settings-item">
                            <span className="powerup-settings-label">Scramble</span>
                            <div className="powerup-settings-controls">
                                <button
                                    className="powerup-settings-button"
                                    onClick={() => handleDecrement('scramble')}
                                    disabled={powerUps.scramble === 0}
                                >
                                    -
                                </button>
                                <span className="powerup-settings-value">
                                    {powerUps.scramble}
                                </span>
                                <button
                                    className="powerup-settings-button increment"
                                    onClick={() => handleIncrement('scramble')}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Freeze PowerUp */}
                        <div className="powerup-settings-item">
                            <span className="powerup-settings-label">Freeze</span>
                            <div className="powerup-settings-controls">
                                <button
                                    className="powerup-settings-button"
                                    onClick={() => handleDecrement('freeze')}
                                    disabled={powerUps.freeze === 0}
                                >
                                    -
                                </button>
                                <span className="powerup-settings-value">
                                    {powerUps.freeze}
                                </span>
                                <button
                                    className="powerup-settings-button increment"
                                    onClick={() => handleIncrement('freeze')}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Example usage:
function Example() {
    const [powerUps, setPowerUps] = useState({
        swap: 0,
        scramble: 0,
        freeze: 0
    });

    return (
        <div className="p-8">
            <PowerUpSettings
                isHost={true}
                powerUps={powerUps}
                onPowerUpChange={setPowerUps}
            />
        </div>
    );
}