export function JoinLobby({ lobbyCode, setLobbyCode, onJoin}) {
    return (
        <div>
            <input 
                className="border p-2 rounded"
                placeholder="Room Code"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value)}
            />
            <button 
                onClick={onJoin}
            >
            Join Lobby    
            </button>
        </div>
    )
}