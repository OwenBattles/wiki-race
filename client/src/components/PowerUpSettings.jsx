import { useState, useRef, useEffect } from 'react';
import '../styles/PowerUpSettings.css';

export function PowerUpSettings({ isHost, powerUps, onPowerUpChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const onPointerDown = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [isOpen]);

    const handleIncrement = (powerUpType) => {
        onPowerUpChange(powerUpType, powerUps[powerUpType] + 1);
    };

    const handleDecrement = (powerUpType) => {
        if (powerUps[powerUpType] <= 0) return;
        onPowerUpChange(powerUpType, powerUps[powerUpType] - 1);
    };

    if (!isHost) {
        return (
            <div className="powerup-settings-container" ref={containerRef}>
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
                        {/* <div className="powerup-settings-view-only-item">
                            Freeze: {powerUps.freeze}
                        </div>              */}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="powerup-settings-container" ref={containerRef}>
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

                        {/* Freeze PowerUp (commented out for now) */}
                        {/* <div className="powerup-settings-item">
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
                        </div> */}
                    </div>
                </div>
            )}
        </div>
    );
}