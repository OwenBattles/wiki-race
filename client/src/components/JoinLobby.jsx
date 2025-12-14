export function JoinLobby({ lobbyCode, setLobbyCode, checkLobbyCode, onJoin, isValidLobbyCode}) {
    const handleLobbyCodeChange = (e) => {
        const newValue = e.target.value;
        setLobbyCode(newValue);
        checkLobbyCode(newValue)
    }
    return (
        <div>
            <input 
                className="border p-2 rounded"
                placeholder="Room Code"
                value={lobbyCode}
                onChange={handleLobbyCodeChange}
            />
            {isValidLobbyCode ? (
                <button onClick={onJoin}>Join Lobby</button>
            ) : (
                <button disabled>
                    <span className="text-gray-500">
                        Join Lobby
                    </span>
                </button>
            )}
        </div>
    )
}