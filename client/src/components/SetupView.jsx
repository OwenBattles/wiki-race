import { LobbyCode } from "./LobbyCode"
import { GameLink } from "./GameLink"
import { GameRange } from "./GameRange"

export function SetupView() {
    return (
        <div>
            <LobbyCode />
            <GameLink />
            <GameRange />
            <button>Start Game</button>
        </div> 
    )
}