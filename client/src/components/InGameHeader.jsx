import { useState, useEffect, useRef } from 'react';
import { Timer } from './Timer';
import '../styles/InGameHeader.css';

export function InGameHeader({ targetPage, onSurrender, username, players, powerUps, handleUsePowerUp }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [openPowerUpIndex, setOpenPowerUpIndex] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setOpenPowerUpIndex(null);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const opponents = players.filter(player => player.username !== username);
    const hasPowerUps = powerUps && (powerUps.swap > 0 || powerUps.scramble > 0 || powerUps.freeze > 0);

    return (
        <div className="ingame-header">
            <div className="ingame-header-left">
                <h1 className="ingame-header-destination">
                    <span className="ingame-header-destination-label">Destination:</span>
                    {targetPage}
                </h1>
                <div className="ingame-header-timer">
                    <Timer />
                </div>
            </div>
            <div className="ingame-header-right">
                {players.length > 1 && hasPowerUps && (
                    <div className="ingame-header-powerups-container" ref={dropdownRef}>
                        <button 
                            className="ingame-header-powerups-button" 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            Use Power-Ups
                        </button>
                        {isDropdownOpen && (
                            <div className="ingame-header-powerups-dropdown">
                                <h3 className="ingame-header-powerups-title">Opponents</h3>
                                <ul className="ingame-header-powerups-list">
                                    {opponents.map((player) => (
                                        <li key={player.id} className="ingame-header-powerups-player">
                                            <p className="ingame-header-powerups-player-name">{player.username}</p>
                                            <button 
                                                className="ingame-header-powerups-toggle"
                                                onClick={() => setOpenPowerUpIndex(openPowerUpIndex === player.id ? null : player.id)}
                                            >
                                                Select Power-Up
                                            </button>
                                            {openPowerUpIndex === player.id && (
                                                <div className="ingame-header-powerups-menu">
                                                    {powerUps.swap > 0 && (
                                                        <button 
                                                            className="ingame-header-powerups-item"
                                                            onClick={() => {
                                                                handleUsePowerUp("swap", player.id);
                                                                setOpenPowerUpIndex(null);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            Swap ({powerUps.swap})
                                                        </button>
                                                    )}
                                                    {powerUps.scramble > 0 && (
                                                        <button 
                                                            className="ingame-header-powerups-item"
                                                            onClick={() => {
                                                                handleUsePowerUp("scramble", player.id);
                                                                setOpenPowerUpIndex(null);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            Scramble ({powerUps.scramble})
                                                        </button>
                                                    )}
                                                    {powerUps.freeze > 0 && (
                                                        <button 
                                                            className="ingame-header-powerups-item"
                                                            onClick={() => {
                                                                handleUsePowerUp("freeze", player.id);
                                                                setOpenPowerUpIndex(null);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            Freeze ({powerUps.freeze})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                <button className="ingame-header-surrender" onClick={onSurrender}>
                    Surrender
                </button>
            </div>
        </div>
    )
}