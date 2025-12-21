import { useState } from 'react';
import '../styles/InGameSidebar.css';

export function InGameSidebar({ username, players, powerUps, handleUsePowerUp}) {
    const [openPowerUpIndex, setOpenPowerUpIndex] = useState(null);

    return (
        <div className="ingame-sidebar">
            <h2 className="ingame-sidebar-title">Opponents</h2>
            <ul className="ingame-sidebar-players">
                {players.map((player) => (
                    player.username !== username && (
                        <li key={player.id} className="ingame-sidebar-player">
                            <p className="ingame-sidebar-player-name">{player.username}</p>
                            <button 
                                className="ingame-sidebar-powerup-button"
                                onClick={() => setOpenPowerUpIndex(openPowerUpIndex === player.id ? null : player.id)}
                            >
                                Use Power-Up
                            </button>
                            {openPowerUpIndex === player.id && (
                                <div className="ingame-sidebar-powerup-menu">
                                    {powerUps.swap > 0 && (
                                        <button 
                                            className="ingame-sidebar-powerup-item"
                                            onClick={() => {
                                                handleUsePowerUp("swap", player.id);
                                                setOpenPowerUpIndex(null);
                                            }}
                                        >
                                            Swap ({powerUps.swap})
                                        </button>
                                    )}
                                    {powerUps.scramble > 0 && (
                                        <button 
                                            className="ingame-sidebar-powerup-item"
                                            onClick={() => {
                                                handleUsePowerUp("scramble", player.id);
                                                setOpenPowerUpIndex(null);
                                            }}
                                        >
                                            Scramble ({powerUps.scramble})
                                        </button>
                                    )}
                                    {powerUps.freeze > 0 && (
                                        <button 
                                            className="ingame-sidebar-powerup-item"
                                            onClick={() => {
                                                handleUsePowerUp("freeze", player.id);
                                                setOpenPowerUpIndex(null);
                                            }}
                                        >
                                            Freeze ({powerUps.freeze})
                                        </button>
                                    )}
                                </div>
                            )}
                        </li>
                    )
                ))}
            </ul>
        </div>
    )
}