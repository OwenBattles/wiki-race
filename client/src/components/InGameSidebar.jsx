import { useState } from 'react';

export function InGameSidebar({ username, players, powerUps, }) {
    const [isOpen, setIsOpen] = useState(false);

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
                                {powerUps.swap > 0 && <button>Swap</button>}
                                {powerUps.scramble > 0 && <button>Scramble</button>}
                                {powerUps.freeze > 0 && <button>Freeze</button>}
                            </div>
                        }
                    </li>
                ))}
            </ul>
        </div>
    )
}