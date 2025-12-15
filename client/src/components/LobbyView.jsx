import { TitleEndpoints } from "./TitleEndpoints";

export function LobbyView({ isHost, players }) {
    return (
        <div>
            <TitleEndpoints />
            <ul>
            {players.map((player, id) => (
                <li key={id}>{player.username}</li>
            ))}
            </ul>
            { isHost ?
                <button>Start Game</button> :
                "Waiting for Host..." 
            }
            
        </div>
        
    )
}