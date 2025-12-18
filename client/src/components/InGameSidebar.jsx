import { useState } from 'react';

export function InGameSidebar({ username, players, powerUps, handleUsePowerUp}) {
    const [isOpen, setIsOpen] = useState(false);

    console.log(players);

    console.log("power ups", powerUps);
    return (
        <div>
            <h2>Players</h2>
            <ul>
                {players.map((player) => (
                    player.username !== username && <li key={player.id}>{player.username}
                        <button onClick={() => setIsOpen(!isOpen)}>Use PowerUp</button>
                        {isOpen && 
                            <div> 
                                {powerUps.swap > 0 &&<button onClick={() => handleUsePowerUp("swap", player.id)}>Swap: {powerUps.swap}</button>}
                                {powerUps.scramble > 0 && <button onClick={() => handleUsePowerUp("scramble", player.id)}>Scramble: {powerUps.scramble}</button>}
                                {powerUps.freeze > 0 && <button onClick={() => handleUsePowerUp("freeze", player.id)}>Freeze: {powerUps.freeze}</button>}
                            </div>
                        }
                    </li>
                ))}
            </ul>
        </div>
    )
}